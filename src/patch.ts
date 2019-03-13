import { Subseq } from "./subseq";
import * as subseq from "./subseq";

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
  [, text] = subseq.split(text, deleteSeq);
  return subseq.merge(inserted, text, insertSeq);
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
      subseq.push(insertSeq, p - start, false);
      subseq.push(deleteSeq, p - start, false);
      consumed = p;
      start = undefined;
    } else if (typeof p === "number") {
      // TODO: number less than consumed means we’re moving the segment
      if (p < consumed) {
        throw new Error("Malformed patch");
      }
      subseq.push(insertSeq, p - consumed, false);
      subseq.push(deleteSeq, p - consumed, true);
      consumed = p;
      start = p;
    } else {
      subseq.push(insertSeq, p.length, true);
      inserted += p;
    }
  }
  subseq.push(insertSeq, length - consumed, false);
  subseq.push(deleteSeq, length - consumed, true);
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

export function compose(patch1: Patch, patch2: Patch): Patch {
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
  let reviveSeq = subseq.intersection(insertSeq1, deleteSeq2);
  deleteSeq2 = subseq.shrink(deleteSeq2, insertSeq1);
  [insertSeq2] = subseq.interleave(insertSeq2, hiddenSeq);
  reviveSeq = subseq.expand(reviveSeq, insertSeq2);
  [inserted2, insertSeq2] = subseq.compose(
    inserted1,
    inserted2,
    insertSeq1,
    insertSeq2,
  );
  inserted2 = subseq.erase(inserted2, insertSeq2, reviveSeq);
  insertSeq2 = subseq.shrink(insertSeq2, reviveSeq);
  return synthesize({
    inserted: inserted2,
    insertSeq: insertSeq2,
    deleteSeq: deleteSeq2,
  });
}

export class PatchBuilder {
  public patch: Patch | undefined;
  constructor(protected length: number) {}

  replace(start: number, end: number, inserted: string): void {
    if (end < start) {
      throw new Error("end < start");
    }
    const length = inserted.length - (end - start);
    let deleteSeq: Subseq = [];
    subseq.push(deleteSeq, start, false);
    subseq.push(deleteSeq, end - start, true);
    subseq.push(deleteSeq, this.length - end, false);
    let insertSeq: Subseq = [];
    subseq.push(insertSeq, start, false);
    subseq.push(insertSeq, inserted.length, true);
    subseq.push(insertSeq, this.length - start, false);
    const patch = synthesize({ inserted, insertSeq, deleteSeq });
    // this is a prettier issue https://github.com/prettier/prettier/issues/5969
    // prettier-ignore
    this.patch = this.patch == null ? patch : compose(this.patch, patch);
    this.length += length;
  }
}
