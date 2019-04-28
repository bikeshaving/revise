import {
  expand,
  interleave,
  intersection,
  shrink,
  Subseq,
  union,
} from "./subseq";
import { invert } from "./utils";

export interface Revision {
  readonly client: string;
  readonly inserted: string;
  readonly insertSeq: Subseq;
  readonly deleteSeq: Subseq;
  readonly revertSeq: Subseq;
}

export function compare(rev1: Revision, rev2: Revision): number {
  return rev1.client < rev2.client ? -1 : rev1.client > rev2.client ? 1 : 0;
}

export function rebase(
  rev: Revision,
  revs: Revision[],
  compareFn: typeof compare = compare,
): [Revision, Revision[]] {
  if (!revs.length) {
    return [rev, revs];
  }
  let { client, inserted, insertSeq, deleteSeq, revertSeq } = rev;
  let revs1: Revision[] = [];
  for (const rev1 of revs) {
    let {
      client: client1,
      inserted: inserted1,
      insertSeq: insertSeq1,
      deleteSeq: deleteSeq1,
      revertSeq: revertSeq1,
    } = rev1;
    const c = compareFn(rev, rev1);
    if (c < 0) {
      [insertSeq, insertSeq1] = interleave(insertSeq, insertSeq1);
    } else if (c > 0) {
      [insertSeq1, insertSeq] = interleave(insertSeq1, insertSeq);
    } else {
      throw new Error("compare function identified two revisions as equal");
    }
    deleteSeq = expand(deleteSeq, insertSeq1);
    revertSeq = expand(revertSeq, insertSeq1);
    deleteSeq1 = expand(deleteSeq1, insertSeq);
    revertSeq1 = union(
      expand(revertSeq1, insertSeq),
      intersection(deleteSeq, deleteSeq1),
    );
    revs1.push({
      client: client1,
      inserted: inserted1,
      insertSeq: insertSeq1,
      deleteSeq: deleteSeq1,
      revertSeq: revertSeq1,
    });
  }
  rev = { client, inserted, insertSeq, deleteSeq, revertSeq };
  return [rev, revs1];
}

export function rearrange(
  revs: Revision[],
  test: (rev: Revision) => boolean,
): Revision[] {
  if (!revs.length) {
    return revs;
  }
  const result: Revision[] = [];
  let hiddenSeq: Subseq | undefined;
  let expandSeq: Subseq | undefined;
  for (let rev of invert(revs)) {
    let { client, inserted, insertSeq, deleteSeq, revertSeq } = rev;
    if (test(rev)) {
      if (expandSeq == null) {
        hiddenSeq = revertSeq;
        expandSeq = insertSeq;
      } else if (expandSeq != null && hiddenSeq != null) {
        hiddenSeq = union(hiddenSeq, expand(revertSeq, expandSeq));
        expandSeq = expand(insertSeq, expandSeq, { union: true });
      }
    } else {
      if (expandSeq != null && hiddenSeq != null) {
        deleteSeq = expand(deleteSeq, expandSeq);
        insertSeq = expand(insertSeq, expandSeq);
        revertSeq = union(expand(revertSeq, expandSeq), hiddenSeq);
        expandSeq = shrink(expandSeq, insertSeq);
        hiddenSeq = shrink(hiddenSeq, insertSeq);
        rev = { client, inserted, insertSeq, deleteSeq, revertSeq };
      }
      result.unshift(rev);
    }
  }
  return result;
}

export function summarize(revs: Revision[]): Subseq {
  if (revs.length === 0) {
    throw new Error("empty array");
  }
  let { insertSeq } = revs[0];
  for (const rev of revs.slice(1)) {
    insertSeq = expand(insertSeq, rev.insertSeq, { union: true });
  }
  return insertSeq;
}
