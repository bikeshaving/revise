import { Checkpoint, Message } from "./connection";
import { factor, normalize, Patch, summarize, synthesize } from "./patch";
import { rearrange, rebase, Revision } from "./revision";
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

export class Replica {
  protected local = 0;
  protected commits: Revision[];
  protected changes: Revision[] = [];
  // TODO: delete sent and use groups
  protected sent = 0;
  // protected groups = number[] = [];
  public snapshot: Snapshot;

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
    // TODO: delete or compute based on length of this.revisions
    this.snapshot = checkpoint.data;
    this.commits = new Array(checkpoint.version + 1);
  }

  // TODO: protect revisions and freeze any revisions that have been seen outside this class
  // TODO: rollback this.sent on failure
  pending(): Message[] {
    const messages = this.changes.slice(this.sent).map((rev, i) => ({
      data: rev,
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
    return new Replica(client, {
      version: this.received,
      data: this.snapshotAt(this.received),
    });
  }

  hiddenSeqAt(version: number = this.maxVersion): Subseq {
    if (version < -1 || version > this.maxVersion) {
      throw new RangeError(`version (${version}) out of range`);
    } else if (version === -1) {
      return [];
    } else if (version === this.maxVersion) {
      return this.snapshot.hiddenSeq;
    }
    let hiddenSeq = this.snapshot.hiddenSeq;
    const commits = this.commits.slice(version + 1);
    const changes = this.changes.slice(
      this.local + Math.max(0, version + 1 - this.commits.length),
    );
    const revisions = commits.concat(changes);
    for (const rev of invert(revisions)) {
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
    const patches = commits.concat(changes).map((change) => change.patch);
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
    // TODO: stop using priority in favor a simple boolean and don’t propagate priority to other replicas
    // options: { received?: number; before?: boolean } = {},
    priority?: number,
    version: number = this.maxVersion,
  ): void {
    if (version < -1 || version > this.maxVersion) {
      throw new RangeError(`version (${version}) out of range`);
    }
    let { inserted, insertSeq, deleteSeq } = factor(patch);
    {
      let hiddenSeq = this.hiddenSeqAt(version);
      // TODO: use before to determine interleave order
      [hiddenSeq, insertSeq] = interleave(hiddenSeq, insertSeq);
      deleteSeq = expand(deleteSeq, hiddenSeq);
    }
    let rev: Revision = {
      patch: synthesize({ inserted, insertSeq, deleteSeq }),
      client: this.client,
      priority,
    };
    const commits = this.commits.slice(version + 1);
    const changes = this.changes.slice(
      this.local + Math.max(0, version + 1 - this.commits.length),
    );
    const revisions = commits.concat(changes);
    [rev] = rebase(rev, revisions);
    rev = {
      ...rev,
      patch: normalize(rev.patch, this.hiddenSeqAt()),
    };
    this.snapshot = apply(this.snapshot, rev.patch);
    this.changes.push(rev);
  }

  ingest(message: Message): void {
    let rev = message.data;
    if (message.received < -1 || message.received > this.received) {
      throw new RangeError(
        `message.received (${message.received}) out of range`,
      );
    } else if (message.version !== this.received + 1) {
      // this is handled by client but we add an extra check here
      throw new Error(`unexpected message version (${message.version})`);
    } else if (rev.client === this.client) {
      // TODO: integrity check??
      const change = this.changes[this.local];
      if (change == null) {
        throw new Error("missing change");
      }
      this.local++;
      this.commits.push(change);
      return;
    }
    // TODO: cache the rearranged/rebased somewhere
    let commits = this.commits.slice(message.received + 1);
    commits = rearrange(commits, (rev1) => rev.client === rev1.client);
    [rev] = rebase(rev, commits);
    rev = {
      ...rev,
      patch: normalize(rev.patch, this.hiddenSeqAt(this.received)),
    };
    let rev1: Revision;
    let changes = this.changes.slice(this.local);
    [rev1, changes] = rebase(rev, changes);
    this.snapshot = apply(this.snapshot, rev1.patch);
    this.commits.push(rev);
    this.changes.splice(this.local, changes.length, ...changes);
  }
}
