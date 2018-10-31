// length, count
export type Segment = [number, number];

export function lengthOf(subset: Subset, test?: (c: number) => boolean) {
  return subset.reduce(
    (l, [l1, c]) => (test == null || test(c) ? l + l1 : l),
    0,
  );
}

export function pushSegment(
  subset: Subset,
  length: number,
  count: number,
): number {
  if (length <= 0) {
    throw new Error("Can't push empty segment");
  } else if (!subset.length) {
    subset.push([length, count]);
  } else {
    const [length1, count1] = subset[subset.length - 1];
    if (count1 === count) {
      subset[subset.length - 1] = [length1 + length, count];
    } else {
      subset.push([length, count]);
    }
  }
  return subset.length;
}

export type Subset = Segment[];

// length, count1, count2
type ZippedSegment = [number, number, number];

class ZippedSubset implements IterableIterator<ZippedSegment> {
  private i1: number = 0;
  private i2: number = 0;
  private consumed1: number = 0;
  private consumed2: number = 0;
  private consumed: number = 0;
  constructor(private subset1: Subset, private subset2: Subset) {}

  public next(): IteratorResult<ZippedSegment> {
    const segment1 = this.subset1[this.i1];
    const segment2 = this.subset2[this.i2];
    if (segment1 == null || segment2 == null) {
      if (segment1 || segment2) {
        throw new Error("Length mismatch");
      }
      return ({ done: true } as any) as IteratorResult<ZippedSegment>;
    }
    const [length1, count1] = segment1;
    const [length2, count2] = segment2;
    let length: number;
    if (length1 + this.consumed1 === length2 + this.consumed2) {
      this.consumed1 += length1;
      this.consumed2 += length2;
      this.i1 += 1;
      this.i2 += 1;
      length = this.consumed1 - this.consumed;
    } else if (length1 + this.consumed1 < length2 + this.consumed2) {
      this.consumed1 += length1;
      this.i1 += 1;
      length = this.consumed1 - this.consumed;
    } else {
      this.consumed2 += length2;
      this.i2 += 1;
      length = this.consumed2 - this.consumed;
    }
    this.consumed += length;
    return {
      done: false,
      value: [length, count1, count2],
    };
  }

  public [Symbol.iterator]() {
    return this;
  }

  public join(fn: (count1: number, count2: number) => number): Subset {
    const subset: Subset = [];
    for (const [length, count1, count2] of this) {
      pushSegment(subset, length, fn(count1, count2));
    }
    return subset;
  }
}

export function zip(a: Subset, b: Subset): ZippedSubset {
  return new ZippedSubset(a, b);
}

export function complement(subset: Subset): Subset {
  return subset.map(
    ([length, count]) => [length, count === 0 ? 1 : 0] as Segment,
  );
}

export function union(subset1: Subset, subset2: Subset): Subset {
  return zip(subset1, subset2).join((c1, c2) => c1 + c2);
}

export function subtract(subset1: Subset, subset2: Subset): Subset {
  return zip(subset1, subset2).join((c1, c2) => {
    if (c1 < c2) {
      throw new Error("Negative count detected");
    }
    return c1 - c2;
  });
}

export function expand(subset1: Subset, subset2: Subset): Subset {
  const result: Subset = [];
  let segment1: Segment | undefined;
  for (let [length2, count2] of subset2) {
    if (count2) {
      pushSegment(result, length2, 0);
    } else {
      while (length2 > 0) {
        if (segment1 == null || segment1[0] === 0) {
          if (!subset1.length) {
            throw new Error("Length mismatch");
          }
          [segment1, ...subset1] = subset1;
        }
        const [length1, count1] = segment1;
        const consumed = Math.min(length1, length2);
        pushSegment(result, consumed, count1);
        length2 -= consumed;
        segment1 = [length1 - consumed, count1];
      }
    }
  }
  if (subset1.length || segment1 == null || segment1[0] > 0) {
    throw new Error("Length mismatch");
  }
  return result;
}

export function shrink(subset1: Subset, subset2: Subset): Subset {
  const result: Subset = [];
  for (const [length, count1, count2] of zip(subset1, subset2)) {
    if (count2 === 0) {
      pushSegment(result, length, count1);
    }
  }
  return result;
}

export function rebase(
  subset1: Subset,
  subset2: Subset,
  before?: boolean,
): Subset {
  if (lengthOf(subset1, (c) => c === 0) !== lengthOf(subset2, (c) => c === 0)) {
    throw new Error("Length mismatch");
  }
  const result: Subset = [];
  let segment1: Segment | undefined;
  let segment2: Segment | undefined;
  [segment1, ...subset1] = subset1;
  [segment2, ...subset2] = subset2;
  while (segment1 != null || segment2 != null) {
    if (segment1 == null) {
      const [length2, count2] = segment2;
      if (count2) {
        pushSegment(result, length2, 0);
      }
      [segment2, ...subset2] = subset2;
    } else if (segment2 == null) {
      const [length1, count1] = segment1;
      pushSegment(result, length1, count1);
      [segment1, ...subset1] = subset1;
    } else {
      const [length1, count1] = segment1 as Segment;
      const [length2, count2] = segment2 as Segment;
      if (count2) {
        if (before) {
          pushSegment(result, length1, count1);
        }
        pushSegment(result, length2, 0);
        if (!before) {
          pushSegment(result, length1, count1);
        }
        [segment1, ...subset1] = subset1;
        [segment2, ...subset2] = subset2;
      } else if (count1) {
        pushSegment(result, length1, count1);
        [segment1, ...subset1] = subset1;
      } else {
        const length = Math.min(length1, length2);
        pushSegment(result, length, 0);
        if (length1 - length > 0) {
          segment1 = [length1 - length, count1];
        } else {
          [segment1, ...subset1] = subset1;
        }
        if (length2 - length > 0) {
          segment2 = [length2 - length, count2];
        } else {
          [segment2, ...subset2] = subset2;
        }
      }
    }
  }
  return result;
}

export function deleteSubset(text: string, subset: Subset): string {
  let result = "";
  let consumed = 0;
  for (const [length, count] of subset) {
    consumed += length;
    if (!count) {
      result += text.slice(consumed - length, consumed);
    }
  }
  return result;
}
