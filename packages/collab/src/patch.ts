import {
  clear,
  count,
  difference,
  expand,
  interleave,
  merge,
  push,
  shrink,
  split,
  Subseq,
  unify,
  union,
  zip,
} from "./subseq";
import { invert } from "./utils";

/*
Patches are arrays of strings and numbers which represent changes to text.
Numbers represent indexes into the text. Two consecutive indexes represent a copy or retain operation, where the numbers represent the start-inclusive and end-exclusive range which should be copied over to the result. Deletions are represented via omission, i.e. a gap between two copy operations.
Strings within a patch represent insertions at the current index.
A -1 before a string indicates the string is added and immediately removed (useful to squash multiple patches without losing information).
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
export type Patch = (string | number)[];

export function apply(text: string, patch: Patch): string {
  const factored = factor(patch);
  const deleteSeq = shrink(factored.deleteSeq, factored.insertSeq);
  [text] = split(text, deleteSeq);
  const insertSeq = difference(factored.insertSeq, factored.deleteSeq);
  return merge(text, factored.inserted, insertSeq);
}

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

// TODO: is there a better name for this? Looking for a word that means insert and immediately remove. Bonus points if it’s six letters
export interface RemoveOperation {
  type: "remove";
  start: number;
  inserted: string;
}

export type Operation =
  | RetainOperation
  | DeleteOperation
  | InsertOperation
  | RemoveOperation;

export function* operations(patch: Patch): IterableIterator<Operation> {
  const length = patch[patch.length - 1];
  if (typeof length !== "number") {
    throw new Error("Malformed patch");
  }
  let start = 0;
  let retaining = false;
  let removing = false;
  for (const p of patch) {
    if (retaining) {
      if (typeof p !== "number") {
        throw new Error("Malformed patch");
      } else if (p === -1) {
        retaining = false;
        removing = true;
      } else {
        if (p <= start || p > length) {
          throw new Error("Malformed patch");
        }
        yield { type: "retain", start, end: p };
        start = p;
        retaining = false;
      }
    } else if (removing) {
      if (typeof p !== "string") {
        throw new Error("Malformed patch");
      }
      yield { type: "remove", start, inserted: p };
      removing = false;
    } else if (typeof p === "number") {
      if (p === -1) {
        removing = true;
      } else {
        if (p < start || p > length) {
          throw new Error("Malformed patch");
        } else if (p > start) {
          yield { type: "delete", start, end: p };
        }
        start = p;
        retaining = true;
      }
    } else if (typeof p === "string") {
      yield { type: "insert", start, inserted: p };
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
        push(deleteSeq, op.end - op.start, false);
        push(insertSeq, op.end - op.start, false);
        break;
      }
      case "delete": {
        push(deleteSeq, op.end - op.start, true);
        push(insertSeq, op.end - op.start, false);
        break;
      }
      case "insert": {
        push(deleteSeq, op.inserted.length, false);
        push(insertSeq, op.inserted.length, true);
        inserted += op.inserted;
        break;
      }
      case "remove": {
        push(deleteSeq, op.inserted.length, true);
        push(insertSeq, op.inserted.length, true);
        inserted += op.inserted;
        break;
      }
    }
  }
  return { inserted, insertSeq, deleteSeq };
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
      if (dFlag) {
        if (prevDFlag) {
          result.push(retainIndex);
        }
        result.push(-1);
      }
      const text = inserted.slice(insertIndex, insertIndex + length);
      if (typeof result[result.length - 1] === "string") {
        result[result.length - 1] += text;
      } else {
        result.push(text);
      }
      insertIndex += length;
    } else {
      if (!dFlag) {
        result.push(retainIndex, retainIndex + length);
      }
      retainIndex += length;
    }
    prevDFlag = dFlag;
  }
  if (insertIndex !== inserted.length) {
    throw new Error("Length mismatch");
  }
  const length = count(insertSeq, false);
  const last = result[result.length - 1];
  if (typeof last !== "number" || last < length) {
    result.push(length);
  }
  return result;
}

export function order(patch1: Patch, patch2: Patch): [Patch, Patch] {
  let {
    inserted: inserted1,
    insertSeq: insertSeq1,
    deleteSeq: deleteSeq1,
  } = factor(patch1);
  let {
    inserted: inserted2,
    insertSeq: insertSeq2,
    deleteSeq: deleteSeq2,
  } = factor(patch2);
  [insertSeq1, insertSeq2] = interleave(insertSeq1, insertSeq2);
  deleteSeq1 = expand(deleteSeq1, insertSeq2);
  deleteSeq2 = expand(deleteSeq2, insertSeq1);
  return [
    synthesize({
      inserted: inserted1,
      insertSeq: insertSeq1,
      deleteSeq: deleteSeq1,
    }),
    synthesize({
      inserted: inserted2,
      insertSeq: insertSeq2,
      deleteSeq: deleteSeq2,
    }),
  ];
}

export function squash(patch1: Patch, patch2: Patch): Patch {
  let factored1 = factor(patch1);
  let factored2 = factor(patch2);
  const [inserted, insertSeq] = unify(
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

export function summarize(patches: Patch[]): Patch {
  if (patches.length === 0) {
    throw new Error("empty array");
  }
  return patches.reduce(squash);
}

export function build(
  start: number,
  end: number,
  inserted: string,
  length: number,
): Patch {
  if (length < end) {
    throw new RangeError("length cannot be less than end");
  } else if (end < start) {
    throw new RangeError("end cannot be less than start");
  }
  let deleteSeq: Subseq = [];
  push(deleteSeq, start, false);
  push(deleteSeq, inserted.length, false);
  push(deleteSeq, end - start, true);
  push(deleteSeq, length - end, false);
  let insertSeq: Subseq = [];
  push(insertSeq, start, false);
  push(insertSeq, inserted.length, true);
  push(insertSeq, length - start, false);
  return synthesize({ inserted, insertSeq, deleteSeq });
}

export function normalize(patch: Patch, hiddenSeq: Subseq): Patch {
  let { inserted, insertSeq, deleteSeq } = factor(patch);
  deleteSeq = difference(deleteSeq, expand(hiddenSeq, insertSeq));
  return synthesize({ inserted, insertSeq, deleteSeq });
}

export interface LabeledPatch {
  patch: Patch;
}

export function rebase<T extends LabeledPatch, U extends LabeledPatch>(
  patch: T,
  patches: U[],
  compare: (patch1: T, patch2: U) => number,
): [T, U[]] {
  if (!patches.length) {
    return [patch, patches];
  }
  let { inserted, insertSeq, deleteSeq } = factor(patch.patch);
  patches = patches.map((patch1) => {
    let {
      inserted: inserted1,
      insertSeq: insertSeq1,
      deleteSeq: deleteSeq1,
    } = factor(patch1.patch);
    const priority = compare(patch, patch1);
    if (priority < 0) {
      [insertSeq, insertSeq1] = interleave(insertSeq, insertSeq1);
    } else if (priority > 0) {
      [insertSeq1, insertSeq] = interleave(insertSeq1, insertSeq);
    } else {
      throw new Error("compare function identified two patches as equal");
    }
    deleteSeq = expand(deleteSeq, insertSeq1);
    deleteSeq1 = difference(expand(deleteSeq1, insertSeq), deleteSeq);
    return {
      ...patch1,
      patch: synthesize({
        inserted: inserted1,
        insertSeq: insertSeq1,
        deleteSeq: deleteSeq1,
      }),
    };
  });
  patch = { ...patch, patch: synthesize({ inserted, insertSeq, deleteSeq }) };
  return [patch, patches];
}

export function rearrange<T extends LabeledPatch>(
  patches: T[],
  test: (patch: T) => boolean,
): T[] {
  if (!patches.length) {
    return patches;
  }
  const result: T[] = [];
  let expandSeq: Subseq | undefined;
  for (let patch of invert(patches)) {
    let { inserted, insertSeq, deleteSeq } = factor(patch.patch);
    if (test(patch)) {
      if (expandSeq == null) {
        expandSeq = insertSeq;
      } else {
        expandSeq = expand(insertSeq, expandSeq, { union: true });
      }
    } else {
      if (expandSeq != null) {
        deleteSeq = expand(deleteSeq, expandSeq);
        insertSeq = expand(insertSeq, expandSeq);
        expandSeq = shrink(expandSeq, insertSeq);
        patch = {
          ...patch,
          patch: synthesize({ inserted, insertSeq, deleteSeq }),
        };
      }
      result.unshift(patch);
    }
  }
  return result;
}
