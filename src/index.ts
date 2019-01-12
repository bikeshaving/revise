import EventEmitter from "events";

// [flag, ...lengths]
export type Subseq = number[];

export function print(subseq: Subseq): string {
  let flag = !!subseq[0];
  let result = "";
  for (const length of subseq.slice(1)) {
    result += flag ? "+".repeat(length) : "=".repeat(length);
    flag = !flag;
  }
  return result;
}

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

export function extract(seq: string, subseq: Subseq): string {
  let consumed = 0;
  let result = "";
  let flag = !!subseq[0];
  for (const length of subseq.slice(1)) {
    consumed += length;
    if (flag) {
      result += seq.slice(consumed - length, consumed);
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

export function expand(
  subseq1: Subseq,
  subseq2: Subseq,
  options: { union?: boolean } = {},
): Subseq {
  const union = !!options.union;
  const result: Subseq = [];
  let length1: number | undefined;
  let flag1: boolean = !subseq1[0];
  let flag2: boolean = !subseq2[0];
  subseq1 = subseq1.slice(1);
  for (let length2 of subseq2.slice(1)) {
    flag2 = !flag2;
    if (flag2) {
      push(result, length2, union);
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

export function interleave(subseq1: Subseq, subseq2: Subseq): [Subseq, Subseq] {
  const result1: Subseq = [];
  const result2: Subseq = [];
  let flag1: boolean = !!subseq1[0];
  let flag2: boolean = !!subseq2[0];
  let length1: number | undefined;
  let length2: number | undefined;
  [length1, ...subseq1] = subseq1.slice(1);
  [length2, ...subseq2] = subseq2.slice(1);
  while (length1 != null && length2 != null) {
    if (flag1 && flag2) {
      push(result1, length1, true);
      push(result1, length2, false);
      push(result2, length2, false);
      push(result2, length1, true);
      flag1 = !flag1;
      flag2 = !flag2;
      [length1, ...subseq1] = subseq1;
      [length2, ...subseq2] = subseq2;
    } else if (flag1) {
      push(result1, length1, true);
      push(result2, length1, true);
      flag1 = !flag1;
      [length1, ...subseq1] = subseq1;
    } else if (flag2) {
      push(result1, length2, false);
      push(result2, length2, false);
      flag2 = !flag2;
      [length2, ...subseq2] = subseq2;
    } else {
      const length = Math.min(length1, length2);
      push(result1, length, false);
      push(result2, length, false);
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
    push(result1, length1, flag1);
    push(result2, length1, flag1);
    if (subseq1.length) {
      throw new Error("Length mismatch");
    }
  } else if (length2 != null) {
    push(result1, length2, false);
    push(result2, length2, false);
    if (subseq2.length) {
      throw new Error("Length mismatch");
    }
  }

  return [result1, result2];
}

// TODO: explain patch format
export type Patch = (string | number)[];

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
  hidden: string,
  inserted: string,
  hiddenSeq: Subseq,
  insertSeq: Subseq,
): [string, Subseq, Subseq] {
  let revivedHiddenSeq: Subseq = [];
  const revivedInsertSeq: Subseq = [];
  let inserted1 = "";
  // TODO: use indexes rather than slicing deleted and inserted
  let hid: string | undefined;
  let ins: string | undefined;
  hiddenSeq = expand(hiddenSeq, insertSeq);
  for (const [length, hiddenFlag, insertFlag] of zip(hiddenSeq, insertSeq)) {
    if (hiddenFlag && insertFlag) {
      throw new Error("Deletes and inserts overlap");
    } else if (hiddenFlag) {
      hid = hidden.slice(0, length);
      if (ins != null) {
        const overlap = overlapping(hid, ins);
        if (overlap != null) {
          revivedHiddenSeq = concat(revivedHiddenSeq, overlap);
          push(revivedInsertSeq, ins.length, true);
          hid = undefined;
        } else {
          push(revivedInsertSeq, ins.length, false);
          inserted1 += ins;
        }
      }
      push(revivedInsertSeq, length, false);
      ins = undefined;
      hidden = hidden.slice(length);
    } else if (insertFlag) {
      ins = inserted.slice(0, length);
      if (hid != null) {
        const overlap = overlapping(hid, ins);
        if (overlap != null) {
          revivedHiddenSeq = concat(revivedHiddenSeq, overlap);
          push(revivedInsertSeq, ins.length, true);
          ins = undefined;
        } else {
          push(revivedHiddenSeq, hid.length, false);
        }
      }
      push(revivedHiddenSeq, length, false);
      hid = undefined;
      inserted = inserted.slice(length);
    } else {
      if (hid != null) {
        push(revivedHiddenSeq, hid.length, false);
      }
      if (ins != null) {
        push(revivedInsertSeq, ins.length, false);
        inserted1 += ins;
      }
      push(revivedHiddenSeq, length, false);
      push(revivedInsertSeq, length, false);
      hid = undefined;
      ins = undefined;
    }
  }
  if (hid != null) {
    push(revivedHiddenSeq, hid.length, false);
  }
  if (ins != null) {
    push(revivedInsertSeq, ins.length, false);
    inserted1 += ins;
  }
  const reviveSeq = shrink(revivedHiddenSeq, insertSeq);
  insertSeq = shrink(insertSeq, revivedInsertSeq);
  return [inserted1, insertSeq, reviveSeq];
}

export interface Snapshot {
  visible: string;
  hidden: string;
  hiddenSeq: Subseq;
}

export interface ServerMessage {
  patch: Patch;
  clientId: string;
  priority: number;
  version: number;
  lastKnownVersion: number;
}

export interface Revision {
  clientId: string;
  insertSeq: Subseq;
  deleteSeq: Subseq;
  reviveSeq: Subseq;
  priority: number;
}

export class Document extends EventEmitter {
  protected constructor(
    public client: Client,
    public snapshot: Snapshot,
    protected revisions: Revision[],
    protected lastKnownVersion = 0,
  ) {
    super();
    // this.on("revision", console.log);
  }

  public static initialize(client: Client, initial: string = "") {
    const snapshot: Snapshot = {
      visible: initial,
      hidden: "",
      hiddenSeq: initial.length ? [0, initial.length] : [],
    };
    const revision: Revision = {
      clientId: client.id,
      insertSeq: initial.length ? [1, initial.length] : [],
      deleteSeq: initial.length ? [0, initial.length] : [],
      reviveSeq: initial.length ? [0, initial.length] : [],
      priority: 0,
    };
    return new Document(client, snapshot, [revision]);
  }

  public hiddenSeqAt(version: number): Subseq {
    let hiddenSeq: Subseq = this.snapshot.hiddenSeq;
    const revisions = this.revisions.slice(version + 1).reverse();
    for (const revision of revisions) {
      // TODO: does the ordering between reviveSeq and deleteSeq matter?
      hiddenSeq = shrink(hiddenSeq, revision.insertSeq);
      hiddenSeq = union(hiddenSeq, revision.reviveSeq);
      hiddenSeq = difference(hiddenSeq, revision.deleteSeq);
    }
    return hiddenSeq;
  }

  public snapshotAt(version: number): Snapshot {
    const hiddenSeq: Subseq = this.hiddenSeqAt(version);
    let insertSeq: Subseq = [0, count(hiddenSeq)];
    for (const revision of this.revisions.slice(version + 1)) {
      insertSeq = expand(insertSeq, revision.insertSeq, { union: true });
    }
    let { visible, hidden, hiddenSeq: newHiddenSeq } = this.snapshot;
    const expandedHiddenSeq = expand(hiddenSeq, insertSeq);
    visible = apply(
      visible,
      synthesize(hidden, newHiddenSeq, union(expandedHiddenSeq, insertSeq)),
    );
    hidden = apply(
      hidden,
      synthesize("", complement(newHiddenSeq), complement(expandedHiddenSeq)),
    );
    return { visible, hidden, hiddenSeq };
  }

  public patchAt(version: number): Patch {
    const revision: Revision = this.revisions[version];
    const snapshot: Snapshot = this.snapshotAt(version);
    const insertSeq: Subseq = expand(revision.reviveSeq, revision.insertSeq, {
      union: true,
    });
    return synthesize(
      extract(snapshot.visible, insertSeq),
      insertSeq,
      expand(revision.deleteSeq, revision.insertSeq),
    );
  }

  public clone(client: Client = this.client): Document {
    return new Document(client, { ...this.snapshot }, this.revisions.slice());
  }

  public apply(
    inserted: string,
    revision: Revision,
    snapshot: Snapshot = this.snapshot,
  ): [string, Revision, Snapshot] {
    let { insertSeq, deleteSeq, reviveSeq } = revision;
    let { visible, hidden, hiddenSeq } = snapshot;
    if (count(deleteSeq, true) > 0) {
      const hiddenSeq1 = union(hiddenSeq, deleteSeq);
      [visible, hidden] = shuffle(visible, hidden, hiddenSeq, hiddenSeq1);
      hiddenSeq = hiddenSeq1;
    }

    if (inserted.length) {
      let reviveSeq1: Subseq;
      [inserted, insertSeq, reviveSeq1] = revive(
        hidden,
        inserted,
        hiddenSeq,
        insertSeq,
      );
      reviveSeq = union(reviveSeq, reviveSeq1);
      hiddenSeq = expand(hiddenSeq, insertSeq);
      const insertSeq1 = shrink(insertSeq, hiddenSeq);
      visible = apply(visible, synthesize(inserted, insertSeq1));
    }

    if (count(reviveSeq, true) > 0) {
      const hiddenSeq1 = difference(hiddenSeq, expand(reviveSeq, insertSeq));
      [visible, hidden] = shuffle(visible, hidden, hiddenSeq, hiddenSeq1);
      hiddenSeq = hiddenSeq1;
    }

    revision = { ...revision, insertSeq, deleteSeq, reviveSeq };
    snapshot = { visible, hidden, hiddenSeq };
    return [inserted, revision, snapshot];
  }

  public edit(
    patch: Patch,
    priority: number = 0,
    version: number = this.revisions.length - 1,
  ): void {
    if (version < 0 || version > this.revisions.length - 1) {
      throw new Error("Index out of range of revisions");
    }
    let inserted: string;
    let insertSeq: Subseq;
    let deleteSeq: Subseq;
    {
      const oldHiddenSeq = this.hiddenSeqAt(version);
      [inserted, insertSeq, deleteSeq] = factor(patch);
      [, insertSeq] = interleave(insertSeq, oldHiddenSeq);
      deleteSeq = expand(deleteSeq, oldHiddenSeq);
    }

    for (const revision of this.revisions.slice(version + 1)) {
      if (
        priority === revision.priority &&
        this.client.id === revision.clientId
      ) {
        throw new Error(
          "Cannot have concurrent edits with the same client and priority",
        );
      }
      const before =
        priority !== revision.priority
          ? priority < revision.priority
          : this.client.id < revision.clientId;
      if (revision.deleteSeq != null) {
        deleteSeq = difference(deleteSeq, revision.deleteSeq);
      }
      if (revision.insertSeq != null) {
        if (before) {
          [insertSeq] = interleave(insertSeq, revision.insertSeq);
        } else {
          [, insertSeq] = interleave(insertSeq, revision.insertSeq);
        }
        deleteSeq = expand(deleteSeq, revision.insertSeq);
      }
    }
    let revision: Revision = {
      insertSeq,
      deleteSeq,
      reviveSeq: [0, count(deleteSeq)],
      priority,
      clientId: this.client.id,
    };
    let snapshot: Snapshot;
    [, revision, snapshot] = this.apply(inserted, revision);
    this.revisions.push(revision);
    this.snapshot = snapshot;
  }

  public undo(i: number): void {
    const [revision, ...revisions] = this.revisions.slice(i);
    let reviveSeq = expand(revision.deleteSeq, revision.insertSeq);
    let deleteSeq = expand(revision.reviveSeq, revision.insertSeq, {
      union: true,
    });
    for (const revision of revisions) {
      const deleteOrReviveSeq = union(revision.reviveSeq, revision.deleteSeq);
      reviveSeq = difference(reviveSeq, deleteOrReviveSeq);
      deleteSeq = difference(deleteSeq, deleteOrReviveSeq);
      reviveSeq = expand(reviveSeq, revision.insertSeq);
      deleteSeq = expand(deleteSeq, revision.insertSeq);
    }
    const [, revision1, snapshot] = this.apply("", {
      ...revision,
      insertSeq: [0, count(deleteSeq)],
      deleteSeq,
      reviveSeq,
    });
    this.snapshot = snapshot;
    this.revisions.push(revision1);
  }

  public ingest(message: ServerMessage): void {
    if (
      this.lastKnownVersion + 1 !== message.version ||
      this.lastKnownVersion < message.lastKnownVersion
    ) {
      // TODO: attempt repair
      throw new Error("Causality violation");
    } else if (message.clientId === this.client.id) {
      this.lastKnownVersion = message.version;
      return;
    }
    let inserted: string;
    let insertSeq: Subseq;
    let deleteSeq: Subseq;
    {
      const oldHiddenSeq = this.hiddenSeqAt(message.lastKnownVersion);
      [inserted, insertSeq, deleteSeq] = factor(message.patch);
      [, insertSeq] = interleave(insertSeq, oldHiddenSeq);
      deleteSeq = expand(deleteSeq, oldHiddenSeq);
    }
    for (const revision of this.revisions.slice(
      message.lastKnownVersion,
      this.lastKnownVersion,
    )) {
      if (
        message.priority === revision.priority &&
        message.clientId === revision.clientId
      ) {
        throw new Error(
          "Cannot have concurrent edits with the same client and priority",
        );
      }
      if (message.clientId !== revision.clientId) {
        const before =
          message.priority !== revision.priority
            ? message.priority < revision.priority
            : message.clientId < revision.clientId;
        if (revision.deleteSeq != null) {
          deleteSeq = difference(deleteSeq, revision.deleteSeq);
        }
        if (revision.insertSeq != null) {
          if (before) {
            [insertSeq] = interleave(insertSeq, revision.insertSeq);
          } else {
            [, insertSeq] = interleave(insertSeq, revision.insertSeq);
          }
          deleteSeq = expand(deleteSeq, revision.insertSeq);
        }
      }
    }
    let revision: Revision = {
      insertSeq,
      deleteSeq,
      reviveSeq: [0, count(deleteSeq)],
      clientId: message.clientId,
      priority: message.priority,
    };
    let snapshot: Snapshot = this.snapshotAt(this.lastKnownVersion);
    [inserted, revision] = this.apply(inserted, revision, snapshot);
    this.revisions.splice(this.lastKnownVersion + 1, 0, revision);
    insertSeq = revision.insertSeq;
    deleteSeq = revision.deleteSeq;
    let reviveSeq: Subseq = revision.reviveSeq;
    for (const revision1 of this.revisions.slice(this.lastKnownVersion + 2)) {
      if (
        message.priority === revision1.priority &&
        message.clientId === revision1.clientId
      ) {
        throw new Error(
          "Cannot have concurrent edits with the same client and priority",
        );
      }
      const before =
        message.priority !== revision1.priority
          ? message.priority < revision1.priority
          : message.clientId < revision1.clientId;
      if (revision1.deleteSeq != null) {
        deleteSeq = difference(deleteSeq, revision1.deleteSeq);
        reviveSeq = difference(reviveSeq, revision1.deleteSeq);
      }
      if (revision1.insertSeq != null) {
        if (before) {
          [insertSeq] = interleave(insertSeq, revision1.insertSeq);
        } else {
          [, insertSeq] = interleave(insertSeq, revision1.insertSeq);
        }
        deleteSeq = expand(deleteSeq, revision1.insertSeq);
        reviveSeq = expand(reviveSeq, revision1.insertSeq);
      }
      revision1.insertSeq = expand(revision1.insertSeq, insertSeq);
      const insertSeq1 = shrink(insertSeq, revision1.insertSeq);
      revision1.deleteSeq = expand(revision1.deleteSeq, insertSeq1);
      revision1.reviveSeq = expand(revision1.reviveSeq, insertSeq1);
    }
    revision = { ...revision, insertSeq, deleteSeq, reviveSeq };
    [, , snapshot] = this.apply(inserted, revision);
    this.snapshot = snapshot;
    this.lastKnownVersion = message.version;
  }
}

import uuidV4 from "uuid/v4";
export class Client extends EventEmitter {
  public constructor(public id: string = uuidV4()) {
    super();
  }
}
