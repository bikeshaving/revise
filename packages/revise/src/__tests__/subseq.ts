import * as subseq from "../subseq";

describe("subseq", () => {
  describe("count", () => {
    const s = [10, 5, 8, 4, 4];
    test("all", () => {
      expect(subseq.count(s)).toEqual(31);
    });
    test("false", () => {
      expect(subseq.count(s, false)).toEqual(22);
    });
    test("true", () => {
      expect(subseq.count(s, true)).toEqual(9);
    });
  });

  describe("concat", () => {
    test("continuing", () => {
      const s = [1, 2, 3, 4, 5];
      const t = [0, 6, 7, 8];
      const result = [1, 2, 3, 4, 5, 6, 7, 8];
      expect(subseq.concat(s, t)).toEqual(result);
    });

    test("alternating", () => {
      const s = [1, 2, 3, 4, 3];
      const t = [2, 6, 7, 8];
      const result = [1, 2, 3, 4, 5, 6, 7, 8];
      expect(subseq.concat(s, t)).toEqual(result);
    });
  });

  describe("union", () => {
    test("empty", () => {
      const s = [0, 4, 4];
      const t = [8];
      expect(subseq.union(s, t)).toEqual(s);
    });

    test("complex", () => {
      const s = [0, 2, 2, 2];
      const t = [1, 2, 2, 1];
      const result = [0, 3, 1, 2];
      expect(subseq.union(s, t)).toEqual(result);
    });
  });

  describe("difference", () => {
    test("empty", () => {
      const s = [0, 8];
      const t = [0, 4, 4];
      const result = [4, 4];
      expect(subseq.difference(s, t)).toEqual(result);
    });

    test("complex", () => {
      const s = [0, 2, 2, 2];
      const t = [1, 1, 1, 1, 1, 1];
      const result = [0, 1, 3, 1, 1];
      expect(subseq.difference(s, t)).toEqual(result);
    });
  });

  describe("expand/shrink", () => {
    test("complex", () => {
      const s = [4, 4, 6, 5, 3];
      const t = [10, 5, 8, 4, 4];
      const expanded = subseq.expand(s, t);
      const result = [4, 4, 11, 4, 4, 1, 3];
      expect(expanded).toEqual(result);
      expect(subseq.shrink(expanded, t)).toEqual(s);
      expect(subseq.expand(subseq.shrink(expanded, t), t)).toEqual(expanded);
    });
  });

  describe("interleave", () => {
    test("error when mismatched 1", () => {
      expect(() => {
        subseq.interleave([5, 1], [0, 1, 4]);
      }).toThrow();
    });

    test("error when mismatched 2", () => {
      expect(() => {
        subseq.interleave([12], [11]);
      }).toThrow();
    });

    test("empty 1", () => {
      // =++=======
      const s = [1, 2, 7];
      // ========
      const t = [8];
      // ==========
      const t1 = [10];
      expect(subseq.interleave(s, t)).toEqual([s, t1]);
      expect(subseq.interleave(t, s)).toEqual([t1, s]);
    });

    test("empty 2", () => {
      // =====+======+
      const s = [5, 1, 6, 1];
      // ===========
      const t = [11];
      // =============
      const t1 = [13];
      expect(subseq.interleave(s, t)).toEqual([s, t1]);
      expect(subseq.interleave(t, s)).toEqual([t1, s]);
    });

    test("simple 1", () => {
      // +=    ====
      const s = [0, 1, 5];
      //  =****====
      const t = [1, 4, 4];
      // +=****====
      const s1 = [0, 1, 9];
      const t1 = [2, 4, 4];
      expect(subseq.interleave(s, t)).toEqual([s1, t1]);
      // +=****====
      expect(subseq.interleave(t, s)).toEqual([t1, s1]);
    });

    test("simple 2", () => {
      // ++=    ===
      const s = [0, 2, 4];
      //   =****===
      const t = [1, 4, 3];
      // ++=****===
      const s1 = [0, 2, 8];
      const t1 = [3, 4, 3];
      expect(subseq.interleave(s, t)).toEqual([s1, t1]);
      expect(subseq.interleave(t, s)).toEqual([t1, s1]);
    });

    test("simple 3", () => {
      //  =++++====
      const s = [1, 4, 4];
      // *=    ====
      const t = [0, 1, 5];
      // *=++++====
      const s1 = [2, 4, 4];
      const t1 = [0, 1, 9];
      expect(subseq.interleave(s, t)).toEqual([s1, t1]);
      expect(subseq.interleave(t, s)).toEqual([t1, s1]);
    });

    test("simple 4", () => {
      // ==    ==++
      const s = [4, 2];
      // ==****==
      const t = [2, 4, 2];
      // ==****==++
      const s1 = [8, 2];
      const t1 = [2, 4, 4];
      expect(subseq.interleave(s, t)).toEqual([s1, t1]);
      expect(subseq.interleave(t, s)).toEqual([t1, s1]);
    });

    test("simple 5", () => {
      // =   =++===
      const s = [2, 2, 3];
      // =***=  ===
      const t = [1, 3, 4];
      // =***=++===
      const s1 = [5, 2, 3];
      const t1 = [1, 3, 6];
      expect(subseq.interleave(s, t)).toEqual([s1, t1]);
      expect(subseq.interleave(t, s)).toEqual([t1, s1]);
    });

    test("simple 6", () => {
      //   =++++===
      const s = [1, 4, 3];
      // **=    ===
      const t = [0, 2, 4];
      // **=++++===
      const s1 = [3, 4, 3];
      const t1 = [0, 2, 8];
      expect(subseq.interleave(s, t)).toEqual([s1, t1]);
      expect(subseq.interleave(t, s)).toEqual([t1, s1]);
    });

    test("overlapping 1", () => {
      // +++====+
      const s = [0, 3, 4, 1];
      // ***====
      const t = [0, 3, 4];
      // 12345678901
      // +++***====+
      const s1 = [0, 3, 7, 1];
      const t1 = [3, 3, 5];
      expect(subseq.interleave(s, t)).toEqual([s1, t1]);
      // ***+++====+
      const s2 = [3, 3, 4, 1];
      const t2 = [0, 3, 8];
      expect(subseq.interleave(t, s)).toEqual([t2, s2]);
    });

    test("overlapping 2", () => {
      // ==++  ====
      const s = [2, 2, 4];
      // ==**  ====
      const t = [2, 2, 4];
      // ==++**====
      const s1 = [2, 2, 6];
      const t1 = [4, 2, 4];
      expect(subseq.interleave(s, t)).toEqual([s1, t1]);
      // ==**++====
      const s2 = [4, 2, 4];
      const t2 = [2, 2, 6];
      expect(subseq.interleave(t, s)).toEqual([t2, s2]);
    });

    test("overlapping 3", () => {
      // ==++++  ==
      const s = [2, 4, 2];
      // ==**    ==
      const t = [2, 2, 2];
      // ==++++**==
      const s1 = [2, 4, 4];
      const t1 = [6, 2, 2];
      expect(subseq.interleave(s, t)).toEqual([s1, t1]);
      // ==**++++==
      const s2 = [4, 4, 2];
      const t2 = [2, 2, 6];
      expect(subseq.interleave(t, s)).toEqual([t2, s2]);
    });

    test("complex 1", () => {
      // +=++ =+==
      const s = [0, 1, 1, 2, 1, 1, 2];
      //  =*  = ==*
      const t = [1, 1, 3, 1];
      // +=++*=+==*
      const s1 = [0, 1, 1, 2, 2, 1, 3];
      const t1 = [4, 1, 4, 1];
      expect(subseq.interleave(s, t)).toEqual([s1, t1]);
      // +=*++=+==*
      const s2 = [0, 1, 2, 2, 1, 1, 3];
      const t2 = [2, 1, 6, 1];
      expect(subseq.interleave(t, s)).toEqual([t2, s2]);
    });

    test("complex 2", () => {
      //     =====      ======++++
      const s = [11, 4];
      // ****=====******======*
      const t = [0, 4, 5, 6, 6, 1];
      // ****=====******======++++*
      const s1 = [21, 4, 1];
      const t1 = [0, 4, 5, 6, 10, 1];
      expect(subseq.interleave(s, t)).toEqual([s1, t1]);
      // ****=====******======*++++
      const s2 = [22, 4];
      const t2 = [0, 4, 5, 6, 6, 1, 4];
      expect(subseq.interleave(t, s)).toEqual([t2, s2]);
    });
  });

  describe("contains", () => {
    test("out of range", () => {
      const s = [4, 3, 2, 3, 4];
      expect(() => subseq.contains(s, -1)).toThrow(RangeError);
      expect(() => subseq.contains(s, -1000)).toThrow(RangeError);
    });

    test("false first", () => {
      // 0123456789012345
      // ====+++==+++====
      const s = [4, 3, 2, 3, 4];
      let i = 0;
      for (const [length, flag] of subseq.segments(s)) {
        const end = i + length;
        for (; i < end; i++) {
          expect(subseq.contains(s, i)).toEqual(flag);
        }
      }
    });

    test("true first", () => {
      // 0123456789012345
      // ++++===++===++++
      const s = [0, 4, 3, 2, 3, 4];
      let i = 0;
      for (const [length, flag] of subseq.segments(s)) {
        const end = i + length;
        for (; i < end; i++) {
          expect(subseq.contains(s, i)).toEqual(flag);
        }
      }
    });
  });

  describe("advance", () => {
    test("out of range", () => {
      const s = [4, 3, 2, 3, 4];
      expect(() => subseq.advance(-1, s)).toThrow(RangeError);
      expect(() => subseq.advance(-1000, s)).toThrow(RangeError);
    });

    test("false first", () => {
      // 0123   45   6789
      // 0123456789012345
      // ====+++==+++====
      const s = [4, 3, 2, 3, 4];
      expect(subseq.advance(0, s)).toBe(0);
      expect(subseq.advance(1, s)).toBe(1);
      expect(subseq.advance(2, s)).toBe(2);
      expect(subseq.advance(3, s)).toBe(3);
      expect(subseq.advance(4, s)).toBe(7);
      expect(subseq.advance(5, s)).toBe(8);
      expect(subseq.advance(6, s)).toBe(12);
      expect(subseq.advance(7, s)).toBe(13);
      expect(subseq.advance(8, s)).toBe(14);
      expect(subseq.advance(9, s)).toBe(15);
      expect(subseq.advance(10, s)).toBe(16);
      expect(subseq.advance(11, s)).toBe(17);
      expect(subseq.advance(12, s)).toBe(18);
    });

    test("true first", () => {
      //     012  345
      // 0123456789012345
      // ++++===++===++++
      const s = [0, 4, 3, 2, 3, 4];
      expect(subseq.advance(0, s)).toBe(4);
      expect(subseq.advance(1, s)).toBe(5);
      expect(subseq.advance(2, s)).toBe(6);
      expect(subseq.advance(3, s)).toBe(9);
      expect(subseq.advance(4, s)).toBe(10);
      expect(subseq.advance(5, s)).toBe(11);
      expect(subseq.advance(6, s)).toBe(16);
      expect(subseq.advance(7, s)).toBe(17);
      expect(subseq.advance(8, s)).toBe(18);
    });
  });

  describe("retreat", () => {
    test("out of range", () => {
      const s = [4, 3, 2, 3, 4];
      expect(() => subseq.retreat(-1, s)).toThrow(RangeError);
      expect(() => subseq.retreat(-1000, s)).toThrow(RangeError);
    });
    test("false first", () => {
      // 0123456789012345
      // 0123444456666789
      // ====+++==+++====
      const s = [4, 3, 2, 3, 4];
      expect(subseq.retreat(0, s)).toBe(0);
      expect(subseq.retreat(1, s)).toBe(1);
      expect(subseq.retreat(2, s)).toBe(2);
      expect(subseq.retreat(3, s)).toBe(3);

      expect(subseq.retreat(4, s)).toBe(4);
      expect(subseq.retreat(5, s)).toBe(4);
      expect(subseq.retreat(6, s)).toBe(4);

      expect(subseq.retreat(7, s)).toBe(4);
      expect(subseq.retreat(8, s)).toBe(5);

      expect(subseq.retreat(9, s)).toBe(6);
      expect(subseq.retreat(10, s)).toBe(6);
      expect(subseq.retreat(11, s)).toBe(6);

      expect(subseq.retreat(12, s)).toBe(6);
      expect(subseq.retreat(13, s)).toBe(7);
      expect(subseq.retreat(14, s)).toBe(8);
      expect(subseq.retreat(15, s)).toBe(9);
      expect(subseq.retreat(16, s)).toBe(10);
      expect(subseq.retreat(17, s)).toBe(11);
      expect(subseq.retreat(18, s)).toBe(12);
    });

    test("true first", () => {
      // 0123456789012345
      // 0000012333455555
      // ++++===++===++++
      const s = [0, 4, 3, 2, 3, 4];

      expect(subseq.retreat(0, s)).toBe(0);
      expect(subseq.retreat(1, s)).toBe(0);
      expect(subseq.retreat(2, s)).toBe(0);
      expect(subseq.retreat(3, s)).toBe(0);

      expect(subseq.retreat(4, s)).toBe(0);
      expect(subseq.retreat(5, s)).toBe(1);
      expect(subseq.retreat(6, s)).toBe(2);

      expect(subseq.retreat(7, s)).toBe(3);
      expect(subseq.retreat(8, s)).toBe(3);

      expect(subseq.retreat(9, s)).toBe(3);
      expect(subseq.retreat(10, s)).toBe(4);
      expect(subseq.retreat(11, s)).toBe(5);

      expect(subseq.retreat(12, s)).toBe(6);
      expect(subseq.retreat(13, s)).toBe(6);
      expect(subseq.retreat(14, s)).toBe(6);
      expect(subseq.retreat(15, s)).toBe(6);

      expect(subseq.retreat(16, s)).toBe(6);
      expect(subseq.retreat(17, s)).toBe(7);
      expect(subseq.retreat(18, s)).toBe(8);
    });
  });
});
