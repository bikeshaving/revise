import { factor, Patch, synthesize } from "./patch";
import { difference, expand, interleave, shrink, Subseq } from "./subseq";
import { invert } from "./utils";

export interface Revision {
  patch: Patch;
  client: string;
  priority?: number;
}

export function compare(rev1: Revision, rev2: Revision): number {
  if ((rev1.priority || 0) < (rev2.priority || 0)) {
    return -1;
  } else if ((rev1.priority || 0) > (rev2.priority || 0)) {
    return 1;
  } else if (rev1.client < rev2.client) {
    return -1;
  } else if (rev1.client > rev2.client) {
    return 1;
  }
  return 0;
}

export function summarize(revisions: Revision[]): Subseq {
  if (!revisions.length) {
    throw new Error("Empty revisions");
  }
  let { insertSeq: expandSeq } = factor(revisions[0].patch);
  for (const rev of revisions.slice(1)) {
    const { insertSeq } = factor(rev.patch);
    expandSeq = expand(expandSeq, insertSeq, { union: true });
  }
  return expandSeq;
}

export function rebase(
  rev: Revision,
  revisions: Revision[],
): [Revision, Revision[]] {
  if (!revisions.length) {
    return [rev, revisions];
  }
  let { inserted, insertSeq, deleteSeq } = factor(rev.patch);
  revisions = revisions.map((rev1) => {
    const priority = compare(rev, rev1);
    if (priority === 0) {
      throw new Error("Concurrent edits with same client and priority");
    }
    let {
      inserted: inserted1,
      insertSeq: insertSeq1,
      deleteSeq: deleteSeq1,
    } = factor(rev1.patch);
    if (priority < 0) {
      [insertSeq, insertSeq1] = interleave(insertSeq, insertSeq1);
    } else {
      [insertSeq1, insertSeq] = interleave(insertSeq1, insertSeq);
    }
    deleteSeq = expand(deleteSeq, insertSeq1);
    deleteSeq1 = difference(expand(deleteSeq1, insertSeq), deleteSeq);
    return {
      ...rev1,
      patch: synthesize({
        inserted: inserted1,
        insertSeq: insertSeq1,
        deleteSeq: deleteSeq1,
      }),
    };
  });
  rev = { ...rev, patch: synthesize({ inserted, insertSeq, deleteSeq }) };
  return [rev, revisions];
}

export function rearrange(
  revisions: Revision[],
  test: (rev: Revision) => boolean,
): Revision[] {
  if (!revisions.length) {
    return revisions;
  }
  const revisions1: Revision[] = [];
  let expandSeq: Subseq | undefined;
  for (let rev of invert(revisions)) {
    let { inserted, insertSeq, deleteSeq } = factor(rev.patch);
    if (test(rev)) {
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
        rev = { ...rev, patch: synthesize({ inserted, insertSeq, deleteSeq }) };
      }
      revisions1.unshift(rev);
    }
  }
  return revisions1;
}
