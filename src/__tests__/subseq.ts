import * as subseq from "../subseq";

describe("subseq", () => {
  describe("count", () => {
    const s = [0, 10, 5, 8, 4, 4];
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

  describe("union", () => {
    test("empty", () => {
      const s = [1, 4, 4];
      const t = [0, 8];
      expect(subseq.union(s, t)).toEqual(s);
    });

    test("complex", () => {
      const s = [1, 2, 2, 2];
      const t = [0, 1, 2, 2, 1];
      const result = [1, 3, 1, 2];
      expect(subseq.union(s, t)).toEqual(result);
    });
  });

  describe("difference", () => {
    test("empty", () => {
      const s = [1, 8];
      const t = [1, 4, 4];
      const result = [0, 4, 4];
      expect(subseq.difference(s, t)).toEqual(result);
    });

    test("complex", () => {
      const s = [1, 2, 2, 2];
      const t = [0, 1, 1, 1, 1, 1, 1];
      const result = [1, 1, 3, 1, 1];
      expect(subseq.difference(s, t)).toEqual(result);
    });
  });

  describe("expand/shrink", () => {
    test("complex", () => {
      const s = [0, 4, 4, 6, 5, 3];
      const t = [0, 10, 5, 8, 4, 4];
      const expanded = subseq.expand(s, t);
      const result = [0, 4, 4, 11, 4, 4, 1, 3];
      expect(expanded).toEqual(result);
      expect(subseq.shrink(expanded, t)).toEqual(s);
    });
  });

  describe("interleave", () => {
    test("error when mismatched", () => {
      expect(() => {
        subseq.interleave([0, 5, 1], [1, 1, 4]);
      }).toThrow();
    });

    test("error when mismatched 2", () => {
      expect(() => {
        subseq.interleave([0, 12], [0, 11]);
      }).toThrow();
    });

    test("empty subseq 1", () => {
      // =++=======
      const s = [0, 1, 2, 7];
      // ========
      const t = [0, 8];
      // ==========
      const t1 = [0, 10];
      expect(subseq.interleave(s, t)).toEqual([s, t1]);
      expect(subseq.interleave(t, s)).toEqual([t1, s]);
    });

    test("empty subseq 2", () => {
      // =====+======+
      const s = [0, 5, 1, 6, 1];
      // ===========
      const t = [0, 11];
      // =============
      const t1 = [0, 13];
      expect(subseq.interleave(s, t)).toEqual([s, t1]);
      expect(subseq.interleave(t, s)).toEqual([t1, s]);
    });

    test("smaller transform", () => {
      // +++====+
      const s = [1, 3, 4, 1];
      // ***====
      const t = [1, 3, 4];
      // 12345678901
      // +++***====+
      const s1 = [1, 3, 7, 1];
      const t1 = [0, 3, 3, 5];
      expect(subseq.interleave(s, t)).toEqual([s1, t1]);
      // ***+++====+
      const s2 = [0, 3, 3, 4, 1];
      const t2 = [1, 3, 8];
      expect(subseq.interleave(t, s)).toEqual([t2, s2]);
    });

    test("same position", () => {
      // ==++  ====
      const s = [0, 2, 2, 4];
      // ==**  ====
      const t = [0, 2, 2, 4];
      // ==++**====
      const s1 = [0, 2, 2, 6];
      const t1 = [0, 4, 2, 4];
      expect(subseq.interleave(s, t)).toEqual([s1, t1]);
      // ==**++====
      const s2 = [0, 4, 2, 4];
      const t2 = [0, 2, 2, 6];
      expect(subseq.interleave(t, s)).toEqual([t2, s2]);
    });

    test("same position different lengths", () => {
      // ==++++  ==
      const s = [0, 2, 4, 2];
      // ==**    ==
      const t = [0, 2, 2, 2];
      // ==++++**==
      const s1 = [0, 2, 4, 4];
      const t1 = [0, 6, 2, 2];
      expect(subseq.interleave(s, t)).toEqual([s1, t1]);
      // ==**++++==
      const s2 = [0, 4, 4, 2];
      const t2 = [0, 2, 2, 6];
      expect(subseq.interleave(t, s)).toEqual([t2, s2]);
    });

    test("subseq before", () => {
      // +=    ====
      const s = [1, 1, 5];
      //  =****====
      const t = [0, 1, 4, 4];
      // +=****====
      const s1 = [1, 1, 9];
      const t1 = [0, 2, 4, 4];
      expect(subseq.interleave(s, t)).toEqual([s1, t1]);
      // +=****====
      expect(subseq.interleave(t, s)).toEqual([t1, s1]);
    });

    test("subseq before overlapping", () => {
      // ++=    ===
      const s = [1, 2, 4];
      //   =****===
      const t = [0, 1, 4, 3];
      // ++=****===
      const s1 = [1, 2, 8];
      const t1 = [0, 3, 4, 3];
      expect(subseq.interleave(s, t)).toEqual([s1, t1]);
      expect(subseq.interleave(t, s)).toEqual([t1, s1]);
    });

    test("subseq after", () => {
      //  =++++====
      const s = [0, 1, 4, 4];
      // *=    ====
      const t = [1, 1, 5];
      // *=++++====
      const s1 = [0, 2, 4, 4];
      const t1 = [1, 1, 9];
      expect(subseq.interleave(s, t)).toEqual([s1, t1]);
      expect(subseq.interleave(t, s)).toEqual([t1, s1]);
    });

    test("subseq after overlapping 1", () => {
      // ==    ==++
      const s = [0, 4, 2];
      // ==****==
      const t = [0, 2, 4, 2];
      // ==****==++
      const s1 = [0, 8, 2];
      const t1 = [0, 2, 4, 4];
      expect(subseq.interleave(s, t)).toEqual([s1, t1]);
      expect(subseq.interleave(t, s)).toEqual([t1, s1]);
    });

    test("subseq after overlapping 2", () => {
      // =   =++===
      const s = [0, 2, 2, 3];
      // =***=  ===
      const t = [0, 1, 3, 4];
      // =***=++===
      const s1 = [0, 5, 2, 3];
      const t1 = [0, 1, 3, 6];
      expect(subseq.interleave(s, t)).toEqual([s1, t1]);
      expect(subseq.interleave(t, s)).toEqual([t1, s1]);
    });

    test("subseq after overlapping 3", () => {
      //   =++++===
      const s = [0, 1, 4, 3];
      // **=    ===
      const t = [1, 2, 4];
      // **=++++===
      const s1 = [0, 3, 4, 3];
      const t1 = [1, 2, 8];
      expect(subseq.interleave(s, t)).toEqual([s1, t1]);
      expect(subseq.interleave(t, s)).toEqual([t1, s1]);
    });

    test("multiple segments", () => {
      // +=++ =+==
      const s = [1, 1, 1, 2, 1, 1, 2];
      //  =*  = ==*
      const t = [0, 1, 1, 3, 1];
      // +=++*=+==*
      const s1 = [1, 1, 1, 2, 2, 1, 3];
      const t1 = [0, 4, 1, 4, 1];
      expect(subseq.interleave(s, t)).toEqual([s1, t1]);
      // +=*++=+==*
      const s2 = [1, 1, 2, 2, 1, 1, 3];
      const t2 = [0, 2, 1, 6, 1];
      expect(subseq.interleave(t, s)).toEqual([t2, s2]);
    });

    test("complex", () => {
      //     =====      ======++++
      const s = [0, 11, 4];
      // ****=====******======*
      const t = [1, 4, 5, 6, 6, 1];
      // ****=====******======++++*
      const s1 = [0, 21, 4, 1];
      const t1 = [1, 4, 5, 6, 10, 1];
      expect(subseq.interleave(s, t)).toEqual([s1, t1]);
      // ****=====******======*++++
      const s2 = [0, 22, 4];
      const t2 = [1, 4, 5, 6, 6, 1, 4];
      expect(subseq.interleave(t, s)).toEqual([t2, s2]);
    });
  });
});
