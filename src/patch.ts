import {
  clear,
  count,
  empty,
  expand,
  flagAt,
  merge,
  push,
  split,
  Subseq,
  zip,
} from "./subseq";

// Patches are arrays of strings and numbers which represent changes to text.
// Numbers represent indexes into the text. Two consecutive indexes represent a copy or retain operation, where the numbers represent the start-inclusive and end-exclusive range which should be copied over to the result.
// Deletions are represented via omission.
// Strings within a patch represent insertions at the latest index.
// The last element of a patch will always be a number which represent the length of the text being modified.
// TODO: allow for revive operations to be defined as three consecutive numbers, where the first and the second are the same number.
// Example: [0, 0, 5, 7, 7, 8, 8, 11]
/*
[
  // revive 0, 5
  0, 0, 5,
  // delete 5, 7
  // revive 7, 8
  7, 7, 8,
  // retain 8, 11
  8, 11
]
*/
// TODO: allow for move operations to be defined as three consecutive numbers, the first being a number less than the latest index which indicates a position to move a range of text, and the next two representing the range to be moved.
// Example: [0, 5, 2, 5, 8, 3, 8, 11]
/*
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
  [, text] = split(text, deleteSeq);
  return merge(inserted, text, insertSeq);
}

// TODO
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
  let consumed = 0;
  let start: number | undefined;
  for (const p of patch) {
    if (start != null) {
      // TODO: repeated number means we’re reviving a segment
      if (typeof p !== "number" || p <= consumed || p > length) {
        throw new Error("Malformed patch");
      }
      push(insertSeq, p - start, false);
      push(deleteSeq, p - start, false);
      consumed = p;
      start = undefined;
    } else if (typeof p === "number") {
      // TODO: number less than consumed means we’re moving the segment
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
  return { inserted, insertSeq, deleteSeq };
}

export function complete(patch: Partial<FactoredPatch>): FactoredPatch {
  let { inserted = "", insertSeq, deleteSeq } = patch;
  insertSeq = insertSeq || (deleteSeq && clear(deleteSeq)) || [];
  deleteSeq = deleteSeq || (insertSeq && empty(count(insertSeq, false))) || [];
  return { inserted, insertSeq, deleteSeq };
}

export function synthesize(patch: Partial<FactoredPatch>): Patch {
  let { inserted, insertSeq, deleteSeq } = complete(patch);
  if (
    flagAt(insertSeq, insertSeq.length - 1) &&
    flagAt(deleteSeq, deleteSeq.length - 1)
  ) {
    throw new Error("Insertions after deletions");
  }
  const result: Patch = [];
  let index = 0;
  let consumed = 0;
  deleteSeq = expand(deleteSeq, insertSeq);
  for (const [length, iFlag, dFlag] of zip(insertSeq, deleteSeq)) {
    if (iFlag) {
      result.push(inserted.slice(index, index + length));
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
  const length = count(insertSeq, false);
  if (typeof last !== "number" || last < length) {
    result.push(length);
  }
  return result;
}
