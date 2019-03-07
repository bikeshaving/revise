import { factor, Patch, synthesize } from "./patch";
import {
  clear,
  count,
  difference,
  empty,
  expand,
  full,
  interleave,
  merge,
  union,
  shrink,
  shuffle,
  split,
  Subseq,
} from "./subseq";

export interface Snapshot {
  visible: string;
  hidden: string;
  hiddenSeq: Subseq;
  version: number;
}

export interface Revision {
  patch: Patch;
  client: string;
  priority?: number;
  global?: number;
  local: number;
  latest: number;
}

export function compare(rev1: Revision, rev2: Revision): number {
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

// TODO: make this a method instead?
export function rebase(
  rev: Revision,
  revisions: Revision[],
  hiddenSeq: Subseq,
): [Revision, Revision[]] {
  let { inserted, insertSeq, deleteSeq } = factor(rev.patch);
  const revisions1: Revision[] = [];
  for (const rev1 of revisions) {
    const comp = compare(rev, rev1);
    if (comp === 0) {
      throw new Error("Concurrent edits same client and priority");
    }
    let {
      inserted: inserted1,
      insertSeq: insertSeq1,
      deleteSeq: deleteSeq1,
    } = factor(rev1.patch);
    deleteSeq1 = difference(deleteSeq1, deleteSeq);
    deleteSeq1 = expand(deleteSeq1, insertSeq);
    deleteSeq = expand(deleteSeq, insertSeq1);
    if (comp < 0) {
      [insertSeq, insertSeq1] = interleave(insertSeq, insertSeq1);
    } else {
      [insertSeq1, insertSeq] = interleave(insertSeq1, insertSeq);
    }
    revisions1.push({
      ...rev1,
      patch: synthesize({
        inserted: inserted1,
        insertSeq: insertSeq1,
        deleteSeq: deleteSeq1,
      }),
      latest: rev.global == null ? rev1.latest : rev.global,
    });
  }
  deleteSeq = difference(deleteSeq, hiddenSeq);
  rev = { ...rev, patch: synthesize({ inserted, insertSeq, deleteSeq }) };
  return [rev, revisions1];
}

// TODO: make this a method instead?
// TODO: cache or memoize this
export function summarize(revisions: Revision[], client?: string): Subseq {
  if (!revisions.length) {
    throw new Error("Empty revisions");
  }
  const rev = revisions[0];
  let { insertSeq } = factor(rev.patch);
  if (rev.client === client) {
    insertSeq = clear(insertSeq);
  }
  for (const rev of revisions.slice(1)) {
    const { insertSeq: insertSeq1 } = factor(rev.patch);
    insertSeq = expand(insertSeq, insertSeq1, {
      union: client !== rev.client,
    });
  }
  return insertSeq;
}

export class Document {
  constructor(
    public client: string,
    public snapshot: Snapshot,
    // TODO: make revisions a sparse array
    public revisions: Revision[],
    public latest = -1,
    public local = 0,
  ) {}

  static create(client: string, initial: string = ""): Document {
    const snapshot: Snapshot = {
      visible: initial,
      hidden: "",
      hiddenSeq: empty(initial.length),
      version: 0,
    };
    const patch = synthesize({
      inserted: initial,
      insertSeq: full(initial.length),
    });
    const rev: Revision = { patch, client, local: 0, latest: -1 };
    return new Document(client, snapshot, [rev], -1, 1);
  }

  static from(
    client: string,
    snapshot: Snapshot,
    revisions: Revision[] = [],
  ): Document {
    const doc = new Document(client, snapshot, [], snapshot.version);
    for (const rev of revisions) {
      doc.ingest(rev);
    }
    return doc;
  }

  hiddenSeqAt(version: number): Subseq {
    let hiddenSeq = this.snapshot.hiddenSeq;
    const revisions = this.revisions.slice(version + 1).reverse();
    for (const rev of revisions) {
      const { insertSeq, deleteSeq } = factor(rev.patch);
      hiddenSeq = shrink(hiddenSeq, insertSeq);
      hiddenSeq = difference(hiddenSeq, deleteSeq);
    }
    return hiddenSeq;
  }

  snapshotAt(version: number): Snapshot {
    if (version >= this.revisions.length - 1) {
      return this.snapshot;
    }
    let { visible, hidden, hiddenSeq } = this.snapshot;
    const insertSeq = summarize(this.revisions.slice(version + 1));
    let merged = merge(hidden, visible, hiddenSeq);
    [, merged] = split(merged, insertSeq);
    const hiddenSeq1 = this.hiddenSeqAt(version);
    [hidden, visible] = split(merged, hiddenSeq1);
    return { visible, hidden, hiddenSeq: hiddenSeq1, version };
  }

  patchAt(version: number): Patch {
    const snapshot = this.snapshotAt(version);
    const rev =
      this.revisions[version] || this.revisions[this.revisions.length - 1];
    let { inserted, insertSeq, deleteSeq } = factor(rev.patch);
    deleteSeq = expand(deleteSeq, insertSeq);
    const hiddenSeq = difference(snapshot.hiddenSeq, deleteSeq);
    insertSeq = shrink(insertSeq, hiddenSeq);
    deleteSeq = shrink(shrink(deleteSeq, hiddenSeq), insertSeq);
    return synthesize({ inserted, insertSeq, deleteSeq });
  }

  clone(client: string): Document {
    if (client === this.client) {
      throw new Error("Cannot have multiple clients per Document");
    }
    return new Document(
      client,
      { ...this.snapshot },
      this.revisions.slice(),
      this.latest,
    );
  }

  apply(rev: Revision, snapshot: Snapshot = this.snapshot): Snapshot {
    let { inserted, insertSeq, deleteSeq } = factor(rev.patch);
    let { visible, hidden, hiddenSeq } = snapshot;

    if (count(deleteSeq, true) > 0) {
      const hiddenSeq1 = union(hiddenSeq, deleteSeq);
      [hidden, visible] = shuffle(hidden, visible, hiddenSeq, hiddenSeq1);
      hiddenSeq = hiddenSeq1;
    }

    if (inserted.length) {
      hiddenSeq = expand(hiddenSeq, insertSeq);
      const insertSeq1 = shrink(insertSeq, hiddenSeq);
      visible = merge(inserted, visible, insertSeq1);
    }

    return { visible, hidden, hiddenSeq, version: snapshot.version + 1 };
  }

  edit(
    patch: Patch,
    priority?: number,
    parent: number = this.revisions.length - 1,
  ): Revision {
    if (parent < 0 || parent > this.revisions.length - 1) {
      throw new RangeError("parent out of range");
    }
    let { inserted, insertSeq, deleteSeq } = factor(patch);
    const hiddenSeq = this.hiddenSeqAt(parent);
    [, insertSeq] = interleave(hiddenSeq, insertSeq);
    deleteSeq = expand(deleteSeq, hiddenSeq);
    let rev: Revision = {
      patch: synthesize({ inserted, insertSeq, deleteSeq }),
      client: this.client,
      priority,
      local: this.local,
      latest: this.latest,
    };
    [rev] = rebase(
      rev,
      this.revisions.slice(parent + 1),
      this.snapshot.hiddenSeq,
    );
    this.snapshot = this.apply(rev);
    this.revisions.push(rev);
    this.local++;
    return rev;
  }

  revert(version: number): Revision {
    let [rev, ...revisions] = this.revisions.slice(version);
    let { insertSeq: deleteSeq, deleteSeq: insertSeq } = factor(rev.patch);
    insertSeq = expand(insertSeq, deleteSeq);
    const insertSeq1 = summarize(revisions);
    deleteSeq = expand(deleteSeq, insertSeq1);
    insertSeq = expand(insertSeq, insertSeq1);
    const { visible, hidden, hiddenSeq } = this.snapshot;
    const [inserted] = split(merge(hidden, visible, hiddenSeq), insertSeq);
    [, insertSeq] = interleave(insertSeq, insertSeq);
    rev = {
      patch: synthesize({ inserted, insertSeq, deleteSeq }),
      client: this.client,
      local: this.local,
      latest: this.latest,
    };
    this.snapshot = this.apply(rev);
    this.revisions.push(rev);
    this.local++;
    return rev;
  }

  ingest(rev: Revision): Revision {
    // TODO: move this logic to clients?
    if (rev.global == null) {
      throw new Error("Revision missing global version");
    } else if (this.latest < rev.latest || this.latest + 1 < rev.global) {
      // TODO: attempt repair
      throw new Error("Missing revision");
    } else if (rev.global <= this.latest) {
      return rev;
    } else if (rev.client === this.client) {
      // TODO: make sure revision is the same
      this.revisions[rev.global].global = rev.global;
      this.latest = rev.global;
      return rev;
    }
    let latest = Math.max(rev.latest, 0);
    for (let v = this.latest; v >= latest; v--) {
      if (rev.client === this.revisions[v].client) {
        latest = v;
        break;
      }
    }
    let { inserted, insertSeq, deleteSeq } = factor(rev.patch);
    if (rev.latest > -1 && rev.latest < latest) {
      const revisions = this.revisions.slice(rev.latest + 1, latest + 1);
      // TODO: cache or memoize this for performance
      const insertSeq1 = summarize(revisions, rev.client);
      insertSeq = expand(insertSeq, insertSeq1);
      deleteSeq = expand(deleteSeq, insertSeq1);
    }
    rev = { ...rev, patch: synthesize({ inserted, insertSeq, deleteSeq }) };
    let revisions = this.revisions.slice(latest + 1, this.latest + 1);
    [rev] = rebase(rev, revisions, this.hiddenSeqAt(this.latest));
    revisions = this.revisions.slice(this.latest + 1);
    this.revisions.splice(this.latest + 1, revisions.length, rev);
    [rev, revisions] = rebase(rev, revisions, this.snapshot.hiddenSeq);
    this.revisions = this.revisions.concat(revisions);
    this.snapshot = this.apply(rev);
    this.latest = rev.global!;
    return rev;
  }

  get pending(): Revision[] {
    return this.revisions.slice(this.latest + 1);
  }
}
