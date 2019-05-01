import { Checkpoint, Message } from "./connection";
import {
  cleanup,
  factor,
  Patch,
  shrink as shrinkPatch,
  squash,
  synthesize,
} from "./patch";
import { rearrange, rebase, Revision, summarize } from "./revision";
import { apply, INITIAL_SNAPSHOT, Snapshot } from "./snapshot";
import {
  clear,
  difference,
  expand,
  interleave,
  intersection,
  merge,
  shrink,
  split,
  Subseq,
} from "./subseq";
import { invert } from "./utils";

export interface Version {
  readonly commit: number;
  readonly change: number;
}

export interface Update extends Version {
  readonly patch?: Patch;
}

export class Replica {
  public snapshot: Snapshot;
  protected commits: Revision[];
  protected changes: Revision[] = [];
  protected local = 0;
  protected sent = 0;
  // TODO: summarize patches before sending them using groups
  // protected groups: number[] = [];

  get received(): number {
    return this.commits.length - 1;
  }

  get currentVersion(): Version {
    return {
      commit: this.commits.length - 1,
      change: this.changes.length - 1,
    };
  }

  constructor(
    public client: string,
    checkpoint: Checkpoint = { version: -1, data: INITIAL_SNAPSHOT },
  ) {
    if (checkpoint.version < -1) {
      throw new RangeError(
        `checkpoint.version (${checkpoint.version}) out of range`,
      );
    }
    this.snapshot = checkpoint.data;
    this.commits = new Array(checkpoint.version + 1);
  }

  clone(client: string): Replica {
    if (client === this.client) {
      throw new Error("Cannot have multiple replicas with the same client id");
    }
    const checkpoint: Checkpoint = {
      version: this.received,
      data: this.snapshotAt({ commit: this.received, change: -1 }),
    };
    return new Replica(client, checkpoint);
  }

  protected validateVersion(version: Partial<Version>): Version {
    const {
      commit = this.commits.length - 1,
      change = this.changes.length - 1,
    } = version;
    if (commit < -1 || commit > this.commits.length - 1) {
      throw new RangeError(`commit (${commit}) out of range`);
    } else if (change < -1 || change > this.changes.length - 1) {
      throw new RangeError(`change (${change}) out of range`);
    }
    return { commit, change };
  }

  protected revisionsSince(version: Partial<Version> = {}): Revision[] {
    version = this.validateVersion(version);
    const commits = this.commits.slice(version.commit! + 1);
    const changes = this.changes.slice(this.local);
    let change = this.changes.length;
    return rearrange(commits.concat(changes), (rev) => {
      if (rev.client === this.client) {
        change--;
        return version.change! >= change;
      }
      return false;
    });
  }

  updateSince(version: Partial<Version> = {}): Update {
    version = this.validateVersion(version);
    const revs = this.revisionsSince(version);
    if (revs.length) {
      let patch = revs.map(synthesize).reduce(squash);
      const { insertSeq } = factor(patch);
      const hiddenSeq = expand(this.hiddenSeqAt(version), insertSeq);
      patch = shrinkPatch(patch, hiddenSeq);
      patch = cleanup(patch);
      return {
        patch,
        commit: this.commits.length - 1,
        change: this.changes.length - 1,
      };
    }
    return { commit: this.commits.length - 1, change: this.changes.length - 1 };
  }

  hiddenSeqAt(version: Partial<Version> = {}): Subseq {
    version = this.validateVersion(version);
    if (version.commit === -1 && version.change === -1) {
      return INITIAL_SNAPSHOT.hiddenSeq.slice();
    } else if (
      version.commit === this.commits.length - 1 &&
      version.change === this.changes.length - 1
    ) {
      return this.snapshot.hiddenSeq.slice();
    }
    let hiddenSeq = this.snapshot.hiddenSeq;
    const revisions = this.revisionsSince(version);
    for (const { insertSeq, deleteSeq, revertSeq } of invert(revisions)) {
      hiddenSeq = difference(hiddenSeq, difference(deleteSeq, revertSeq));
      hiddenSeq = shrink(hiddenSeq, insertSeq);
    }
    return hiddenSeq;
  }

  snapshotAt(version: Partial<Version> = {}): Snapshot {
    version = this.validateVersion(version);
    if (version.commit === -1 && version.change === -1) {
      return { ...INITIAL_SNAPSHOT };
    }
    const revs = this.revisionsSince(version);
    if (revs.length === 0) {
      return { ...this.snapshot };
    }
    let { visible, hidden, hiddenSeq } = this.snapshot;
    {
      let merged = merge(visible, hidden, hiddenSeq);
      const insertSeq = summarize(revs);
      [merged] = split(merged, insertSeq);
      hiddenSeq = this.hiddenSeqAt(version);
      [visible, hidden] = split(merged, hiddenSeq);
    }
    return { visible, hidden, hiddenSeq };
  }

  edit(
    patch: Patch,
    options: { before?: boolean } & Partial<Version> = {},
  ): Update {
    const { commit, change, before = false } = options;
    const version = this.validateVersion({ commit, change });
    let { inserted, insertSeq, deleteSeq } = factor(patch);
    let hiddenSeq = this.hiddenSeqAt(version);
    {
      if (before) {
        [insertSeq, hiddenSeq] = interleave(insertSeq, hiddenSeq);
      } else {
        [hiddenSeq, insertSeq] = interleave(hiddenSeq, insertSeq);
      }
      deleteSeq = expand(deleteSeq, hiddenSeq);
    }
    let rev: Revision = {
      client: this.client,
      inserted,
      insertSeq,
      deleteSeq,
      revertSeq: clear(insertSeq),
    };
    const revs: Revision[] = this.revisionsSince(version);
    [rev] = rebase(rev, revs, () => (before ? -1 : 1));
    rev = {
      ...rev,
      revertSeq: intersection(
        rev.deleteSeq,
        expand(this.snapshot.hiddenSeq, rev.insertSeq),
      ),
    };
    this.snapshot = apply(this.snapshot, synthesize(rev));
    this.changes.push(rev);
    if (revs.length) {
      let patch = revs.map(synthesize).reduce(squash);
      const { insertSeq } = factor(patch);
      const hiddenSeq1 = expand(this.hiddenSeqAt(version), insertSeq);
      patch = shrinkPatch(patch, hiddenSeq1);
      patch = cleanup(patch);
      return {
        patch,
        commit: this.commits.length - 1,
        change: this.changes.length - 1,
      };
    }
    return {
      commit: this.commits.length - 1,
      change: this.changes.length - 1,
    };
  }

  ingest(message: Message): void {
    if (message.received < -1 || message.received > this.received) {
      throw new RangeError(
        `message.received (${message.received}) out of range`,
      );
    } else if (message.version !== this.received + 1) {
      throw new Error(`unexpected message.version (${message.version})`);
    } else if (message.client === this.client) {
      const rev = this.changes[this.local];
      if (rev == null) {
        throw new Error("missing change");
      } else if (message.local !== this.local) {
        throw new Error(`unexpected message.local (${message.local})`);
      }
      delete this.changes[this.local];
      this.local++;
      this.commits.push(rev);
      return;
    }
    const { inserted, insertSeq, deleteSeq } = factor(message.data);
    let rev: Revision = {
      client: message.client,
      inserted,
      insertSeq,
      deleteSeq,
      revertSeq: clear(insertSeq),
    };
    const commits = rearrange(
      this.commits.slice(message.received + 1),
      (rev1) => rev.client === rev1.client,
    );
    [rev] = rebase(rev, commits);
    // TODO: cache the rearranged/rebased commits by client id
    let [rev1, changes] = rebase(rev, this.changes.slice(this.local));
    this.snapshot = apply(this.snapshot, synthesize(rev1));
    this.commits.push(rev);
    this.changes = this.changes.slice(0, this.local).concat(changes);
  }

  // TODO: squash changes
  // TODO: protect changes and freeze any changes that have been seen outside this class
  pending(): Message[] {
    const messages = this.changes.slice(this.sent).map((rev, i) => ({
      data: synthesize(rev),
      client: this.client,
      local: this.sent + i,
      received: this.received,
    }));
    this.sent += messages.length;
    return messages;
  }
}
