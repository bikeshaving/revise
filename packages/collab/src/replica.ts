import { Checkpoint, Message } from "./connection";
import { factor, Patch, synthesize } from "./patch";
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
      data: this.snapshotAt(this.received, -1),
    };
    return new Replica(client, checkpoint);
  }

  protected revisionsSince(commit: number, change: number): Revision[] {
    if (commit < -1 || commit > this.commits.length - 1) {
      throw new RangeError(`commit (${commit}) out of range`);
    } else if (change < -1 || change > this.changes.length - 1) {
      throw new RangeError(`change (${change}) out of range`);
    }
    const commits = this.commits.slice(commit + 1);
    const changes = this.changes.slice(this.local);
    let i = this.changes.length;
    return rearrange(commits.concat(changes), (rev) => {
      if (rev.client === this.client) {
        i--;
        return change >= i;
      }
      return false;
    });
  }

  hiddenSeqAt(
    commit: number = this.commits.length - 1,
    change: number = this.changes.length - 1,
  ): Subseq {
    if (commit === -1 && change === -1) {
      return INITIAL_SNAPSHOT.hiddenSeq.slice();
    }
    let hiddenSeq = this.snapshot.hiddenSeq;
    const revisions = this.revisionsSince(commit, change);
    for (const { insertSeq, deleteSeq, revertSeq } of invert(revisions)) {
      hiddenSeq = difference(hiddenSeq, difference(deleteSeq, revertSeq));
      hiddenSeq = shrink(hiddenSeq, insertSeq);
    }
    return hiddenSeq;
  }

  snapshotAt(
    commit: number = this.commits.length - 1,
    change: number = this.changes.length - 1,
  ): Snapshot {
    if (commit === -1 && change === -1) {
      return { ...INITIAL_SNAPSHOT };
    }
    const revs = this.revisionsSince(commit, change);
    if (revs.length === 0) {
      return { ...this.snapshot };
    }
    let { visible, hidden, hiddenSeq } = this.snapshot;
    {
      let merged = merge(visible, hidden, hiddenSeq);
      const insertSeq = summarize(revs);
      [merged] = split(merged, insertSeq);
      hiddenSeq = this.hiddenSeqAt(commit, change);
      [visible, hidden] = split(merged, hiddenSeq);
    }
    return { visible, hidden, hiddenSeq };
  }

  // TODO: return info about current commit, change, and a patch to catch up
  edit(
    patch: Patch,
    options: { commit?: number; change?: number; before?: boolean } = {},
  ): void {
    const {
      commit = this.commits.length - 1,
      change = this.changes.length - 1,
      before = false,
    } = options;
    let { inserted, insertSeq, deleteSeq } = factor(patch);
    {
      let hiddenSeq = this.hiddenSeqAt(commit, change);
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
    [rev] = rebase(rev, this.revisionsSince(commit, change), () =>
      before ? -1 : 1,
    );
    const revertSeq = intersection(
      expand(this.snapshot.hiddenSeq, rev.insertSeq),
      rev.deleteSeq,
    );
    this.snapshot = apply(this.snapshot, synthesize(rev));
    rev = { ...rev, revertSeq };
    this.changes.push(rev);
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
      this.local++;
      this.commits.push(rev);
      return;
    }
    const { inserted, insertSeq, deleteSeq } = factor(message.data);
    const revertSeq = clear(insertSeq);
    let rev: Revision = {
      client: message.client,
      inserted,
      insertSeq,
      deleteSeq,
      revertSeq,
    };
    let commits = this.commits.slice(message.received + 1);
    commits = rearrange(commits, (rev1) => rev.client === rev1.client);
    [rev] = rebase(rev, commits);
    // TODO: cache the rearranged/rebased commits by client id somewhere
    let rev1: Revision;
    let changes = this.changes.slice(this.local);
    [rev1, changes] = rebase(rev, changes);
    this.snapshot = apply(this.snapshot, synthesize(rev1));
    this.commits.push(rev);
    this.changes = this.changes.slice(0, this.local).concat(changes);
  }

  // TODO: protect changes and freeze any changes that have been seen outside this class
  pending(): Message[] {
    const messages = this.changes.slice(this.sent).map((change, i) => ({
      data: synthesize(change),
      client: this.client,
      local: this.sent + i,
      received: this.received,
    }));
    this.sent += messages.length;
    return messages;
  }
}
