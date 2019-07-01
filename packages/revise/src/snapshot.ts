import { factor, Patch } from "./patch";
import {
  count,
  difference,
  expand,
  merge,
  push,
  shrink,
  shuffle,
  split,
  Subseq,
  union,
} from "./subseq";

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
  const [inserted, insertSeq, deleteSeq] = factor(patch);
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

export function unapply(snapshot: Snapshot, patch: Patch): Snapshot {
  let { visible, hidden, hiddenSeq } = snapshot;
  let merged = merge(visible, hidden, hiddenSeq);
  const [, insertSeq, deleteSeq] = factor(patch);
  [merged] = split(merged, insertSeq);
  hiddenSeq = shrink(difference(hiddenSeq, deleteSeq), insertSeq);
  [visible, hidden] = split(merged, hiddenSeq);
  return { visible, hidden, hiddenSeq };
}

export function parse(str: string): Snapshot {
  const segments = str.split("|");
  const snapshot = {
    visible: "",
    hidden: "",
    hiddenSeq: [],
  };
  let flag = false;
  for (const seg of segments) {
    if (flag) {
      snapshot.visible += seg;
    } else {
      snapshot.hidden += seg;
    }
    push(snapshot.hiddenSeq, seg.length, !flag);
    flag = !flag;
  }
  return snapshot;
}
