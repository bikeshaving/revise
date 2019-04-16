import { Message } from "./connection";
import { factor, Patch, synthesize } from "./patch";
import { rearrange, rebase, Revision, summarize } from "./revision";
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

// TODO: move this somewhere else?
function normalize(patch: Patch, hiddenSeq: Subseq): Patch {
  const { inserted, insertSeq, deleteSeq } = factor(patch);
  return synthesize({
    inserted,
    insertSeq,
    deleteSeq: difference(deleteSeq, expand(hiddenSeq, insertSeq)),
  });
}

export class Replica {
  protected local = 0;
  protected sent = 0;
  protected revisions: Revision[];
  constructor(
    public client: string,
    public received: number = -1,
    public snapshot: Snapshot = INITIAL_SNAPSHOT,
  ) {
    if (received < -1) {
      throw new RangeError("received cannot be less than -1");
    }
    this.revisions = new Array(received + 1);
  }

  // TODO: protect revisions and freeze any revisions that have been seen outside this class
  pending(): Message[] {
    const revisions = this.revisions
      .slice(this.received + this.sent + 1)
      .map((rev, i) => ({
        data: rev,
        client: this.client,
        local: this.local + this.sent + i,
        received: this.received,
      }));
    this.sent += revisions.length;
    return revisions;
  }

  clone(client: string): Replica {
    if (client === this.client) {
      throw new Error("Cannot have multiple replicas with the same client id");
    }
    return new Replica(client, this.received, { ...this.snapshot });
  }

  hiddenSeqAt(version: number = this.revisions.length - 1): Subseq {
    if (version < -1 || version > this.revisions.length - 1) {
      throw new RangeError(`version ${version} out of range`);
    } else if (version === -1) {
      return [];
    } else if (version === this.revisions.length - 1) {
      return this.snapshot.hiddenSeq;
    }
    let hiddenSeq = this.snapshot.hiddenSeq;
    for (const rev of invert(this.revisions.slice(version + 1))) {
      const { insertSeq, deleteSeq } = factor(rev.patch);
      hiddenSeq = difference(hiddenSeq, deleteSeq);
      hiddenSeq = shrink(hiddenSeq, insertSeq);
    }
    return hiddenSeq;
  }

  snapshotAt(version: number = this.revisions.length - 1): Snapshot {
    if (version < -1 || version > this.revisions.length - 1) {
      throw new RangeError(`version ${version} out of range`);
    } else if (version === -1) {
      return INITIAL_SNAPSHOT;
    } else if (version === this.revisions.length - 1) {
      return this.snapshot;
    }
    let { visible, hidden, hiddenSeq } = this.snapshot;
    const merged = merge(hidden, visible, hiddenSeq);
    const insertSeq = summarize(this.revisions.slice(version + 1));
    const [, merged1] = split(merged, insertSeq);
    hiddenSeq = this.hiddenSeqAt(version);
    [hidden, visible] = split(merged1, hiddenSeq);
    return { visible, hidden, hiddenSeq };
  }

  edit(
    patch: Patch,
    // TODO: stop using priority in favor a simple boolean and don’t propagate priority to other replicas
    // options: { received?: number; before?: boolean } = {}
    priority?: number,
    version: number = this.revisions.length - 1,
  ): void {
    if (version < -1 || version > this.revisions.length - 1) {
      throw new RangeError(`version ${version} out of range`);
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
    const revisions = this.revisions.slice(version + 1);
    [rev] = rebase(rev, revisions);
    rev = {
      ...rev,
      patch: normalize(rev.patch, this.hiddenSeqAt()),
    };
    this.snapshot = apply(this.snapshot, rev.patch);
    this.revisions.push(rev);
  }

  ingest(message: Message): void {
    let rev = message.data;
    if (message.received < -1 || message.received > this.received) {
      throw new RangeError(`message.received ${message.received} out of range`);
    } else if (message.version !== this.received + 1) {
      // this is handled by client but we add an extra check here
      throw new Error(`unexpected message version ${message.version}`);
    } else if (rev.client === this.client) {
      this.local++;
      this.sent--;
      this.received++;
      // TODO: integrity check??
      return;
    }
    // TODO: cache the rearranged/rebased somewhere
    let revisions = this.revisions.slice(
      message.received + 1,
      this.received + 1,
    );
    revisions = rearrange(revisions, (rev1) => rev.client === rev1.client);
    [rev] = rebase(rev, revisions);
    rev = {
      ...rev,
      patch: normalize(rev.patch, this.hiddenSeqAt(this.received)),
    };
    let rev1: Revision;
    let revisions1 = this.revisions.slice(this.received + 1);
    [rev1, revisions1] = rebase(rev, revisions1);
    this.snapshot = apply(this.snapshot, rev1.patch);
    this.revisions.splice(this.received + 1, revisions1.length, rev);
    this.revisions = this.revisions.concat(revisions1);
    this.received++;
  }
}
