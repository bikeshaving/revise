import { factor, Patch, synthesize } from "./patch";
import {
  difference,
  expand,
  interleave,
  shrink,
  Subseq,
  union,
} from "./subseq";

export function rewind(hiddenSeq: Subseq, patches: Patch[]): Subseq {
  for (let i = patches.length - 1; i >= 0; i--) {
    const { insertSeq, deleteSeq } = factor(patches[i]);
    hiddenSeq = difference(hiddenSeq, deleteSeq);
    hiddenSeq = shrink(hiddenSeq, insertSeq);
  }
  return hiddenSeq;
}

export function fastForward(hiddenSeq: Subseq, patches: Patch[]): Subseq {
  for (let i = 0; i < patches.length; i++) {
    const { insertSeq, deleteSeq } = factor(patches[i]);
    hiddenSeq = expand(hiddenSeq, insertSeq);
    hiddenSeq = union(hiddenSeq, deleteSeq);
  }
  return hiddenSeq;
}

export function rebase(
  patch: Patch,
  patches: Patch[],
  compare: (i: number) => number,
): [Patch, Patch[]] {
  if (!patches.length) {
    return [patch, patches];
  }
  let { inserted, insertSeq, deleteSeq } = factor(patch);
  patches = patches.map((patch1, i) => {
    let {
      inserted: inserted1,
      insertSeq: insertSeq1,
      deleteSeq: deleteSeq1,
    } = factor(patch1);
    const c = compare(i);
    if (c === 0) {
      throw new Error("TODO: DO THE SLIDE FORWARD THING");
    } else if (c < 0) {
      [insertSeq, insertSeq1] = interleave(insertSeq, insertSeq1);
    } else {
      [insertSeq1, insertSeq] = interleave(insertSeq1, insertSeq);
    }
    deleteSeq = expand(deleteSeq, insertSeq1);
    deleteSeq1 = expand(deleteSeq1, insertSeq);
    // TODO: delete this when we set the snapshot to latest commit
    deleteSeq1 = difference(deleteSeq1, deleteSeq);
    return synthesize({
      inserted: inserted1,
      insertSeq: insertSeq1,
      deleteSeq: deleteSeq1,
    });
  });
  patch = synthesize({ inserted, insertSeq, deleteSeq });
  return [patch, patches];
}

// TODO: Deal with the larger philosophical issue which is that we’re relying on the call order of the callbacks rather than treating predicates as a pure function. Also, rearrange removes patches from the array, so indexes can’t be shared between rearrange and rebase, which are called in succession.
export function slideForward(
  patches: Patch[],
  predicate: (i: number) => boolean,
): Patch[] {
  const patches1: Patch[] = [];
  let expandSeq: Subseq | undefined;
  for (let i = patches.length - 1; i >= 0; i--) {
    let patch = patches[i];
    let { inserted, insertSeq, deleteSeq } = factor(patch);
    if (predicate(i)) {
      if (expandSeq != null) {
        deleteSeq = expand(deleteSeq, expandSeq);
        insertSeq = expand(insertSeq, expandSeq);
        expandSeq = shrink(expandSeq, insertSeq);
        patch = synthesize({ inserted, insertSeq, deleteSeq });
      }
      patches1.unshift(patch);
    } else {
      expandSeq =
        expandSeq == null
          ? insertSeq
          : expand(insertSeq, expandSeq, { union: true });
    }
  }
  return patches1;
}

export function slideBackward(
  patches: Patch[],
  predicate: (i: number) => boolean,
): Patch[] {
  const patches1: Patch[] = [];
  let expandSeq: Subseq | undefined;
  for (let i = 0; i < patches.length; i++) {
    let patch = patches[i];
    let { inserted, insertSeq, deleteSeq } = factor(patch);
    if (predicate(i)) {
      if (expandSeq != null) {
        expandSeq = expand(expandSeq, insertSeq);
        insertSeq = shrink(insertSeq, expandSeq);
        deleteSeq = shrink(deleteSeq, expandSeq);
        patch = synthesize({ inserted, insertSeq, deleteSeq });
      }
      patches1.push(patch);
    } else {
      expandSeq =
        expandSeq == null
          ? insertSeq
          : expand(expandSeq, insertSeq, { union: true });
    }
  }
  return patches1;
}
