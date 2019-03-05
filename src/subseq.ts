// [flag, ...lengths[]]
// TODO: make subseq [boolean, ...number[]]?
export type Subseq = number[];

export function flagAt(subseq: Subseq, index: number): boolean | undefined {
  if (subseq.length < 2) {
    return;
  } else if (index <= 0 || index > subseq.length - 1) {
    throw new RangeError("index out of range of subseq");
  }
  return !subseq[0] === (index % 2 === 0);
}

export function push(subseq: Subseq, length: number, flag: boolean): number {
  if (length <= 0) {
    throw new Error("Cannot push empty segment");
  } else if (!subseq.length) {
    subseq.push(flag ? 1 : 0, length);
  } else {
    const flag1 = flagAt(subseq, subseq.length - 1)!;
    if (flag === flag1) {
      subseq[subseq.length - 1] += length;
    } else {
      subseq.push(length);
    }
  }
  return subseq.length;
}

export function concat(subseq1: Subseq, subseq2: Subseq): Subseq {
  if (subseq2.length < 2) {
    return subseq1;
  } else if (subseq1.length < 2) {
    return subseq2;
  }
  const flag1 = flagAt(subseq1, subseq1.length - 1)!;
  const flag2 = flagAt(subseq2, 1)!;
  const length = subseq2[1];
  if (length && flag1 === flag2) {
    subseq1 = subseq1.slice();
    push(subseq1, length, flag1);
  }
  return subseq1.concat(subseq2.slice(2));
}

// [length, ...flags[]]
export type Segment = [number, ...boolean[]];

export class SegmentIterator implements IterableIterator<Segment> {
  private i = 1;

  constructor(private subseq: Subseq) {
    if (subseq.length === 1) {
      throw new Error("Malformed subseq");
    }
  }

  next(): IteratorResult<Segment> {
    const length = this.subseq[this.i];
    if (length == null) {
      return { done: true } as any;
    }
    const flag = flagAt(this.subseq, this.i)!;
    this.i++;
    return { done: false, value: [length, flag] };
  }

  [Symbol.iterator]() {
    return this;
  }
}

export function print(subseq: Subseq): string {
  let result = "";
  for (const [length, flag] of new SegmentIterator(subseq)) {
    result += flag ? "+".repeat(length) : "=".repeat(length);
  }
  return result;
}

export function count(subseq: Subseq, test?: boolean): number {
  let result = 0;
  for (const [length, flag] of new SegmentIterator(subseq)) {
    if (test == null || test === flag) {
      result += length;
    }
  }
  return result;
}

export function empty(length: number): Subseq {
  const result: Subseq = [];
  if (length) {
    push(result, length, false);
  }
  return result;
}

export function clear(subseq: Subseq): Subseq {
  return empty(count(subseq));
}

export function full(length: number): Subseq {
  const result: Subseq = [];
  if (length) {
    push(result, length, true);
  }
  return result;
}

export function fill(subseq: Subseq): Subseq {
  return full(count(subseq));
}

export function complement(subseq: Subseq): Subseq {
  if (!subseq.length) {
    return subseq;
  }
  return [subseq[0] ? 0 : 1].concat(subseq.slice(1));
}

export class ZippedSegmentIterator implements IterableIterator<Segment> {
  private iter1: SegmentIterator;
  private iter2: SegmentIterator;
  private it1: IteratorResult<Segment>;
  private it2: IteratorResult<Segment>;
  constructor(subseq1: Subseq, subseq2: Subseq) {
    this.iter1 = new SegmentIterator(subseq1);
    this.iter2 = new SegmentIterator(subseq2);
    this.it1 = this.iter1.next();
    this.it2 = this.iter2.next();
  }

  next(): IteratorResult<Segment> {
    if (this.it1.done || this.it2.done) {
      if (!this.it1.done || !this.it2.done) {
        throw new Error("Length mismatch");
      }
      return { done: true } as any;
    }
    const [length1, flag1] = this.it1.value;
    const [length2, flag2] = this.it2.value;
    const length = Math.min(length1, length2);
    if (length1 - length > 0) {
      this.it1.value[0] -= length;
    } else {
      this.it1 = this.iter1.next();
    }
    if (length2 - length > 0) {
      this.it2.value[0] -= length;
    } else {
      this.it2 = this.iter2.next();
    }
    return {
      done: false,
      value: [length, flag1, flag2],
    };
  }

  [Symbol.iterator]() {
    return this;
  }

  join(fn: (flag1: boolean, flag2: boolean) => boolean): Subseq {
    const subseq: Subseq = [];
    for (const [length, flag1, flag2] of this) {
      push(subseq, length, fn(flag1, flag2));
    }
    return subseq;
  }
}

export function zip(subseq1: Subseq, subseq2: Subseq): ZippedSegmentIterator {
  return new ZippedSegmentIterator(subseq1, subseq2);
}

export function union(subseq1: Subseq, subseq2: Subseq): Subseq {
  return zip(subseq1, subseq2).join((flag1, flag2) => flag1 || flag2);
}

export function intersection(subseq1: Subseq, subseq2: Subseq): Subseq {
  return zip(subseq1, subseq2).join((flag1, flag2) => flag1 && flag2);
}

export function difference(subseq1: Subseq, subseq2: Subseq): Subseq {
  return zip(subseq1, subseq2).join((flag1, flag2) => flag1 && !flag2);
}

export function expand(
  subseq1: Subseq,
  subseq2: Subseq,
  options: { union?: boolean } = {},
): Subseq {
  const result: Subseq = [];
  let length1: number | undefined;
  let flag1: boolean;
  const iter = new SegmentIterator(subseq1);
  for (let [length2, flag2] of new SegmentIterator(subseq2)) {
    if (flag2) {
      push(result, length2, !!options.union);
    } else {
      while (length2 > 0) {
        if (length1 == null || length1 === 0) {
          const it = iter.next();
          if (it.done) {
            throw new Error("Length mismatch");
          }
          [length1, flag1] = it.value;
        }
        const length = Math.min(length1, length2);
        push(result, length, flag1!);
        length1 -= length;
        length2 -= length;
      }
    }
  }
  if (!iter.next().done || (length1 != null && length1 > 0)) {
    throw new Error("Length mismatch");
  }
  return result;
}

export function shrink(subseq1: Subseq, subseq2: Subseq): Subseq {
  const result: Subseq = [];
  for (const [length, flag1, flag2] of zip(subseq1, subseq2)) {
    if (!flag2) {
      push(result, length, flag1);
    }
  }
  return result;
}

export function interleave(subseq1: Subseq, subseq2: Subseq): [Subseq, Subseq] {
  const iter1 = new SegmentIterator(subseq1);
  const iter2 = new SegmentIterator(subseq2);
  let it1 = iter1.next();
  let it2 = iter2.next();
  const result1: Subseq = [];
  const result2: Subseq = [];

  while (!it1.done && !it2.done) {
    const [length1, flag1] = it1.value;
    const [length2, flag2] = it2.value;
    if (flag1 && flag2) {
      push(result1, length1, true);
      push(result1, length2, false);
      push(result2, length1, false);
      push(result2, length2, true);
      it1 = iter1.next();
      it2 = iter2.next();
    } else if (flag1) {
      push(result1, length1, true);
      push(result2, length1, false);
      it1 = iter1.next();
    } else if (flag2) {
      push(result1, length2, false);
      push(result2, length2, true);
      it2 = iter2.next();
    } else {
      const length = Math.min(length1, length2);
      push(result1, length, false);
      push(result2, length, false);
      if (length1 - length > 0) {
        it1.value[0] = length1 - length;
      } else {
        it1 = iter1.next();
      }
      if (length2 - length > 0) {
        it2.value[0] = length2 - length;
      } else {
        it2 = iter2.next();
      }
    }
  }

  if (!it1.done) {
    const [length1, flag1] = it1.value;
    if (!flag1 || !iter1.next().done) {
      throw new Error("Length mismatch");
    }
    push(result1, length1, true);
    push(result2, length1, false);
  }

  if (!it2.done) {
    const [length2, flag2] = it2.value;
    if (!flag2 || !iter2.next().done) {
      throw new Error("Length mismatch");
    }
    push(result1, length2, false);
    push(result2, length2, true);
  }

  return [result1, result2];
}

export function split(text: string, subseq: Subseq): [string, string] {
  let consumed = 0;
  let result1 = "";
  let result2 = "";
  for (const [length, flag] of new SegmentIterator(subseq)) {
    if (flag) {
      result1 += text.slice(consumed, consumed + length);
    } else {
      result2 += text.slice(consumed, consumed + length);
    }
    consumed += length;
  }
  return [result1, result2];
}

export function merge(text1: string, text2: string, subseq: Subseq): string {
  let result = "";
  let consumed1 = 0;
  let consumed2 = 0;
  for (const [length, flag] of new SegmentIterator(subseq)) {
    if (flag) {
      result += text1.slice(consumed1, consumed1 + length);
      consumed1 += length;
    } else {
      result += text2.slice(consumed2, consumed2 + length);
      consumed2 += length;
    }
  }
  return result;
}

export function shuffle(
  text1: string,
  text2: string,
  subseq1: Subseq,
  subseq2: Subseq,
): [string, string] {
  return split(merge(text1, text2, subseq1), subseq2);
}
