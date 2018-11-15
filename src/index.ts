import uuid from "uuid/v4";
import EventEmitter from "events";

export interface Seq<T> {
  length: number;
  slice(start?: number, end?: number): Seq<T>;
  concat(...items: (T | Seq<T>)[]): Seq<T>;
}

// length, count
export type Segment = [number, number];
// TODO: we might not need subsets to be multisets, so consider switching from [[length, count]] to [flag, ...length] where flag is boolean which alternates based on state
export type Subset = Segment[];

export function countBy(subset: Subset, test?: (c: number) => boolean): number {
  return subset.reduce(
    (l, [l1, c]) => (test == null || test(c) ? l + l1 : l),
    0,
  );
}

export function pushSegment(
  subset: Subset,
  length: number,
  count: number,
): number {
  if (length <= 0) {
    throw new Error("Can't push empty segment");
  } else if (!subset.length) {
    subset.push([length, count]);
  } else {
    const [length1, count1] = subset[subset.length - 1];
    if (count1 === count) {
      subset[subset.length - 1] = [length1 + length, count];
    } else {
      subset.push([length, count]);
    }
  }
  return subset.length;
}

type ZipValue = [number, number, number];
class ZipIterator implements IterableIterator<ZipValue> {
  private i1: number = 0;
  private i2: number = 0;
  private consumed1: number = 0;
  private consumed2: number = 0;
  private consumed: number = 0;
  constructor(private subset1: Subset, private subset2: Subset) {}

  public next(): IteratorResult<ZipValue> {
    const segment1 = this.subset1[this.i1];
    const segment2 = this.subset2[this.i2];
    if (segment1 == null || segment2 == null) {
      if (segment1 || segment2) {
        throw new Error("Length mismatch");
      }
      return ({ done: true } as any) as IteratorResult<ZipValue>;
    }
    const [length1, count1] = segment1;
    const [length2, count2] = segment2;
    let length: number;
    if (length1 + this.consumed1 === length2 + this.consumed2) {
      this.consumed1 += length1;
      this.consumed2 += length2;
      this.i1 += 1;
      this.i2 += 1;
      length = this.consumed1 - this.consumed;
    } else if (length1 + this.consumed1 < length2 + this.consumed2) {
      this.consumed1 += length1;
      this.i1 += 1;
      length = this.consumed1 - this.consumed;
    } else {
      this.consumed2 += length2;
      this.i2 += 1;
      length = this.consumed2 - this.consumed;
    }
    this.consumed += length;
    return {
      done: false,
      value: [length, count1, count2],
    };
  }

  public [Symbol.iterator]() {
    return this;
  }

  public join(fn: (count1: number, count2: number) => number): Subset {
    const subset: Subset = [];
    for (const [length, count1, count2] of this) {
      pushSegment(subset, length, fn(count1, count2));
    }
    return subset;
  }
}

export function zip(a: Subset, b: Subset): ZipIterator {
  return new ZipIterator(a, b);
}

export function complement(subset: Subset): Subset {
  return subset.map(
    ([length, count]) => [length, count === 0 ? 1 : 0] as Segment,
  );
}

export function union(subset1: Subset, subset2: Subset): Subset {
  return zip(subset1, subset2).join((c1, c2) => c1 + c2);
}

export function subtract(subset1: Subset, subset2: Subset): Subset {
  return zip(subset1, subset2).join((c1, c2) => {
    if (c1 < c2) {
      throw new Error("Negative count detected");
    }
    return c1 - c2;
  });
}

export function expand(subset1: Subset, subset2: Subset): Subset {
  const result: Subset = [];
  let segment1: Segment | undefined;
  for (let [length2, count2] of subset2) {
    if (count2) {
      pushSegment(result, length2, 0);
    } else {
      while (length2 > 0) {
        if (segment1 == null || segment1[0] === 0) {
          if (!subset1.length) {
            throw new Error("Length mismatch");
          }
          [segment1, ...subset1] = subset1;
        }
        const [length1, count1] = segment1;
        const consumed = Math.min(length1, length2);
        pushSegment(result, consumed, count1);
        length2 -= consumed;
        segment1 = [length1 - consumed, count1];
      }
    }
  }
  if (subset1.length || segment1 == null || segment1[0] > 0) {
    throw new Error("Length mismatch");
  }
  return result;
}

export function shrink(subset1: Subset, subset2: Subset): Subset {
  const result: Subset = [];
  for (const [length, count1, count2] of zip(subset1, subset2)) {
    if (count2 === 0) {
      pushSegment(result, length, count1);
    }
  }
  return result;
}

export function rebase(
  subset1: Subset,
  subset2: Subset,
  before?: boolean,
): Subset {
  if (countBy(subset1, (c) => c === 0) !== countBy(subset2, (c) => c === 0)) {
    throw new Error("Length mismatch");
  }
  const result: Subset = [];
  let segment1: Segment | undefined;
  let segment2: Segment | undefined;
  [segment1, ...subset1] = subset1;
  [segment2, ...subset2] = subset2;
  while (segment1 != null || segment2 != null) {
    if (segment1 == null) {
      const [length2, count2] = segment2;
      if (count2) {
        pushSegment(result, length2, 0);
      }
      [segment2, ...subset2] = subset2;
    } else if (segment2 == null) {
      const [length1, count1] = segment1;
      pushSegment(result, length1, count1);
      [segment1, ...subset1] = subset1;
    } else {
      const [length1, count1] = segment1 as Segment;
      const [length2, count2] = segment2 as Segment;
      if (count2) {
        if (before) {
          pushSegment(result, length1, count1);
        }
        pushSegment(result, length2, 0);
        if (!before) {
          pushSegment(result, length1, count1);
        }
        [segment1, ...subset1] = subset1;
        [segment2, ...subset2] = subset2;
      } else if (count1) {
        pushSegment(result, length1, count1);
        [segment1, ...subset1] = subset1;
      } else {
        const length = Math.min(length1, length2);
        pushSegment(result, length, 0);
        if (length1 - length > 0) {
          segment1 = [length1 - length, count1];
        } else {
          [segment1, ...subset1] = subset1;
        }
        if (length2 - length > 0) {
          segment2 = [length2 - length, count2];
        } else {
          [segment2, ...subset2] = subset2;
        }
      }
    }
  }
  return result;
}

export function deleteSubset<T>(text: Seq<T>, subset: Subset): Seq<T> {
  let result = text.slice(0, 0);
  let consumed = 0;
  for (const [length, count] of subset) {
    consumed += length;
    if (!count) {
      if (typeof result === "string") {
        result += text.slice(consumed - length, consumed);
      } else {
        result = result.concat(text.slice(consumed - length, consumed));
      }
    }
  }
  return result;
}

// To apply a patch, copy from start (inclusive) to end (exclusive) and splice insert at end.
// Deletes are represented via omission
export interface PatchElement<T> {
  start: number;
  end: number;
  insert: Seq<T>;
}

export type Patch<T> = PatchElement<T>[];

export function apply<T>(text: Seq<T>, patch: Patch<T>): Seq<T> {
  let result = text.slice(0, 0);
  for (const { start, end, insert } of patch) {
    if (typeof result === "string") {
      result += text.slice(start, end);
      result += insert;
    } else {
      result = result.concat(text.slice(start, end));
      result = result.concat(insert);
    }
  }
  return result;
}

export function factor<T>(
  patch: Patch<T>,
  length: number,
  empty: Seq<T>,
): [Subset, Subset, Seq<T>] {
  const inserts: Subset = [];
  const deletes: Subset = [];
  let inserted: Seq<T> = empty.slice();
  let consumed = 0;
  for (const { start, end, insert } of patch) {
    if (end - start > 0) {
      pushSegment(inserts, end - consumed, 0);
      if (start > consumed) {
        pushSegment(deletes, start - consumed, 1);
      }
      pushSegment(deletes, end - start, 0);
    }
    if (insert.length) {
      if (typeof inserted === "string") {
        inserted += insert;
      } else {
        inserted = inserted.concat(insert);
      }
      pushSegment(inserts, insert.length, 1);
    }
    consumed = end;
  }
  if (length > consumed) {
    pushSegment(inserts, length - consumed, 0);
    pushSegment(deletes, length - consumed, 1);
  }
  return [inserts, deletes, inserted];
}

export function synthesize<T>(
  inserted: Seq<T>,
  from: Subset,
  to: Subset = [[countBy(from), 0]],
): Patch<T> {
  const patch: Patch<T> = [];
  let consumed = 0;
  let index = 0;
  let pe: PatchElement<T> = {
    start: consumed,
    end: consumed,
    insert: inserted.slice(0, 0),
  };
  for (const [length, count1, count2] of zip(from, to)) {
    if (count1 === 0) {
      if (pe.insert.length || pe.end > pe.start) {
        patch.push(pe);
        pe = { start: consumed, end: consumed, insert: inserted.slice(0, 0) };
      }
      consumed += length;
      if (count2 === 0) {
        pe.start = consumed - length;
        pe.end = consumed;
      }
    } else {
      if (pe.end < consumed) {
        if (pe.end > pe.start) {
          patch.push(pe);
        }
        pe = { start: consumed, end: consumed, insert: inserted.slice(0, 0) };
      }
      index += length;
      if (count2 === 0) {
        if (typeof pe.insert === "string") {
          pe.insert += inserted.slice(index - length, index);
        } else {
          pe.insert = pe.insert.concat(inserted.slice(index - length, index));
        }
      }
    }
  }
  patch.push(pe);
  return patch;
}

// Do the variable names make sense? Does this belong here?
export function shuffle<T>(
  from: Seq<T>,
  to: Seq<T>,
  inserts: Subset,
  deletes: Subset,
): [Seq<T>, Seq<T>] {
  const fromPatch = synthesize(to, inserts, deletes);
  const toPatch = synthesize(from, complement(inserts), complement(deletes));
  return [apply(from, fromPatch), apply(to, toPatch)];
}

export interface Message<T> {
  clientId: string;
  version: number;
  parentClientId: string;
  parentVersion: number;
  patch: Patch<T>;
  intent?: string;
}

export interface Revision {
  clientId: string;
  version: number;
  // sequence of characters based on union which were inserted by this revision
  inserts: Subset;
  // sequence of characters based on union which were deleted by this revision
  deletes: Subset;
  intent?: string;
}

export interface RevisionLog {
  slice(start?: number, end?: number): Revision[];
  push(revision: Revision): number;
  locate(clientId: string, version: number): number;
  length: number;
}

export class ArrayRevisionLog implements RevisionLog {
  public length: number;
  constructor(private revisions: Revision[] = []) {
    this.length = revisions.length;
  }

  public locate(clientId: string, version: number) {
    for (let i = this.revisions.length - 1; i >= 0; i--) {
      const revision = this.revisions[i];
      if (revision.clientId === clientId && revision.version === version) {
        return i;
      }
    }
    return -1;
  }

  public slice(start?: number, end?: number): Revision[] {
    return this.revisions.slice(start, end);
  }

  public push(revision: Revision): number {
    this.length = this.revisions.push(revision);
    return this.length;
  }
}

export class Document<T> extends EventEmitter {
  public constructor(
    public visible: Seq<T>,
    public hidden: Seq<T>,
    public deletes: Subset,
    public intents: string[],
    public revisions: RevisionLog,
  ) {
    super();
  }

  public static create<T>(
    clientId: string,
    version: number,
    initial: Seq<T>,
    intents: string[] = [],
    revisions: RevisionLog = new ArrayRevisionLog(),
  ) {
    revisions.push({
      clientId,
      version,
      inserts: initial.length ? [[initial.length, 1]] : [],
      deletes: initial.length ? [[initial.length, 0]] : [],
    });
    return new Document<T>(
      initial,
      initial.slice(0, 0),
      [[initial.length, 0]],
      intents,
      revisions,
    );
  }

  public getDeletesForIndex(index: number): Subset {
    let deletes: Subset = this.deletes;
    for (const revision of this.revisions.slice(index + 1).reverse()) {
      deletes = subtract(deletes, revision.deletes);
      deletes = shrink(deletes, revision.inserts);
    }
    return deletes;
  }

  public edit(
    patch: Patch<T>,
    pi: number, // parent index
    clientId: string,
    version?: number,
    intent?: string,
  ): void {
    if (pi < 0 || pi > this.revisions.length - 1) {
      throw new Error("Index out of range of revisions");
    }
    version = version == null ? this.revisions.length + 1 : version;
    // intent index
    const ii = intent == null ? -1 : this.intents.indexOf(intent);
    if (ii === -1) {
      intent = undefined;
    }
    const oldDeletes = this.getDeletesForIndex(pi);
    const oldLength = countBy(oldDeletes, (c) => c === 0);
    let [inserts, deletes, inserted] = factor(
      patch,
      oldLength,
      this.visible.slice(0, 0),
    );
    inserts = rebase(inserts, oldDeletes);
    deletes = expand(deletes, oldDeletes);
    const revisions = this.revisions.slice(pi + 1);
    for (const revision of revisions) {
      if (intent === revision.intent && clientId === revision.clientId) {
        throw new Error(
          "Can’t have concurrent edits with the same client and source",
        );
      }
      // revision intent index
      const rii =
        revision.intent == null ? -1 : this.intents.indexOf(revision.intent);
      const before =
        intent === revision.intent ? clientId < revision.clientId : ii < rii;
      inserts = rebase(inserts, revision.inserts, before);
      deletes = expand(deletes, revision.inserts);
    }
    deletes = expand(deletes, inserts);
    const currentDeletes = expand(this.deletes, inserts);
    const visibleInserts = shrink(inserts, currentDeletes);
    const visible = apply(this.visible, synthesize(inserted, visibleInserts));
    const newDeletes = union(deletes, currentDeletes);
    const [visible1, hidden] = shuffle(
      visible,
      this.hidden,
      currentDeletes,
      newDeletes,
    );
    const revision: Revision = {
      clientId,
      version,
      inserts,
      deletes,
      intent,
    };
    this.revisions.push(revision);
    this.visible = visible1;
    this.hidden = hidden;
    this.deletes = newDeletes;
  }

  public ingest(message: Message<T>): void {
    const {
      patch,
      clientId,
      version,
      parentClientId,
      parentVersion,
      intent,
    } = message;
    // revision index
    const ri = this.revisions.locate(parentClientId, parentVersion);
    if (ri === -1) {
      return;
    }
    this.edit(patch, ri, clientId, version, intent);
  }
}

export interface Client {
  getDocument(id: string): Document<any> | undefined;
  connect(id: string, doc: Document<any>): void;
  disconnect(id: string): void;
  // edit(id: string, patch: Patch, parentIndex: number, source?: string): void;
}

export interface Server {
  TODO: number;
}

export class LocalClient extends EventEmitter implements Client {
  private documents: Record<string, Document<any>> = {};
  public sources: string[] = [];
  public id = uuid();
  constructor(public server: Server) {
    super();
  }

  getDocument(id: string): Document<any> | undefined {
    return this.documents[id];
  }

  connect(id: string, doc: Document<any>): void {
    if (this.documents[id]) {
      throw new Error(`Document with id ${id} already exists`);
    }
    this.documents[id] = doc;
  }

  disconnect(id: string): void {
    delete this.documents[id];
  }
}
