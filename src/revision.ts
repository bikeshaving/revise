import { factor, Patch, synthesize } from "./patch";
import { difference, expand, interleave, shrink, Subseq } from "./subseq";
import { invert } from "./utils";

export interface Revision {
  patch: Patch;
  client: string;
  priority?: number;
}

export function compare(r1: Revision, r2: Revision): number {
  if ((r1.priority || 0) < (r2.priority || 0)) {
    return -1;
  } else if ((r1.priority || 0) > (r2.priority || 0)) {
    return 1;
  } else if (r1.client < r2.client) {
    return -1;
  } else if (r1.client > r2.client) {
    return 1;
  }
  return 0;
}

export function summarize(revisions: Revision[]): Subseq {
  if (!revisions.length) {
    throw new Error("Empty revisions");
  }
  let { insertSeq: result } = factor(revisions[0].patch);
  for (const rev of revisions.slice(1)) {
    const { insertSeq } = factor(rev.patch);
    result = expand(result, insertSeq, { union: true });
  }
  return result;
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
    deleteSeq1 = expand(difference(deleteSeq1, deleteSeq), insertSeq);
    deleteSeq = expand(deleteSeq, insertSeq1);
    if (priority < 0) {
      [insertSeq, insertSeq1] = interleave(insertSeq, insertSeq1);
    } else {
      [insertSeq1, insertSeq] = interleave(insertSeq1, insertSeq);
    }
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
  let insertSeq1: Subseq | undefined;
  for (let rev of invert(revisions)) {
    let { inserted, insertSeq, deleteSeq } = factor(rev.patch);
    if (test(rev)) {
      if (insertSeq1 == null) {
        insertSeq1 = insertSeq;
      } else {
        insertSeq1 = expand(insertSeq, insertSeq1, { union: true });
      }
    } else {
      if (insertSeq1 != null) {
        deleteSeq = expand(expand(deleteSeq, insertSeq), insertSeq1);
        insertSeq = expand(insertSeq, insertSeq1);
        deleteSeq = shrink(deleteSeq, insertSeq);
        insertSeq1 = shrink(insertSeq1, insertSeq);
        rev = { ...rev, patch: synthesize({ inserted, insertSeq, deleteSeq }) };
      }
      revisions1.unshift(rev);
    }
  }
  return revisions1;
}
