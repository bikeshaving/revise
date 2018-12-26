// import uuid from "uuid/v4";
import EventEmitter from "events";

// [flag, ...lengths]
export type Subseq = number[];

export function push(subseq: Subseq, length: number, flag: boolean): number {
  if (length <= 0) {
    throw new Error("Cannot push empty segment");
  } else if (!subseq.length) {
    subseq.push(flag ? 1 : 0, length);
  } else {
    const flag1: boolean = !subseq[0] === (subseq.length % 2 === 1);
    if (flag === flag1) {
      subseq[subseq.length - 1] += length;
    } else {
      subseq.push(length);
    }
  }
  return subseq.length;
}

export function concat(subseq1: Subseq, subseq2: Subseq): Subseq {
  const result = subseq1.slice();
  const [flag, length, ...rest] = subseq2;
  if (length == null) {
    return result;
  }
  push(result, length, !!flag);
  return result.concat(rest);
}

export function count(subseq: Subseq, test?: boolean): number {
  let flag: boolean = !!subseq[0];
  let result: number = 0;
  for (const length of subseq.slice(1)) {
    if (test == null || test === flag) {
      result += length;
    }
    flag = !flag;
  }
  return result;
}

type ZipValue = [number, boolean, boolean];
class ZipIterator implements IterableIterator<ZipValue> {
  private i1: number = 1;
  private i2: number = 1;
  private consumed1: number = 0;
  private consumed2: number = 0;
  private consumed: number = 0;
  public constructor(private subseq1: Subseq, private subseq2: Subseq) {}

  public next(): IteratorResult<ZipValue> {
    const length1 = this.subseq1[this.i1];
    const length2 = this.subseq2[this.i2];
    const flag1 = !this.subseq1[0] === (this.i1 % 2 === 0);
    const flag2 = !this.subseq2[0] === (this.i2 % 2 === 0);
    if (length1 == null || length2 == null) {
      if (length1 || length2) {
        throw new Error("Length mismatch");
      }
      return { done: true } as IteratorResult<ZipValue>;
    }
    let length: number;
    if (length1 + this.consumed1 === length2 + this.consumed2) {
      this.consumed1 += length1;
      this.consumed2 += length2;
      this.i1++;
      this.i2++;
      length = this.consumed1 - this.consumed;
    } else if (length1 + this.consumed1 < length2 + this.consumed2) {
      this.consumed1 += length1;
      this.i1++;
      length = this.consumed1 - this.consumed;
    } else {
      this.consumed2 += length2;
      this.i2++;
      length = this.consumed2 - this.consumed;
    }
    this.consumed += length;
    return {
      done: false,
      value: [length, flag1, flag2],
    };
  }

  public [Symbol.iterator]() {
    return this;
  }

  public join(fn: (flag1: boolean, flag2: boolean) => boolean): Subseq {
    const subseq: Subseq = [];
    for (const [length, flag1, flag2] of this) {
      push(subseq, length, fn(flag1, flag2));
    }
    return subseq;
  }
}

export function zip(a: Subseq, b: Subseq): ZipIterator {
  return new ZipIterator(a, b);
}

export function complement(subseq: Subseq): Subseq {
  if (!subseq.length) {
    return subseq;
  }
  return [subseq[0] ? 0 : 1].concat(subseq.slice(1));
}

export function union(subseq1: Subseq, subseq2: Subseq): Subseq {
  return zip(subseq1, subseq2).join((flag1, flag2) => flag1 || flag2);
}

export function difference(subseq1: Subseq, subseq2: Subseq): Subseq {
  return zip(subseq1, subseq2).join((flag1, flag2) => flag1 && !flag2);
}

export function expand(subseq1: Subseq, subseq2: Subseq): Subseq {
  const result: Subseq = [];
  let length1: number | undefined;
  let flag1: boolean = !subseq1[0];
  let flag2: boolean = !subseq2[0];
  subseq1 = subseq1.slice(1);
  for (let length2 of subseq2.slice(1)) {
    flag2 = !flag2;
    if (flag2) {
      push(result, length2, false);
    } else {
      while (length2 > 0) {
        if (length1 == null || length1 === 0) {
          if (!subseq1.length) {
            throw new Error("Length mismatch");
          }
          flag1 = !flag1;
          [length1, ...subseq1] = subseq1;
        }
        const length = Math.min(length1, length2);
        push(result, length, flag1);
        length1 -= length;
        length2 -= length;
      }
    }
  }
  if (subseq1.length || (length1 != null && length1 > 0)) {
    throw new Error("Length mismatch");
  }
  return result;
}

export function shrink(subseq1: Subseq, subseq2: Subseq): Subseq {
  const result: Subseq = [];
  for (const [length, flag1, flag2] of zip(subseq1, subseq2)) {
    if (!flag2) {
      push(result, length, flag1);
    }
  }
  return result;
}

export function interleave(
  subseq1: Subseq,
  subseq2: Subseq,
  before?: boolean,
): Subseq {
  const result: Subseq = [];
  let flag1: boolean = !!subseq1[0];
  let flag2: boolean = !!subseq2[0];
  let length1: number | undefined;
  let length2: number | undefined;
  [length1, ...subseq1] = subseq1.slice(1);
  [length2, ...subseq2] = subseq2.slice(1);
  while (length1 != null && length2 != null) {
    if (flag1 && flag2) {
      if (before) {
        push(result, length1, true);
        push(result, length2, false);
      } else {
        push(result, length2, false);
        push(result, length1, true);
      }
      flag1 = !flag1;
      flag2 = !flag2;
      [length1, ...subseq1] = subseq1;
      [length2, ...subseq2] = subseq2;
    } else if (flag1) {
      push(result, length1, true);
      flag1 = !flag1;
      [length1, ...subseq1] = subseq1;
    } else if (flag2) {
      push(result, length2, false);
      flag2 = !flag2;
      [length2, ...subseq2] = subseq2;
    } else {
      const length = Math.min(length1, length2);
      push(result, length, false);
      if (length1 - length > 0) {
        length1 = length1 - length;
      } else {
        flag1 = !flag1;
        [length1, ...subseq1] = subseq1;
      }
      if (length2 - length > 0) {
        length2 = length2 - length;
      } else {
        flag2 = !flag2;
        [length2, ...subseq2] = subseq2;
      }
    }
  }

  if (length1 != null) {
    push(result, length1, flag1);
    if (subseq1.length) {
      throw new Error("Length mismatch");
    }
  } else if (length2 != null) {
    push(result, length2, false);
    if (subseq2.length) {
      throw new Error("Length mismatch");
    }
  }

  return result;
}

// inclusive start, exclusive end
type Insert = string;
export type Patch = (Insert | number)[];

export function apply(text: string, patch: Patch): string {
  const length = patch[patch.length - 1];
  if (typeof length !== "number") {
    throw new Error("Malformed patch");
  } else if (length !== text.length) {
    throw new Error("Length mismatch");
  }
  let text1 = "";
  let consumed = 0;
  let start: number | undefined;
  for (const p of patch) {
    if (start != null) {
      if (typeof p !== "number" || p < consumed) {
        throw new Error("Malformed patch");
      }
      text1 += text.slice(start, p);
      consumed = p;
      start = undefined;
    } else if (typeof p === "number") {
      if (p < consumed) {
        throw new Error("Malformed patch");
      }
      consumed = p;
      start = p;
    } else {
      text1 += p;
    }
  }
  return text1;
}

export function factor(patch: Patch): [string, Subseq, Subseq] {
  const insertSeq: Subseq = [];
  const deleteSeq: Subseq = [];
  const length = patch[patch.length - 1];
  if (typeof length !== "number") {
    throw new Error("Malformed patch");
  }
  // TODO: maybe use type of string[]
  let inserted: string = "";
  let consumed = 0;
  let start: number | undefined;
  for (const p of patch) {
    if (start != null) {
      if (typeof p !== "number" || p < consumed || p > length) {
        throw new Error("Malformed patch");
      }
      push(insertSeq, p - start, false);
      push(deleteSeq, p - start, false);
      consumed = p;
      start = undefined;
    } else if (typeof p === "number") {
      if (p < consumed) {
        throw new Error("Malformed patch");
      } else if (p > consumed) {
        push(insertSeq, p - consumed, false);
        push(deleteSeq, p - consumed, true);
      }
      consumed = p;
      start = p;
    } else {
      push(insertSeq, p.length, true);
      inserted += p;
    }
  }
  if (length > consumed) {
    push(insertSeq, length - consumed, false);
    push(deleteSeq, length - consumed, true);
  }
  return [inserted, insertSeq, deleteSeq];
}

export function synthesize(
  inserted: string,
  insertSeq: Subseq,
  deleteSeq: Subseq = [0, count(insertSeq)],
): Patch {
  const patch: Patch = [];
  let ii = 0; // insert index
  let consumed = 0;
  for (const [length, insertFlag, deleteFlag] of zip(insertSeq, deleteSeq)) {
    if (insertFlag) {
      ii += length;
      if (!deleteFlag) {
        patch.push(inserted.slice(ii - length, ii));
      }
    } else {
      consumed += length;
      if (!deleteFlag) {
        patch.push(consumed - length, consumed);
      }
    }
  }
  const last = patch[patch.length - 1];
  const length = count(insertSeq, false);
  if (typeof last !== "number" || last < length) {
    patch.push(length);
  }
  return patch;
}

export function shuffle(
  text1: string,
  text2: string,
  subseq1: Subseq,
  subseq2: Subseq,
): [string, string] {
  return [
    apply(text1, synthesize(text2, subseq1, subseq2)),
    apply(text2, synthesize(text1, complement(subseq1), complement(subseq2))),
  ];
}

export function overlapping(
  deleted: string,
  inserted: string,
): Subseq | undefined {
  const subseq: Subseq = [];
  let consumed = 0;
  let flag = false;
  let ii = 0;
  for (let di = 0; di < deleted.length; di++) {
    if (ii >= inserted.length) {
      if (di - consumed > 0) {
        push(subseq, di - consumed, flag);
      }
      consumed = di;
      flag = !flag;
      break;
    }
    const match = deleted[di] === inserted[ii];
    if (match) {
      ii++;
    }
    if (flag !== match) {
      if (di - consumed > 0) {
        push(subseq, di - consumed, flag);
      }
      consumed = di;
      flag = !flag;
    }
  }
  if (ii >= inserted.length) {
    push(subseq, deleted.length - consumed, flag);
    return subseq;
  }
}

export function revive(
  deleted: string,
  inserted: string,
  deleteSeq: Subseq,
  insertSeq: Subseq,
): [string, Subseq, Subseq] {
  let revivedDeleteSeq: Subseq = [];
  const revivedInsertSeq: Subseq = [];
  let inserted1 = "";
  // TODO: use indexes rather than slicing deleted and inserted
  let del: string | undefined;
  let ins: string | undefined;
  deleteSeq = expand(deleteSeq, insertSeq);
  for (const [length, deleteFlag, insertFlag] of zip(deleteSeq, insertSeq)) {
    if (deleteFlag && insertFlag) {
      throw new Error("Deletes and inserts overlap");
    } else if (deleteFlag) {
      del = deleted.slice(0, length);
      if (ins != null) {
        const overlap = overlapping(del, ins);
        if (overlap != null) {
          revivedDeleteSeq = concat(revivedDeleteSeq, overlap);
          push(revivedInsertSeq, ins.length, true);
          del = undefined;
        } else {
          push(revivedInsertSeq, ins.length, false);
          inserted1 += ins;
        }
      }
      push(revivedInsertSeq, length, false);
      ins = undefined;
      deleted = deleted.slice(length);
    } else if (insertFlag) {
      ins = inserted.slice(0, length);
      if (del != null) {
        const overlap = overlapping(del, ins);
        if (overlap != null) {
          revivedDeleteSeq = concat(revivedDeleteSeq, overlap);
          push(revivedInsertSeq, ins.length, true);
          ins = undefined;
        } else {
          push(revivedDeleteSeq, del.length, false);
        }
      }
      push(revivedDeleteSeq, length, false);
      del = undefined;
      inserted = inserted.slice(length);
    } else {
      if (del != null) {
        push(revivedDeleteSeq, del.length, false);
      }
      if (ins != null) {
        push(revivedInsertSeq, ins.length, false);
        inserted1 += ins;
      }
      push(revivedDeleteSeq, length, false);
      push(revivedInsertSeq, length, false);
      del = undefined;
      ins = undefined;
    }
  }
  if (del != null) {
    push(revivedDeleteSeq, del.length, false);
  }
  if (ins != null) {
    push(revivedInsertSeq, ins.length, false);
    inserted1 += ins;
  }
  const reviveSeq = shrink(revivedDeleteSeq, revivedInsertSeq);
  insertSeq = shrink(insertSeq, revivedInsertSeq);
  return [inserted1, insertSeq, reviveSeq];
}

export interface Snapshot {
  visible: string;
  hidden: string;
  hiddenSeq: Subseq;
}

export interface Revision {
  clientId: string;
  insertSeq: Subseq;
  deleteSeq: Subseq;
  reviveSeq: Subseq;
  intent?: string;
}

export interface Message {
  patch: Patch;
  clientId: string;
  version: number;
  intent?: string;
}

export class Document extends EventEmitter {
  private constructor(
    public clientId: string,
    public snapshot: Snapshot,
    public intents: string[],
    public revisions: Revision[],
  ) {
    super();
  }

  public static initialize(
    clientId: string,
    initial: string = "",
    intents: string[] = [],
  ) {
    const snapshot: Snapshot = {
      visible: initial,
      hidden: "",
      hiddenSeq: initial.length ? [0, initial.length] : [],
    };
    const revisions: Revision[] = [
      {
        clientId,
        insertSeq: initial.length ? [1, initial.length] : [],
        deleteSeq: initial.length ? [0, initial.length] : [],
        reviveSeq: initial.length ? [0, initial.length] : [],
      },
    ];
    return new Document(clientId, snapshot, intents, revisions);
  }

  public hiddenSeqAt(i: number): Subseq {
    let hiddenSeq: Subseq = this.snapshot.hiddenSeq;
    for (const revision of this.revisions.slice(i + 1).reverse()) {
      // TODO: does the ordering between reviveSeq and deleteSeq matter?
      hiddenSeq = union(hiddenSeq, revision.reviveSeq);
      hiddenSeq = difference(hiddenSeq, revision.deleteSeq);
      hiddenSeq = shrink(hiddenSeq, revision.insertSeq);
    }
    return hiddenSeq;
  }

  public edit(
    patch: Patch,
    intent?: string,
    pi: number = this.revisions.length - 1,
  ): Patch {
    if (pi < 0 || pi > this.revisions.length - 1) {
      throw new Error("Index out of range of revisions");
    }
    const clientId = this.clientId;
    const ii = intent == null ? -1 : this.intents.indexOf(intent);
    intent = ii === -1 ? undefined : intent;

    let oldHiddenSeq = this.hiddenSeqAt(pi);
    let [inserted, insertSeq, deleteSeq] = factor(patch);
    insertSeq = interleave(insertSeq, oldHiddenSeq);
    deleteSeq = expand(deleteSeq, oldHiddenSeq);

    for (const revision of this.revisions.slice(pi + 1)) {
      if (intent === revision.intent && clientId === revision.clientId) {
        throw new Error(
          "Cannot have concurrent edits with the same client and source",
        );
      }
      const rii =
        revision.intent == null ? -1 : this.intents.indexOf(revision.intent);
      const before =
        intent === revision.intent ? clientId < revision.clientId : ii < rii;
      if (revision.insertSeq != null) {
        insertSeq = interleave(insertSeq, revision.insertSeq, before);
        deleteSeq = expand(deleteSeq, revision.insertSeq);
      }
      if (revision.deleteSeq != null) {
        deleteSeq = difference(deleteSeq, revision.deleteSeq);
      }
    }

    let { visible, hidden, hiddenSeq } = this.snapshot;
    if (count(deleteSeq, true) > 0) {
      const hiddenSeq1 = union(hiddenSeq, deleteSeq);
      [visible, hidden] = shuffle(visible, hidden, hiddenSeq, hiddenSeq1);
      hiddenSeq = hiddenSeq1;
    }

    let reviveSeq: Subseq;
    if (inserted.length) {
      [inserted, insertSeq, reviveSeq] = revive(
        hidden,
        inserted,
        hiddenSeq,
        insertSeq,
      );
    } else {
      reviveSeq = [0, count(insertSeq)];
    }

    if (inserted.length) {
      deleteSeq = expand(deleteSeq, insertSeq);
      hiddenSeq = expand(hiddenSeq, insertSeq);
      const visibleInsertSeq = shrink(insertSeq, hiddenSeq);
      visible = apply(visible, synthesize(inserted, visibleInsertSeq));
    }

    if (count(reviveSeq, true) > 0) {
      const hiddenSeq1 = difference(hiddenSeq, reviveSeq);
      [visible, hidden] = shuffle(visible, hidden, hiddenSeq, hiddenSeq1);
      hiddenSeq = hiddenSeq1;
    }

    this.snapshot = { visible, hidden, hiddenSeq };
    this.revisions.push({
      clientId,
      insertSeq,
      deleteSeq,
      reviveSeq,
      intent,
    });
    return patch;
  }

  public undo(i: number): Patch {
    const [parentRevision, ...revisions] = this.revisions.slice(i);
    let reviveSeq = parentRevision.deleteSeq;
    let deleteSeq = union(parentRevision.insertSeq, parentRevision.reviveSeq);
    for (const revision of revisions) {
      const deleteOrReviveSeq = union(revision.reviveSeq, revision.deleteSeq);
      reviveSeq = expand(reviveSeq, revision.insertSeq);
      deleteSeq = expand(deleteSeq, revision.insertSeq);
      reviveSeq = difference(reviveSeq, deleteOrReviveSeq);
      deleteSeq = difference(deleteSeq, deleteOrReviveSeq);
    }
    let { visible, hidden, hiddenSeq } = this.snapshot;
    const patch = synthesize(hidden, reviveSeq, deleteSeq);
    {
      const hiddenSeq1 = union(difference(hiddenSeq, reviveSeq), deleteSeq);
      [visible, hidden] = shuffle(visible, hidden, hiddenSeq, hiddenSeq1);
      this.snapshot = { visible, hidden, hiddenSeq: hiddenSeq1 };
    }
    return patch;
  }

  public clone(clientId: string): Document {
    return new Document(
      clientId,
      { ...this.snapshot },
      this.intents.slice(),
      this.revisions.slice(),
    );
  }
}
