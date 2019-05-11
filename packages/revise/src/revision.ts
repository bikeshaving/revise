import {
  difference,
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
  // readonly patch: Patch
  readonly inserted: string;
  readonly insertSeq: Subseq;
  readonly deleteSeq: Subseq;
  readonly revertSeq: Subseq;
}

export function rewind(hiddenSeq: Subseq, revs: Revision[]) {
  for (let { insertSeq, deleteSeq, revertSeq } of invert(revs)) {
    deleteSeq = difference(deleteSeq, revertSeq);
    hiddenSeq = difference(hiddenSeq, deleteSeq);
    hiddenSeq = shrink(hiddenSeq, insertSeq);
  }
  return hiddenSeq;
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
    deleteSeq1 = expand(deleteSeq1, insertSeq);
    // TODO: figure out if this is necessary
    const intersecting = intersection(deleteSeq, deleteSeq1);
    revertSeq = union(expand(revertSeq, insertSeq1), intersecting);
    revertSeq1 = union(expand(revertSeq1, insertSeq), intersecting);
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
    throw new Error("summarize called with empty array");
  }
  let expandSeq = revs[0].insertSeq;
  for (const rev of revs.slice(1)) {
    expandSeq = expand(expandSeq, rev.insertSeq, { union: true });
  }
  return expandSeq;
}

export function normalize(rev: Revision, hiddenSeq: Subseq): Revision {
  hiddenSeq = expand(hiddenSeq, rev.insertSeq);
  return { ...rev, revertSeq: intersection(rev.deleteSeq, hiddenSeq) };
}
