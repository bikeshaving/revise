import { complement, lengthOf, pushSegment, Subset, zip } from "./subset";
// inclusive start, exclusive end
export type Copy = [number, number];
export type Insert = string;
export type Delta = (Copy | Insert)[];

export function apply(text: string, delta: Delta): string {
  let result = "";
  for (const el of delta) {
    if (typeof el === "string") {
      result += el;
    } else {
      result += text.slice.apply(text, el);
    }
  }
  return result;
}

export function factor(delta: Delta, length: number): [Subset, Subset, string] {
  const inserts: Subset = [];
  const deletes: Subset = [];
  let inserted = "";
  let end = 0;
  for (const el of delta) {
    if (typeof el === "string") {
      inserted += el;
      pushSegment(inserts, el.length, 1);
    } else {
      pushSegment(inserts, el[1] - end, 0);
      if (el[0] > end) {
        pushSegment(deletes, el[0] - end, 1);
      }
      pushSegment(deletes, el[1] - el[0], 0);
      end = el[1];
    }
  }
  if (length > end) {
    pushSegment(inserts, length - end, 0);
    pushSegment(deletes, length - end, 1);
  }
  return [inserts, deletes, inserted];
}

export function synthesize(
  text: string,
  from: Subset,
  to: Subset = [[lengthOf(from), 0]]): Delta {
  const delta: Delta = [];
  let ri = 0;
  let ti = 0;
  for (const [length, count1, count2] of zip(from, to)) {
    if (count1 === 0) {
      ri += length;
      if (count2 === 0) {
        const range: Copy = [ri - length, ri];
        delta.push(range);
      }
    } else {
      ti += length;
      if (count2 === 0) {
        delta.push(text.slice(ti - length, ti));
      }
    }
  }
  return delta;
}

// Do the variable names make sense? Does this belong here?
export function shuffle(
  from: string,
  to: string,
  inserts: Subset,
  deletes: Subset,
): [string, string] {
  return [
    apply(from, synthesize(to, inserts, deletes)),
    apply(to, synthesize(from, complement(inserts), complement(deletes))),
  ];
}
