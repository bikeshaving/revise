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

export class Replica {
  constructor(
    public client: string,
    public snapshot: Snapshot = INITIAL_SNAPSHOT,
    // TODO: allow revisions to be a sparse array
    public revisions: Revision[] = [],
    public latest: number = -1,
    public local: number = 0,
  ) {}

  // TODO: protect revisions and freeze any revisions that have been seen outside this class
  get pending(): Revision[] {
    return this.revisions.slice(this.latest + 1);
  }

  clone(client: string): Replica {
    if (client === this.client) {
      throw new Error("Cannot have multiple replicas with the same client id");
    }
    return new Replica(
      client,
      { ...this.snapshot },
      this.revisions.slice(),
      this.latest,
    );
  }

  hiddenSeqAt(version: number): Subseq {
    if (version === 0) {
      return [];
    } else if (version === this.revisions.length) {
      return this.snapshot.hiddenSeq;
    } else if (version < 0 || version > this.revisions.length) {
      throw new RangeError("version out of range");
    }
    let hiddenSeq = this.snapshot.hiddenSeq;
    for (const rev of invert(this.revisions.slice(version))) {
      const { insertSeq, deleteSeq } = factor(rev.patch);
      hiddenSeq = shrink(hiddenSeq, insertSeq);
      hiddenSeq = difference(hiddenSeq, deleteSeq);
    }
    return hiddenSeq;
  }

  snapshotAt(version: number): Snapshot {
    if (version === 0) {
      return INITIAL_SNAPSHOT;
    } else if (version === this.revisions.length) {
      return this.snapshot;
    } else if (version < 0 || version > this.revisions.length) {
      throw new RangeError("version out of range");
    }
    let { visible, hidden, hiddenSeq } = this.snapshot;
    const merged = merge(hidden, visible, hiddenSeq);
    const insertSeq = summarize(this.revisions.slice(version));
    const [, merged1] = split(merged, insertSeq);
    hiddenSeq = this.hiddenSeqAt(version);
    [hidden, visible] = split(merged1, hiddenSeq);
    return { visible, hidden, hiddenSeq };
  }

  patchAt(version: number): Patch {
    if (version < 0 || version > this.revisions.length - 1) {
      throw new RangeError("version out of range");
    }
    const rev = this.revisions[version];
    let { inserted, insertSeq, deleteSeq } = factor(rev.patch);
    const hiddenSeq = this.hiddenSeqAt(version);
    insertSeq = shrink(insertSeq, expand(hiddenSeq, insertSeq));
    deleteSeq = shrink(deleteSeq, hiddenSeq);
    return synthesize({ inserted, insertSeq, deleteSeq });
  }

  dedupe(rev: Revision, version = this.revisions.length): Revision {
    const { inserted, insertSeq, deleteSeq } = factor(rev.patch);
    const hiddenSeq = this.hiddenSeqAt(version);
    return {
      ...rev,
      patch: synthesize({
        inserted,
        insertSeq,
        deleteSeq: difference(deleteSeq, hiddenSeq),
      }),
    };
  }

  edit(
    patch: Patch,
    priority?: number,
    version: number = this.revisions.length,
  ): Revision {
    if (version < 0 || version > this.revisions.length) {
      throw new RangeError("version out of range");
    }
    let { inserted, insertSeq, deleteSeq } = factor(patch);
    const hiddenSeq = this.hiddenSeqAt(version);
    [, insertSeq] = interleave(hiddenSeq, insertSeq);
    deleteSeq = expand(deleteSeq, hiddenSeq);
    let rev: Revision = {
      patch: synthesize({ inserted, insertSeq, deleteSeq }),
      client: this.client,
      priority,
    };
    [rev] = rebase(rev, this.revisions.slice(version));
    rev = this.dedupe(rev);
    this.snapshot = apply(this.snapshot, rev.patch);
    this.revisions.push(rev);
    return rev;
  }

  revert(version: number): Revision {
    if (version < 0 || version > this.revisions.length - 1) {
      throw new RangeError("version out of range");
    }
    let rev: Revision = this.revisions[version];
    if (rev == null) {
      throw new Error("revision not found");
    }
    let { insertSeq: deleteSeq, deleteSeq: insertSeq } = factor(rev.patch);
    insertSeq = expand(insertSeq, deleteSeq);
    if (version <= this.revisions.length - 1) {
      const insertSeq1 = summarize(this.revisions.slice(version + 1));
      deleteSeq = expand(deleteSeq, insertSeq1);
      insertSeq = expand(insertSeq, insertSeq1);
    }
    const { visible, hidden, hiddenSeq } = this.snapshot;
    const [inserted] = split(merge(hidden, visible, hiddenSeq), insertSeq);
    [, insertSeq] = interleave(insertSeq, insertSeq);
    rev = {
      patch: synthesize({ inserted, insertSeq, deleteSeq }),
      client: this.client,
    };
    this.snapshot = apply(this.snapshot, rev.patch);
    this.revisions.push(rev);
    return rev;
  }

  ingest(rev: Revision, version: number): Revision {
    if (version < -1 || version > this.latest) {
      throw new RangeError("version out of range");
    }
    if (rev.client === this.client) {
      this.local++;
      this.latest++;
      // TODO: integrity check??
      return this.revisions[this.latest];
    }
    // TODO: cache the rearranged/rebased somewhere
    const revisions = rearrange(
      this.revisions.slice(version + 1, this.latest + 1),
      (rev1) => rev1.client === rev.client,
    );
    [rev] = rebase(rev, revisions);
    // TODO: do we need to dedupe here?
    const [rev1, revisions1] = rebase(
      rev,
      this.revisions.slice(this.latest + 1),
    );
    this.snapshot = apply(this.snapshot, rev1.patch);
    this.revisions.splice(this.latest + 1, revisions1.length, rev);
    this.revisions = this.revisions.concat(revisions1);
    this.latest++;
    return rev1;
  }
}