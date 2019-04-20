import { Checkpoint, Message } from "./connection";
import {
  factor,
  normalize,
  Patch,
  rearrange,
  rebase,
  summarize,
  synthesize,
} from "./patch";
import { apply, INITIAL_SNAPSHOT, Snapshot } from "./snapshot";
import {
  difference,
  expand,
  interleave,
  merge,
  shrink,
  split,
  Subseq,
} from "./subseq";
import { invert } from "./utils";

export interface Commit {
  patch: Patch;
  client: string;
}

export interface Change {
  patch: Patch;
  received: number;
}

export class Replica {
  public snapshot: Snapshot;
  protected commits: Commit[];
  protected changes: Change[] = [];
  protected local = 0;
  protected sent = 0;
  // TODO: summarize patches before sending them using groups
  // protected groups: number[] = [];

  get received(): number {
    return this.commits.length - 1;
  }

  get maxVersion(): number {
    return this.commits.length + this.changes.length - 1 - this.local;
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

  // TODO: protect changes and freeze any changes that have been seen outside this class
  pending(): Message[] {
    const messages = this.changes.slice(this.sent).map((change, i) => ({
      data: change.patch,
      client: this.client,
      local: this.sent + i,
      received: this.received,
    }));
    this.sent += messages.length;
    return messages;
  }

  clone(client: string): Replica {
    if (client === this.client) {
      throw new Error("Cannot have multiple replicas with the same client id");
    }
    const checkpoint: Checkpoint = {
      version: this.received,
      data: this.snapshotAt(this.received),
    };
    return new Replica(client, checkpoint);
  }

  hiddenSeqAt(version: number = this.maxVersion): Subseq {
    if (version < -1 || version > this.maxVersion) {
      throw new RangeError(`version (${version}) out of range`);
    } else if (version === -1) {
      return [];
    } else if (version === this.maxVersion) {
      return this.snapshot.hiddenSeq.slice();
    }
    let hiddenSeq = this.snapshot.hiddenSeq;
    const commits = this.commits.slice(version + 1);
    const changes = this.changes.slice(
      this.local + Math.max(0, version + 1 - this.commits.length),
    );
    for (const rev of invert(commits.concat(changes as any))) {
      const { insertSeq, deleteSeq } = factor(rev.patch);
      hiddenSeq = difference(hiddenSeq, deleteSeq);
      hiddenSeq = shrink(hiddenSeq, insertSeq);
    }
    return hiddenSeq;
  }

  snapshotAt(version: number = this.maxVersion): Snapshot {
    if (version < -1 || version > this.maxVersion) {
      throw new RangeError(`version (${version}) out of range`);
    } else if (version === -1) {
      return INITIAL_SNAPSHOT;
    } else if (version === this.maxVersion) {
      return { ...this.snapshot };
    }
    const commits = this.commits.slice(version + 1);
    const changes = this.changes.slice(
      this.local + Math.max(0, version + 1 - this.commits.length),
    );
    const patches = commits.concat(changes as any).map((c) => c.patch);
    const { insertSeq } = factor(summarize(patches));
    let { visible, hidden, hiddenSeq } = this.snapshot;
    {
      let merged = merge(visible, hidden, hiddenSeq);
      [merged] = split(merged, insertSeq);
      hiddenSeq = this.hiddenSeqAt(version);
      [visible, hidden] = split(merged, hiddenSeq);
    }
    return { visible, hidden, hiddenSeq };
  }

  edit(
    patch: Patch,
    options: { version?: number; before?: boolean } = {},
  ): void {
    const { version = this.maxVersion, before = false } = options;
    if (version < -1 || version > this.maxVersion) {
      throw new RangeError(`version (${version}) out of range`);
    }
    let { inserted, insertSeq, deleteSeq } = factor(patch);
    {
      let hiddenSeq = this.hiddenSeqAt(version);
      if (before) {
        [insertSeq, hiddenSeq] = interleave(insertSeq, hiddenSeq);
      } else {
        [hiddenSeq, insertSeq] = interleave(hiddenSeq, insertSeq);
      }
      deleteSeq = expand(deleteSeq, hiddenSeq);
    }
    let change: Change = {
      patch: synthesize({ inserted, insertSeq, deleteSeq }),
      received: this.received,
    };
    const commits = this.commits.slice(version + 1);
    [change] = rebase(change, commits, () => 1);
    const changes = this.changes.slice(
      this.local + Math.max(0, version - this.received),
    );
    [change] = rebase(change, changes, () => (before ? -1 : 1));
    change.patch = normalize(change.patch, this.hiddenSeqAt());
    this.snapshot = apply(this.snapshot, change.patch);
    this.changes.push(change);
  }

  ingest(message: Message): void {
    let commit: Commit = { patch: message.data, client: message.client };
    if (message.received < -1 || message.received > this.received) {
      throw new RangeError(
        `message.received (${message.received}) out of range`,
      );
    } else if (message.version !== this.received + 1) {
      throw new Error(`unexpected message.version (${message.version})`);
    } else if (commit.client === this.client) {
      // TODO: integrity check??
      const change = this.changes[this.local];
      if (change == null) {
        throw new Error("missing change");
      }
      this.local++;
      this.commits.push({ patch: change.patch, client: this.client });
      return;
    }
    let commits = this.commits.slice(message.received + 1);
    // TODO: cache the rearranged/rebased somewhere
    commits = rearrange(commits, (commit1) => commit.client === commit1.client);
    [commit] = rebase(commit, commits, (c1, c2) =>
      c1.client < c2.client ? -1 : c1.client > c2.client ? 1 : 0,
    );
    commit.patch = normalize(commit.patch, this.hiddenSeqAt(this.received));
    const [commit1, changes] = rebase(
      commit,
      this.changes.slice(this.local),
      (c) => (c.client < this.client ? -1 : c.client > this.client ? 1 : 0),
    );
    this.snapshot = apply(this.snapshot, commit1.patch);
    this.commits.push(commit);
    this.changes = this.changes.slice(0, this.local).concat(
      changes.map((change) => ({
        patch: change.patch,
        received: this.received,
      })),
    );
  }
}
