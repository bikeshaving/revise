import {
  clear,
  consolidate,
  count,
  erase,
  expand,
  interleave,
  intersection,
  merge,
  push as pushSegment,
  shrink,
  split,
  Subseq,
  union,
  zip,
} from "./subseq";

/*
Patches are arrays of strings and numbers which represent changes to text.
Numbers represent indexes into the text. Two consecutive indexes represent a copy or retain operation, where the numbers represent the start-inclusive and end-exclusive range which should be copied over to the result. Deletions are represented via omission, i.e. a gap between two copy operations.
Strings within a patch represent insertions at the current index.
A -1 before a string indicates the string is added and immediately deleted. It is useful for representing squashed patches or patches made against a snapshot.
The last element of a patch will always be a number which represent the length of the text being modified.
*/

// TODO: allow for revive operations to be defined as three consecutive numbers, where the first and the second are the same number.
// Example:
// [0, 0, 5, 7, 7, 8, 8, 11]
// [
//   // revive 0, 5
//   0, 0, 5,
//   // delete 5, 7
//   // revive 7, 8
//   7, 7, 8,
//   // retain 8, 11
//   8, 11
// ]

// TODO: allow for move operations
// Example:
// [0, 5, 2, 5, 8, 3, 11]
// [
//   // retain 0 to 5
//   0, 5,
//   // move 5 to 8 back to 2
//   2, 5, 8,
//   // move 8 to 11 back to 3 and delete
//   3, 11
// ]
export type Patch = (number | string)[];

export interface RetainOperation {
  type: "retain";
  start: number;
  end: number;
}

export interface DeleteOperation {
  type: "delete";
  start: number;
  end: number;
}

export interface InsertOperation {
  type: "insert";
  start: number;
  inserted: string;
}

// ToggleOperation represents insertions which are immediately deleted. It is useful for representing squashed patches or patches made against a snapshot.
export interface ToggleOperation {
  type: "toggle";
  start: number;
  inserted: string;
}

export type Operation =
  | RetainOperation
  | DeleteOperation
  | InsertOperation
  | ToggleOperation;

export function* operations(patch: Patch): IterableIterator<Operation> {
  const length = patch[patch.length - 1];
  if (typeof length !== "number") {
    throw new Error("Malformed patch");
  }
  let start = 0;
  let retaining = false;
  let toggling = false;
  for (const op of patch) {
    if (retaining) {
      if (typeof op === "string") {
        yield { type: "insert", start, inserted: op };
        retaining = false;
      } else if (op === -1) {
        retaining = false;
        toggling = true;
      } else {
        if (op <= start || op > length) {
          throw new Error("Malformed patch");
        }
        yield { type: "retain", start, end: op };
        start = op;
        retaining = false;
      }
    } else if (toggling) {
      if (typeof op !== "string") {
        throw new Error("Malformed patch");
      }
      yield { type: "toggle", start, inserted: op };
      toggling = false;
    } else if (typeof op === "number") {
      if (op === -1) {
        toggling = true;
      } else {
        if (op < start || op > length) {
          throw new Error("Malformed patch");
        } else if (op > start) {
          yield { type: "delete", start, end: op };
        }
        start = op;
        retaining = true;
      }
    } else if (typeof op === "string") {
      yield { type: "insert", start, inserted: op };
    } else {
      throw new Error("Malformed patch");
    }
  }
  if (length > start) {
    yield { type: "delete", start, end: length };
  }
}

// TODO: add moves interface
// export interface Moves {
//   [to: number]: Subseq;
// }

export interface FactoredPatch {
  inserted: string;
  insertSeq: Subseq;
  deleteSeq: Subseq;
  // reviveSeq: Subseq;
  // moves: Moves;
}

export function factor(patch: Patch): FactoredPatch {
  const length = patch[patch.length - 1];
  if (typeof length !== "number") {
    throw new Error("Malformed patch");
  }
  let inserted = "";
  const deleteSeq: Subseq = [];
  const insertSeq: Subseq = [];
  for (const op of operations(patch)) {
    switch (op.type) {
      case "retain": {
        pushSegment(deleteSeq, op.end - op.start, false);
        pushSegment(insertSeq, op.end - op.start, false);
        break;
      }
      case "delete": {
        pushSegment(deleteSeq, op.end - op.start, true);
        pushSegment(insertSeq, op.end - op.start, false);
        break;
      }
      case "insert": {
        pushSegment(deleteSeq, op.inserted.length, false);
        pushSegment(insertSeq, op.inserted.length, true);
        inserted += op.inserted;
        break;
      }
      case "toggle": {
        pushSegment(deleteSeq, op.inserted.length, true);
        pushSegment(insertSeq, op.inserted.length, true);
        inserted += op.inserted;
        break;
      }
    }
  }
  return { inserted, insertSeq, deleteSeq };
}

export function push(patch: Patch, op: string | number): number {
  const last = patch[patch.length - 1];
  if (typeof op === "number") {
    if (last !== op) {
      patch.push(op);
    }
  } else if (typeof op === "string") {
    if (typeof last === "string") {
      patch[patch.length - 1] += op;
    } else {
      patch.push(op);
    }
  }
  return patch.length;
}

export function complete(patch: Partial<FactoredPatch>): FactoredPatch {
  let { inserted = "", insertSeq, deleteSeq } = patch;
  insertSeq = insertSeq || (deleteSeq && clear(deleteSeq)) || [];
  deleteSeq = deleteSeq || (insertSeq && clear(insertSeq)) || [];
  return { inserted, insertSeq, deleteSeq };
}

export function synthesize(patch: Partial<FactoredPatch>): Patch {
  let { inserted, insertSeq, deleteSeq } = complete(patch);
  const result: Patch = [];
  let insertIndex = 0;
  let retainIndex = 0;
  let prevDFlag = false;
  for (const [length, iFlag, dFlag] of zip(insertSeq, deleteSeq)) {
    if (iFlag) {
      if (prevDFlag) {
        push(result, retainIndex);
      }
      if (dFlag) {
        push(result, -1);
      }
      const text = inserted.slice(insertIndex, insertIndex + length);
      push(result, text);
      insertIndex += length;
    } else {
      if (!dFlag) {
        push(result, retainIndex);
      }
      retainIndex += length;
      if (!dFlag || typeof result[result.length - 1] === "string") {
        push(result, retainIndex);
      }
    }
    prevDFlag = dFlag;
  }
  if (insertIndex !== inserted.length) {
    throw new Error("Length mismatch");
  }
  const length = count(insertSeq, false);
  push(result, length);
  return result;
}

export function squash(patch1: Patch, patch2: Patch): Patch {
  let factored1 = factor(patch1);
  let factored2 = factor(patch2);
  const [inserted, insertSeq] = consolidate(
    factored1.inserted,
    factored2.inserted,
    expand(factored1.insertSeq, factored2.insertSeq),
    factored2.insertSeq,
  );
  const deleteSeq = union(
    expand(factored1.deleteSeq, factored2.insertSeq),
    factored2.deleteSeq,
  );
  return synthesize({ inserted, insertSeq, deleteSeq });
}

export function apply(text: string, patch: Patch): string {
  if (text.length !== patch[patch.length - 1]) {
    throw new Error("Length mismatch");
  }
  const { inserted, insertSeq, deleteSeq } = factor(patch);
  text = merge(text, inserted, insertSeq);
  [text] = split(text, deleteSeq);
  return text;
}

export function build(
  start: number,
  end: number,
  inserted: string,
  length: number,
): Patch {
  if (length < end) {
    throw new RangeError(`length (${length}) cannot be less than end (${end})`);
  } else if (end < start) {
    throw new RangeError(`end (${end}) cannot be less than start (${start})`);
  }
  let deleteSeq: Subseq = [];
  pushSegment(deleteSeq, start, false);
  pushSegment(deleteSeq, inserted.length, false);
  pushSegment(deleteSeq, end - start, true);
  pushSegment(deleteSeq, length - end, false);
  let insertSeq: Subseq = [];
  pushSegment(insertSeq, start, false);
  pushSegment(insertSeq, inserted.length, true);
  pushSegment(insertSeq, length - start, false);
  return synthesize({ inserted, insertSeq, deleteSeq });
}

export function expandHidden(
  patch: Patch,
  hiddenSeq: Subseq,
  options: { before?: boolean } = {},
): Patch {
  const { before = false } = options;
  let { inserted, insertSeq, deleteSeq } = factor(patch);
  if (before) {
    [insertSeq, hiddenSeq] = interleave(insertSeq, hiddenSeq);
  } else {
    [hiddenSeq, insertSeq] = interleave(hiddenSeq, insertSeq);
  }
  deleteSeq = expand(deleteSeq, hiddenSeq);
  return synthesize({ inserted, insertSeq, deleteSeq });
}

export function shrinkHidden(patch: Patch, hiddenSeq: Subseq): Patch {
  let { inserted, insertSeq, deleteSeq } = factor(patch);
  hiddenSeq = expand(hiddenSeq, insertSeq);
  hiddenSeq = union(hiddenSeq, intersection(insertSeq, deleteSeq));
  [inserted, insertSeq] = erase(inserted, insertSeq, hiddenSeq);
  deleteSeq = shrink(deleteSeq, hiddenSeq);
  return synthesize({ inserted, insertSeq, deleteSeq });
}
