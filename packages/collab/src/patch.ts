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

/*
Patches are arrays of strings and numbers which represent changes to text.
Numbers represent indexes into the text. Two consecutive indexes represent a copy or retain operation, where the numbers represent the start-inclusive and end-exclusive range which should be copied over to the result. Deletions are represented via omission, i.e. a gap between two copy operations.
Strings within a patch represent insertions at the current index.
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
//   // move 5 to 8 to 2
//   2, 5, 8,
//   // move 8 to 11 to 3 and delete
//   3, 11
// ]
export type Patch = (string | number)[];

export function apply(text: string, patch: Patch): string {
  const factored = factor(patch);
  const deleteSeq = shrink(factored.deleteSeq, factored.insertSeq);
  [, text] = split(text, deleteSeq);
  const insertSeq = difference(factored.insertSeq, factored.deleteSeq);
  return merge(factored.inserted, text, insertSeq);
}

export function isNoop(patch: Patch): boolean {
  return patch.length === 2 && patch[0] === 0;
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
      if (typeof p !== "number" || p <= start || p > length) {
        throw new Error("Malformed patch");
      }
      yield { type: "retain", start, end: p };
      start = p;
      retaining = false;
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
    } else {
      yield { type: "insert", start, inserted: p };
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
  for (const [length, iFlag, dFlag] of zip(insertSeq, deleteSeq)) {
    if (iFlag) {
      if (dFlag) {
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
  const { inserted, insertSeq, deleteSeq } = factor(patch);
  return synthesize({
    inserted,
    insertSeq,
    deleteSeq: difference(deleteSeq, expand(hiddenSeq, insertSeq)),
  });
}
