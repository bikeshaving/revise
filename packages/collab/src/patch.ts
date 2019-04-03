import { Subseq } from "./subseq";
import * as subseq from "./subseq";

/*
Patches are arrays of strings and numbers which represent changes to text.
Numbers represent indexes into the text. Two consecutive indexes represent a copy or retain operation, where the numbers represent the start-inclusive and end-exclusive range which should be copied over to the result.
Deletions are represented via omission.
Strings within a patch represent insertions at the latest index.
The last element of a patch will always be a number which represent the length of the text being modified.
TODO: allow for revive operations to be defined as three consecutive numbers, where the first and the second are the same number.
Example:
[0, 0, 5, 7, 7, 8, 8, 11]
[
  // revive 0, 5
  0, 0, 5,
  // delete 5, 7
  // revive 7, 8
  7, 7, 8,
  // retain 8, 11
  8, 11
]
TODO: allow for move operations to be defined as three consecutive numbers, the first being a number less than the latest index which indicates a position to move a range of text, and the next two representing the range to be moved.
Example:
[0, 5, 2, 5, 8, 3, 8, 11]
[
  // retain 0, 5
  0, 5,
  // move 5, 8 to 2
  2, 5, 8,
  // move 8, 11 to 3
  3, 8, 11
]
*/
export type Patch = (string | number)[];

export function apply(text: string, patch: Patch): string {
  const { inserted, insertSeq, deleteSeq } = factor(patch);
  [, text] = subseq.split(text, deleteSeq);
  return subseq.merge(inserted, text, insertSeq);
}

export interface InsertOperation {
  type: "insert";
  start: number;
  inserted: string;
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

type Operation = InsertOperation | RetainOperation | DeleteOperation;

export function* operations(patch: Patch): IterableIterator<Operation> {
  const length = patch[patch.length - 1];
  if (typeof length !== "number") {
    throw new Error("Malformed patch");
  }
  let start = 0;
  let retaining = false;
  for (const p of patch) {
    if (retaining) {
      if (typeof p !== "number" || p <= start || p > length) {
        throw new Error("Malformed patch");
      }
      yield { type: "retain", start, end: p };
      start = p;
      retaining = false;
    } else if (typeof p === "number") {
      if (p < start) {
        throw new Error("Malformed patch");
      } else if (p > start) {
        yield { type: "delete", start, end: p };
      }
      start = p;
      retaining = true;
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
  const insertSeq: Subseq = [];
  const deleteSeq: Subseq = [];
  for (const op of operations(patch)) {
    switch (op.type) {
      case "retain": {
        subseq.push(insertSeq, op.end - op.start, false);
        subseq.push(deleteSeq, op.end - op.start, false);
        break;
      }
      case "delete": {
        subseq.push(insertSeq, op.end - op.start, false);
        subseq.push(deleteSeq, op.end - op.start, true);
        break;
      }
      case "insert": {
        subseq.push(insertSeq, op.inserted.length, true);
        inserted += op.inserted;
        break;
      }
    }
  }
  return { inserted, insertSeq, deleteSeq };
}

export function complete(patch: Partial<FactoredPatch>): FactoredPatch {
  let { inserted = "", insertSeq, deleteSeq } = patch;
  insertSeq = insertSeq || (deleteSeq && subseq.clear(deleteSeq)) || [];
  deleteSeq =
    deleteSeq ||
    (insertSeq && subseq.empty(subseq.count(insertSeq, false))) ||
    [];
  return { inserted, insertSeq, deleteSeq };
}

export function synthesize(patch: Partial<FactoredPatch>): Patch {
  let { inserted, insertSeq, deleteSeq } = complete(patch);
  const result: Patch = [];
  let index = 0;
  let consumed = 0;
  deleteSeq = subseq.expand(deleteSeq, insertSeq);
  for (const [length, iFlag, dFlag] of subseq.zip(insertSeq, deleteSeq)) {
    if (iFlag) {
      const text = inserted.slice(index, index + length);
      if (typeof result[result.length - 1] === "string") {
        result[result.length - 1] = result[result.length - 1] + text;
      } else {
        result.push(text);
      }
      index += length;
    } else {
      if (!dFlag) {
        result.push(consumed, consumed + length);
      }
      consumed += length;
    }
  }
  if (index !== inserted.length) {
    throw new Error("Length mismatch");
  }
  const last = result[result.length - 1];
  const length = subseq.count(insertSeq, false);
  if (typeof last !== "number" || last < length) {
    result.push(length);
  }
  return result;
}

export function meld(patch1: Patch, patch2: Patch): Patch {
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
  let hiddenSeq = subseq.expand(deleteSeq1, insertSeq1);
  deleteSeq2 = subseq.expand(deleteSeq2, hiddenSeq, { union: true });
  let erasedSeq = subseq.intersection(insertSeq1, deleteSeq2);
  // TODO: reorder this so it’s not so disjointed
  deleteSeq2 = subseq.shrink(deleteSeq2, insertSeq1);
  [, insertSeq2] = subseq.interleave(hiddenSeq, insertSeq2);
  erasedSeq = subseq.expand(erasedSeq, insertSeq2);
  insertSeq1 = subseq.expand(insertSeq1, insertSeq2);
  [inserted2, insertSeq2] = subseq.unify(
    inserted1,
    inserted2,
    insertSeq1,
    insertSeq2,
  );
  inserted2 = subseq.erase(inserted2, insertSeq2, erasedSeq);
  insertSeq2 = subseq.shrink(insertSeq2, erasedSeq);
  return synthesize({
    inserted: inserted2,
    insertSeq: insertSeq2,
    deleteSeq: deleteSeq2,
  });
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
  subseq.push(deleteSeq, start, false);
  subseq.push(deleteSeq, end - start, true);
  subseq.push(deleteSeq, length - end, false);
  let insertSeq: Subseq = [];
  subseq.push(insertSeq, start, false);
  subseq.push(insertSeq, inserted.length, true);
  subseq.push(insertSeq, length - start, false);
  return synthesize({ inserted, insertSeq, deleteSeq });
}
