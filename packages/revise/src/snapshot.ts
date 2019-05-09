import { factor, Patch } from "./patch";
import { count, expand, merge, shrink, shuffle, Subseq, union } from "./subseq";

export interface Snapshot {
  readonly visible: string;
  readonly hidden: string;
  readonly hiddenSeq: Subseq;
}

export const INITIAL_SNAPSHOT: Snapshot = Object.freeze({
  visible: "",
  hidden: "",
  hiddenSeq: [],
});

export function apply(snapshot: Snapshot, patch: Patch): Snapshot {
  let { visible, hidden, hiddenSeq } = snapshot;
  const { inserted, insertSeq, deleteSeq } = factor(patch);
  if (inserted.length) {
    hiddenSeq = expand(hiddenSeq, insertSeq);
    const insertSeq1 = shrink(insertSeq, hiddenSeq);
    visible = merge(visible, inserted, insertSeq1);
  }
  if (count(deleteSeq, true) > 0) {
    const hiddenSeq1 = union(hiddenSeq, deleteSeq);
    [visible, hidden] = shuffle(visible, hidden, hiddenSeq, hiddenSeq1);
    hiddenSeq = hiddenSeq1;
  }
  return { visible, hidden, hiddenSeq };
}