import { Checkpoint, Message } from "./connection";
import {
  expandHidden,
  factor,
  Patch,
  shrinkHidden,
  squash,
  synthesize,
} from "./patch";
import { normalize, rearrange, rebase, Revision, summarize } from "./revision";
import { apply, INITIAL_SNAPSHOT, Snapshot } from "./snapshot";
import { clear, difference, merge, shrink, split, Subseq } from "./subseq";
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
  protected accepted = 0;
  protected sent = 0;
  // TODO: group and squash patches to be sent
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
    const { commit, change } = this.validateVersion(version);
    const commits = this.commits.slice(commit + 1);
    const changes = this.changes.slice(this.accepted);
    let change1 = this.changes.length;
    return rearrange(commits.concat(changes), (rev) => {
      if (rev.client === this.client) {
        change1--;
        return change >= change1;
      }
      return false;
    });
  }

  updateSince(version: Partial<Version> = {}): Update {
    version = this.validateVersion(version);
    const revs = this.revisionsSince(version);
    if (revs.length) {
      let patch = revs.map(synthesize).reduce(squash);
      patch = shrinkHidden(patch, this.hiddenSeqAt(version));
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
    }
    const revs = this.revisionsSince(version);
    let hiddenSeq = this.snapshot.hiddenSeq;
    if (revs.length === 0) {
      return hiddenSeq;
    }
    for (let { insertSeq, deleteSeq, revertSeq } of invert(revs)) {
      deleteSeq = difference(deleteSeq, revertSeq);
      hiddenSeq = difference(hiddenSeq, deleteSeq);
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
    let merged = merge(visible, hidden, hiddenSeq);
    const insertSeq = summarize(revs);
    [merged] = split(merged, insertSeq);
    hiddenSeq = this.hiddenSeqAt(version);
    [visible, hidden] = split(merged, hiddenSeq);
    return { visible, hidden, hiddenSeq };
  }

  edit(
    patch: Patch,
    options: { before?: boolean } & Partial<Version> = {},
  ): Update {
    const { commit, change, before = false } = options;
    const version = this.validateVersion({ commit, change });
    const factored = factor(
      expandHidden(patch, this.hiddenSeqAt(version), { before }),
    );
    let rev: Revision = {
      client: this.client,
      ...factored,
      revertSeq: clear(factored.insertSeq),
    };
    const revs: Revision[] = this.revisionsSince(version);
    [rev] = rebase(rev, revs, () => (before ? -1 : 1));
    rev = normalize(rev, this.hiddenSeqAt());
    this.snapshot = apply(this.snapshot, synthesize(rev));
    this.changes.push(rev);
    if (revs.length) {
      let patch = revs.map(synthesize).reduce(squash);
      patch = shrinkHidden(patch, this.hiddenSeqAt(version));
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
      throw new RangeError(`message.version (${message.version}) out of range`);
    } else if (
      message.client === this.client &&
      message.local !== this.accepted
    ) {
      throw new RangeError(`message.local (${message.local}) out of range`);
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
    rev = normalize(rev, this.hiddenSeqAt({ change: -1 }));
    if (rev.client === this.client) {
      this.accepted++;
      // TODO: delete acked changes
    } else {
      let [rev1, changes] = rebase(rev, this.changes.slice(this.accepted));
      this.snapshot = apply(this.snapshot, synthesize(rev1));
      this.changes = this.changes.slice(0, this.accepted).concat(changes);
    }
    this.commits.push(rev);
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
