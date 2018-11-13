import uuid from "uuid/v4";

// TODO: use this
export interface Seq<T, U> {
  length: number;
  slice(this: T, start?: number, end?: number): T;
  concat(this: T, ...items: U[]): T;
}

// length, count
export type Segment = [number, number];
// TODO: we might not need subsets to be multisets, so consider switching from [[length, count]] to [flag, ...length] where flag is boolean which alternates based on state
export type Subset = Segment[];

export function lengthOf(
  subset: Subset,
  test?: (c: number) => boolean,
): number {
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

// length, count1, count2
type ZippedSegment = [number, number, number];

class ZippedSubset implements IterableIterator<ZippedSegment> {
  private i1: number = 0;
  private i2: number = 0;
  private consumed1: number = 0;
  private consumed2: number = 0;
  private consumed: number = 0;
  constructor(private subset1: Subset, private subset2: Subset) {}

  public next(): IteratorResult<ZippedSegment> {
    const segment1 = this.subset1[this.i1];
    const segment2 = this.subset2[this.i2];
    if (segment1 == null || segment2 == null) {
      if (segment1 || segment2) {
        throw new Error("Length mismatch");
      }
      return ({ done: true } as any) as IteratorResult<ZippedSegment>;
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

export function zip(a: Subset, b: Subset): ZippedSubset {
  return new ZippedSubset(a, b);
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
  if (lengthOf(subset1, (c) => c === 0) !== lengthOf(subset2, (c) => c === 0)) {
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

export function deleteSubset(text: string, subset: Subset): string {
  let result = "";
  let consumed = 0;
  for (const [length, count] of subset) {
    consumed += length;
    if (!count) {
      result += text.slice(consumed - length, consumed);
    }
  }
  return result;
}

export interface PatchElement {
  //inclusive
  start: number;
  //exclusive
  end: number;
  insert: string;
}
export type Patch = PatchElement[];

export function apply(text: string, patch: Patch): string {
  let result = text.slice(0, 0);
  for (const { start, end, insert } of patch) {
    result += text.slice(start, end);
    result += insert;
  }
  return result;
}

export function factor(patch: Patch, length: number): [Subset, Subset, string] {
  const inserts: Subset = [];
  const deletes: Subset = [];
  let inserted = "";
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
      inserted += insert;
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

export function synthesize(
  inserted: string,
  from: Subset,
  to: Subset = [[lengthOf(from), 0]],
): Patch {
  const patch: Patch = [];
  let consumed = 0;
  let index = 0;
  let pe: PatchElement = { start: consumed, end: consumed, insert: "" };
  for (const [length, count1, count2] of zip(from, to)) {
    if (count1 === 0) {
      if (pe.insert.length || pe.end > pe.start) {
        patch.push(pe);
        pe = { start: consumed, end: consumed, insert: "" };
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
        pe = { start: consumed, end: consumed, insert: "" };
      }
      index += length;
      if (count2 === 0) {
        pe.insert += inserted.slice(index - length, index);
      }
    }
  }
  patch.push(pe);
  return patch;
}

// Do the variable names make sense? Does this belong here?
export function shuffle(
  from: string,
  to: string,
  inserts: Subset,
  deletes: Subset,
): [string, string] {
  const fromPatch = synthesize(to, inserts, deletes);
  const toPatch = synthesize(from, complement(inserts), complement(deletes));
  return [apply(from, fromPatch), apply(to, toPatch)];
}

// TODO: better name for this maybe
export interface Message {
  patch: Patch;
  source?: string;
  clientId: string;
  version: number;
  parentClientId: string;
  parentVersion: number;
}

export interface Document<T extends Seq<any, any>> {
  visible: T;
  hidden: T;
  deleted: Subset;
  revisions: RevisionStore;
}

export interface Revision {
  clientId: string;
  version: number;
  // sequence of characters based on union which were inserted by this revision
  inserts: Subset;
  // sequence of characters based on union which were deleted by this revision
  deletes: Subset;
  source?: string;
}

export interface RevisionStore {
  indexOf(clientId: string, version: number): number;
  slice(start?: number, end?: number): Revision[];
  push(revision: Revision): number;
  length: number;
}

export class ArrayRevisionStore implements RevisionStore {
  public length: number;
  constructor(private revisions: Revision[] = []) {
    this.length = revisions.length;
  }

  public indexOf(clientId: string, version: number) {
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

export class Client {
  public visible: string;
  public hidden: string;
  public deletes: Subset;

  public id: string = uuid();
  public revisions: Revision[];
  public version: number = 0;
  public sources: string[] = [];

  constructor(initial: string = "") {
    this.visible = initial;
    this.hidden = initial.slice(0, 0);
    this.deletes = initial.length ? [[initial.length, 0]] : [];
    this.revisions = [
      {
        clientId: this.id,
        version: this.version++,
        inserts: initial.length ? [[initial.length, 1]] : [],
        deletes: initial.length ? [[initial.length, 0]] : [],
      },
    ];
  }

  public indexOf(clientId: string, version: number) {
    for (let i = this.revisions.length - 1; i >= 0; i--) {
      const revision = this.revisions[i];
      if (revision.clientId === clientId && revision.version === version) {
        return i;
      }
    }
    return -1;
  }

  public getDeletesForIndex(index: number): Subset {
    let deletes: Subset = this.deletes;
    for (let i = this.revisions.length - 1; i > index; i--) {
      const revision = this.revisions[i];
      deletes = subtract(deletes, revision.deletes);
      deletes = shrink(deletes, revision.inserts);
    }
    return deletes;
  }

  public getDeletesFromCurrentForIndex(index: number): Subset {
    let deletes = this.getDeletesForIndex(index);
    for (let i = index + 1; i < this.revisions.length; i++) {
      const revision = this.revisions[i];
      deletes = union(expand(deletes, revision.inserts), revision.inserts);
    }
    return deletes;
  }

  public getVisibleForIndex(index: number): string {
    const deletes = this.getDeletesFromCurrentForIndex(index);
    return apply(this.visible, synthesize(this.hidden, this.deletes, deletes));
  }

  public edit(
    patch: Patch,
    index: number = this.revisions.length - 1,
    source?: string,
    clientId: string = this.id,
    version?: number,
  ): Message {
    if (clientId === this.id && version != null) {
      throw new Error("Can't specify version for local edit");
    } else if (index < 0 || index > this.revisions.length - 1) {
      throw new Error("Index out of range of revisions");
    }
    const sourceIndex = source == null ? -1 : this.sources.indexOf(source);
    if (sourceIndex === -1) {
      source = undefined;
    }
    const oldDeletes = this.getDeletesForIndex(index);
    const oldVisibleLength = lengthOf(oldDeletes, (c) => c === 0);
    let [inserts, deletes, inserted] = factor(patch, oldVisibleLength);
    inserts = rebase(inserts, oldDeletes);
    deletes = expand(deletes, oldDeletes);
    for (let i = index + 1; i < this.revisions.length; i++) {
      const revision = this.revisions[i];
      if (source === revision.source && clientId === revision.clientId) {
        throw new Error(
          "Can’t have concurrent edits with the same client and source",
        );
      }
      const revisionSourceIndex =
        revision.source == null ? -1 : this.sources.indexOf(revision.source);
      const before =
        source === revision.source
          ? this.id < revision.clientId
          : sourceIndex < revisionSourceIndex;
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
      version: version || this.version++,
      inserts,
      deletes,
      source,
    };
    this.revisions.push(revision);
    this.visible = visible1;
    this.hidden = hidden;
    this.deletes = newDeletes;
    const { clientId: parentClientId, version: parentVersion } = this.revisions[
      index
    ];
    return {
      patch,
      source,
      clientId,
      version: revision.version,
      parentClientId,
      parentVersion,
    };
  }

  public apply(message: Message): Message | undefined {
    const index = this.indexOf(message.parentClientId, message.parentVersion);
    if (index === -1) {
      // TODO: put message in the orphanage
      return;
    }
    return this.edit(
      message.patch,
      index,
      message.source,
      message.clientId,
      message.version,
    );
  }
}

export class Server {}
