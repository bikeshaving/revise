import { factor, Patch, synthesize } from "./patch";
import * as subseq from "./subseq";
import { Subseq } from "./subseq";
import { findLastIndex } from "./utils";

export interface Snapshot {
  visible: string;
  hidden: string;
  hiddenSeq: Subseq;
  // TODO: move this property to its own interface
  version: number;
}

export interface Revision {
  patch: Patch;
  client: string;
  priority?: number;
  // TODO: move these properties to their own interface
  global?: number;
  local: number;
  latest: number;
}

export function prioritize(rev1: Revision, rev2: Revision): number {
  const { priority: priority1 = 0, client: client1 } = rev1;
  const { priority: priority2 = 0, client: client2 } = rev2;
  if (priority1 < priority2) {
    return -1;
  } else if (priority1 > priority2) {
    return 1;
  } else if (client1 < client2) {
    return -1;
  } else if (client1 > client2) {
    return 1;
  }
  return 0;
}

export const INITIAL_SNAPSHOT: Snapshot = Object.freeze({
  visible: "",
  hidden: "",
  hiddenSeq: [],
  version: 0,
});

export class Replica {
  // TODO: move this property to clients
  public latest: number;
  constructor(
    public client: string,
    public snapshot: Snapshot = INITIAL_SNAPSHOT,
    // TODO: allow revisions to be a sparse array
    public revisions: Revision[] = [],
    // TODO: move this property to clients
    public local = 0,
  ) {
    this.latest = this.snapshot.version - 1;
  }

  static from(
    client: string,
    snapshot: Snapshot,
    revisions: Revision[] = [],
  ): Replica {
    const doc = new Replica(client, snapshot, []);
    for (const rev of revisions) {
      doc.ingest(rev);
    }
    return doc;
  }

  protected apply(rev: Revision): void {
    let { inserted, insertSeq, deleteSeq } = factor(rev.patch);
    let { visible, hidden, hiddenSeq, version } = this.snapshot;
    if (subseq.count(deleteSeq, true) > 0) {
      const hiddenSeq1 = subseq.union(hiddenSeq, deleteSeq);
      [hidden, visible] = subseq.shuffle(
        hidden,
        visible,
        hiddenSeq,
        hiddenSeq1,
      );
      hiddenSeq = hiddenSeq1;
    }
    if (inserted.length) {
      hiddenSeq = subseq.expand(hiddenSeq, insertSeq);
      const insertSeq1 = subseq.shrink(insertSeq, hiddenSeq);
      visible = subseq.merge(inserted, visible, insertSeq1);
    }
    this.snapshot = { visible, hidden, hiddenSeq, version: version + 1 };
  }

  protected rebase(
    rev: Revision,
    start: number,
    end: number = this.revisions.length,
    options: { mutate?: boolean } = {},
  ): Revision {
    const revisions = this.revisions.slice(start, end);
    if (!revisions.length) {
      return rev;
    }
    const { mutate = false } = options;
    let { inserted, insertSeq, deleteSeq } = factor(rev.patch);
    for (const [i, rev1] of revisions.entries()) {
      const priority = prioritize(rev, rev1);
      if (priority === 0) {
        throw new Error("Concurrent edits with same client and priority");
      }
      let {
        inserted: inserted1,
        insertSeq: insertSeq1,
        deleteSeq: deleteSeq1,
      } = factor(rev1.patch);
      if (mutate) {
        deleteSeq1 = subseq.difference(deleteSeq1, deleteSeq);
        deleteSeq1 = subseq.expand(deleteSeq1, insertSeq);
      }
      deleteSeq = subseq.expand(deleteSeq, insertSeq1);
      if (priority < 0) {
        [insertSeq, insertSeq1] = subseq.interleave(insertSeq, insertSeq1);
      } else {
        [insertSeq1, insertSeq] = subseq.interleave(insertSeq1, insertSeq);
      }
      if (mutate) {
        revisions[i] = {
          ...rev1,
          patch: synthesize({
            inserted: inserted1,
            insertSeq: insertSeq1,
            deleteSeq: deleteSeq1,
          }),
          latest: rev.global == null ? rev1.latest : rev.global,
        };
      }
    }
    const hiddenSeq = this.hiddenSeqAt(end);
    deleteSeq = subseq.difference(deleteSeq, hiddenSeq);
    rev = { ...rev, patch: synthesize({ inserted, insertSeq, deleteSeq }) };
    if (mutate) {
      this.revisions.splice(start, revisions.length, ...revisions);
    }
    return rev;
  }

  protected summarize(start: number, end?: number, exclude?: string): Subseq {
    const revisions = this.revisions.slice(start, end);
    if (!revisions.length) {
      throw new Error("Empty revisions");
    }
    const rev = revisions[0];
    let { insertSeq } = factor(rev.patch);
    if (rev.client === exclude) {
      insertSeq = subseq.clear(insertSeq);
    }
    for (const rev of revisions.slice(1)) {
      const { insertSeq: insertSeq1 } = factor(rev.patch);
      insertSeq = subseq.expand(insertSeq, insertSeq1, {
        union: rev.client !== exclude,
      });
    }
    return insertSeq;
  }

  clone(client: string): Replica {
    if (client === this.client) {
      throw new Error("Cannot have multiple clients per Replica");
    }
    return new Replica(client, { ...this.snapshot }, this.revisions.slice());
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
    const revisions = this.revisions.slice(version).reverse();
    for (const rev of revisions) {
      const { insertSeq, deleteSeq } = factor(rev.patch);
      hiddenSeq = subseq.shrink(hiddenSeq, insertSeq);
      hiddenSeq = subseq.difference(hiddenSeq, deleteSeq);
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
    const merged = subseq.merge(hidden, visible, hiddenSeq);
    const insertSeq = this.summarize(version);
    const [, merged1] = subseq.split(merged, insertSeq);
    const hiddenSeq1 = this.hiddenSeqAt(version);
    [hidden, visible] = subseq.split(merged1, hiddenSeq1);
    return { visible, hidden, hiddenSeq: hiddenSeq1, version };
  }

  patchAt(version: number): Patch {
    if (version < 0 || version > this.revisions.length - 1) {
      throw new RangeError("version out of range");
    }
    const rev = this.revisions[version];
    let { inserted, insertSeq, deleteSeq } = factor(rev.patch);
    const hiddenSeq = this.hiddenSeqAt(version);
    insertSeq = subseq.shrink(insertSeq, subseq.expand(hiddenSeq, insertSeq));
    deleteSeq = subseq.shrink(deleteSeq, hiddenSeq);
    return synthesize({ inserted, insertSeq, deleteSeq });
  }

  edit(
    patch: Patch,
    options: { parent?: number; priority?: number } = {},
  ): Revision {
    const { parent = this.revisions.length, priority = 0 } = options;
    if (parent < 0 || parent > this.revisions.length) {
      throw new RangeError("version out of range");
    }
    let { inserted, insertSeq, deleteSeq } = factor(patch);
    const hiddenSeq = this.hiddenSeqAt(parent);
    [, insertSeq] = subseq.interleave(hiddenSeq, insertSeq);
    deleteSeq = subseq.expand(deleteSeq, hiddenSeq);
    let rev: Revision = {
      patch: synthesize({ inserted, insertSeq, deleteSeq }),
      client: this.client,
      priority,
      local: this.local,
      latest: this.latest,
    };
    rev = this.rebase(rev, parent);
    this.apply(rev);
    this.revisions.push(rev);
    this.local++;
    return rev;
  }

  revert(version: number): Revision {
    if (version < 0 || version > this.revisions.length - 1) {
      throw new RangeError("version out of range");
    }
    let rev = this.revisions[version];
    if (rev == null) {
      throw new Error("revision not found");
    }
    let { insertSeq: deleteSeq, deleteSeq: insertSeq } = factor(rev.patch);
    insertSeq = subseq.expand(insertSeq, deleteSeq);
    if (version <= this.revisions.length - 1) {
      const insertSeq1 = this.summarize(version + 1);
      deleteSeq = subseq.expand(deleteSeq, insertSeq1);
      insertSeq = subseq.expand(insertSeq, insertSeq1);
    }
    const { visible, hidden, hiddenSeq } = this.snapshot;
    const [inserted] = subseq.split(
      subseq.merge(hidden, visible, hiddenSeq),
      insertSeq,
    );
    [, insertSeq] = subseq.interleave(insertSeq, insertSeq);
    rev = {
      patch: synthesize({ inserted, insertSeq, deleteSeq }),
      client: this.client,
      local: this.local,
      latest: this.latest,
    };
    this.apply(rev);
    this.revisions.push(rev);
    this.local++;
    return rev;
  }

  // TODO: pass in rev.latest, and maybe this.latest?
  // ingest(rev: Revision, last: number): Revision {
  ingest(rev: Revision): Revision {
    // TODO: move this logic to clients
    if (rev.global == null) {
      throw new Error("Revision missing global version");
    } else if (this.latest < rev.latest || this.latest + 1 < rev.global) {
      // TODO: attempt repair
      throw new Error("Missing revision");
    } else if (rev.global <= this.latest) {
      return rev;
    } else if (rev.client === this.client) {
      if (!this.revisions[rev.global]) {
        throw new Error("Missing revision");
      }
      // TODO: integrity check to make sure revisions are the same
      this.revisions[rev.global].global = rev.global;
      this.latest = rev.global;
      return rev;
    }
    const latest = Math.max(
      rev.latest,
      findLastIndex(this.revisions, (rev1) => rev.client === rev1.client),
      0,
    );
    if (rev.latest > -1 && rev.latest < latest) {
      let { inserted, insertSeq, deleteSeq } = factor(rev.patch);
      const insertSeq1 = this.summarize(rev.latest + 1, latest + 1, rev.client);
      insertSeq = subseq.expand(insertSeq, insertSeq1);
      deleteSeq = subseq.expand(deleteSeq, insertSeq1);
      rev = { ...rev, patch: synthesize({ inserted, insertSeq, deleteSeq }) };
    }
    rev = this.rebase(rev, latest + 1, this.latest + 1);
    const rev1 = this.rebase(rev, this.latest + 1, undefined, { mutate: true });
    this.apply(rev1);
    this.revisions.splice(this.latest + 1, 0, rev);
    this.latest = rev.global!;
    return rev;
  }

  // TODO: freeze revisions that have been read
  get pending(): Revision[] {
    return this.revisions.slice(this.latest + 1);
  }
}
