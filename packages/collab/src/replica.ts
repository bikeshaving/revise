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
  // TODO: document what each of these members represent
  // TODO: make snapshot the snapshot against the received commit not against every change
  public snapshot: Snapshot;
  protected commits: Revision[];
  // TODO: change type of changes to Patch[]
  protected changes: Revision[] = [];
  protected marks: number[] = [];
  protected accepted = -1;
  protected sent = -1;

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
    const commits: Revision[] = [];
    let i = this.accepted;
    for (const rev of invert(this.commits.slice(commit + 1))) {
      if (rev.client === this.client) {
        i--;
        const changes = this.changes.slice(this.marks[i], this.marks[i + 1]);
        commits.unshift(...changes);
      } else {
        commits.unshift(rev);
      }
    }
    const changes = this.changes.slice(this.marks[this.accepted] || 0);
    let change1 = this.changes.length;
    return rearrange(commits.concat(changes), (rev) => {
      if (rev.client === this.client) {
        change1--;
        return change >= change1;
      }
      return false;
    });
  }

  hiddenSeqAt(version: Partial<Version> = {}): Subseq {
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

  updateSince(version: Partial<Version> = {}): Update {
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

  // TODO: allow an edit to push a new mark so it isn’t squashed with other edits when sent
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
      message.local !== this.accepted + 1
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
    } else {
      const change = this.marks[this.accepted] || 0;
      let [rev1, changes] = rebase(rev, this.changes.slice(change));
      this.snapshot = apply(this.snapshot, synthesize(rev1));
      this.changes = this.changes.slice(0, change).concat(changes);
    }
    this.commits.push(rev);
  }

  pending(): Message[] {
    let start = this.marks[this.sent] || 0;
    const messages: Message[] = [];
    if (
      (!this.marks.length && this.changes.length) ||
      this.marks[this.marks.length - 1] < this.changes.length
    ) {
      this.marks.push(this.changes.length);
    }
    for (const [i, end] of this.marks.slice(this.sent + 1).entries()) {
      const changes = this.changes.slice(start, end);
      const patch = changes.map(synthesize).reduce(squash);
      messages.push({
        data: patch,
        client: this.client,
        local: this.sent + 1 + i,
        received: this.received,
      });
      start = end;
    }
    this.sent += messages.length;
    return messages;
  }
}
