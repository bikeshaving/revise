import {Subseq} from "../subseq";

describe("Subseq", () => {
	describe("size", () => {
		const s = new Subseq([10, 5, 8, 4, 4]);
		test("size", () => {
			expect(s.size).toEqual(31);
		});

		test("excludedSize", () => {
			expect(s.excludedSize).toEqual(22);
		});

		test("true", () => {
			expect(s.includedSize).toEqual(9);
		});
	});

	describe("union", () => {
		test("empty", () => {
			const s = new Subseq([0, 4, 4]);
			const t = new Subseq([8]);
			expect(s.union(t)).toEqual(s);
		});

		test("complex", () => {
			const s = new Subseq([0, 2, 2, 2]);
			const t = new Subseq([1, 2, 2, 1]);
			expect(s.union(t)).toEqual(new Subseq([0, 3, 1, 2]));
		});
	});

	describe("intersection", () => {
		test("empty", () => {
			const s = new Subseq([0, 4, 4]);
			const t = new Subseq([8]);
			expect(s.intersection(t)).toEqual(new Subseq([8]));
		});

		test("complex", () => {
			const s = new Subseq([0, 2, 2, 2]);
			const t = new Subseq([1, 2, 2, 1]);
			expect(s.intersection(t)).toEqual(new Subseq([1, 1, 3, 1]));
		});
	});

	describe("difference", () => {
		test("simple", () => {
			const s = new Subseq([0, 8]);
			const t = new Subseq([0, 4, 4]);
			expect(s.difference(t)).toEqual(new Subseq([4, 4]));
		});

		test("complex", () => {
			const s = new Subseq([0, 2, 2, 2]);
			const t = new Subseq([1, 1, 1, 1, 1, 1]);
			expect(s.difference(t)).toEqual(new Subseq([0, 1, 3, 1, 1]));
		});
	});

	describe("expand and shrink", () => {
		const s = new Subseq([4, 4, 6, 5, 3]);
		const t = new Subseq([10, 5, 8, 4, 4]);
		const expanded = new Subseq([4, 4, 11, 4, 4, 1, 3]);
		test("expand complex", () => {
			expect(s.expand(t)).toEqual(expanded);
		});

		test("shrink complex", () => {
			expect(expanded.shrink(t)).toEqual(s);
		});
	});

	describe("expand and align", () => {
		test("simple", () => {
			const s = new Subseq([4, 3]);
			const t = new Subseq([2, 2, 5]);
			const expanded = new Subseq([6, 3]);
			const union = new Subseq([2, 2, 2, 3]);
			expect(s.expand(t)).toEqual(expanded);
			expect(s.expand(t).union(t)).toEqual(union);

			expect(s.expand(t).align(t)).toEqual([
				[2, false, false],
				[2, false, true],
				[2, false, false],
				[3, true, false],
			]);
		});

		test("append", () => {
			const s = new Subseq([0, 6, 5]);
			const t = new Subseq([11, 4]);
			const expanded = new Subseq([0, 6, 9]);
			const union = new Subseq([0, 6, 5, 4]);
			expect(s.expand(t)).toEqual(expanded);
			expect(s.expand(t).union(t)).toEqual(union);
			expect(s.expand(t).align(t)).toEqual([
				[6, true, false],
				[5, false, false],
				[4, false, true],
			]);
		});
	});

	describe("interleave", () => {
		test("error when mismatched 1", () => {
			const s = new Subseq([5, 1]);
			const t = new Subseq([0, 1, 4]);
			expect(() => {
				s.interleave(t);
			}).toThrow();
		});

		test("error when mismatched 2", () => {
			const s = new Subseq([12]);
			const t = new Subseq([11]);
			expect(() => {
				s.interleave(t);
			}).toThrow();
		});

		test("empty 1", () => {
			// =++=======
			const s = new Subseq([1, 2, 7]);
			// ========
			const t = new Subseq([8]);
			// ==========
			const t1 = new Subseq([10]);
			expect(s.interleave(t)).toEqual([s, t1]);
			expect(t.interleave(s)).toEqual([t1, s]);
		});

		test("empty 2", () => {
			// =====+======+
			const s = new Subseq([5, 1, 6, 1]);
			// ===========
			const t = new Subseq([11]);
			// =============
			const t1 = new Subseq([13]);
			expect(s.interleave(t)).toEqual([s, t1]);
			expect(t.interleave(s)).toEqual([t1, s]);
		});

		test("simple 1", () => {
			// +=    ====
			const s = new Subseq([0, 1, 5]);
			//  =****====
			const t = new Subseq([1, 4, 4]);
			// +=****====
			const s1 = new Subseq([0, 1, 9]);
			const t1 = new Subseq([2, 4, 4]);
			expect(s.interleave(t)).toEqual([s1, t1]);
			// +=****====
			expect(t.interleave(s)).toEqual([t1, s1]);
		});

		test("simple 2", () => {
			// ++=    ===
			const s = new Subseq([0, 2, 4]);
			//   =****===
			const t = new Subseq([1, 4, 3]);
			// ++=****===
			const s1 = new Subseq([0, 2, 8]);
			const t1 = new Subseq([3, 4, 3]);
			expect(s.interleave(t)).toEqual([s1, t1]);
			expect(t.interleave(s)).toEqual([t1, s1]);
		});

		test("simple 3", () => {
			//  =++++====
			const s = new Subseq([1, 4, 4]);
			// *=    ====
			const t = new Subseq([0, 1, 5]);
			// *=++++====
			const s1 = new Subseq([2, 4, 4]);
			const t1 = new Subseq([0, 1, 9]);
			expect(s.interleave(t)).toEqual([s1, t1]);
			expect(t.interleave(s)).toEqual([t1, s1]);
		});

		test("simple 4", () => {
			// ==    ==++
			const s = new Subseq([4, 2]);
			// ==****==
			const t = new Subseq([2, 4, 2]);
			// ==****==++
			const s1 = new Subseq([8, 2]);
			const t1 = new Subseq([2, 4, 4]);
			expect(s.interleave(t)).toEqual([s1, t1]);
			expect(t.interleave(s)).toEqual([t1, s1]);
		});

		test("simple 5", () => {
			// =   =++===
			const s = new Subseq([2, 2, 3]);
			// =***=  ===
			const t = new Subseq([1, 3, 4]);
			// =***=++===
			const s1 = new Subseq([5, 2, 3]);
			const t1 = new Subseq([1, 3, 6]);
			expect(s.interleave(t)).toEqual([s1, t1]);
			expect(t.interleave(s)).toEqual([t1, s1]);
		});

		test("simple 6", () => {
			//   =++++===
			const s = new Subseq([1, 4, 3]);
			// **=    ===
			const t = new Subseq([0, 2, 4]);
			// **=++++===
			const s1 = new Subseq([3, 4, 3]);
			const t1 = new Subseq([0, 2, 8]);
			expect(s.interleave(t)).toEqual([s1, t1]);
			expect(t.interleave(s)).toEqual([t1, s1]);
		});

		test("overlapping 1", () => {
			// +++====+
			const s = new Subseq([0, 3, 4, 1]);
			// ***====
			const t = new Subseq([0, 3, 4]);
			// 12345678901
			// +++***====+
			const s1 = new Subseq([0, 3, 7, 1]);
			const t1 = new Subseq([3, 3, 5]);
			expect(s.interleave(t)).toEqual([s1, t1]);
			// ***+++====+
			const s2 = new Subseq([3, 3, 4, 1]);
			const t2 = new Subseq([0, 3, 8]);
			expect(t.interleave(s)).toEqual([t2, s2]);
		});

		test("overlapping 2", () => {
			// ==++  ====
			const s = new Subseq([2, 2, 4]);
			// ==**  ====
			const t = new Subseq([2, 2, 4]);
			// ==++**====
			const s1 = new Subseq([2, 2, 6]);
			const t1 = new Subseq([4, 2, 4]);
			expect(s.interleave(t)).toEqual([s1, t1]);
			// ==**++====
			const s2 = new Subseq([4, 2, 4]);
			const t2 = new Subseq([2, 2, 6]);
			expect(t.interleave(s)).toEqual([t2, s2]);
		});

		test("overlapping 3", () => {
			// ==++++  ==
			const s = new Subseq([2, 4, 2]);
			// ==**    ==
			const t = new Subseq([2, 2, 2]);
			// ==++++**==
			const s1 = new Subseq([2, 4, 4]);
			const t1 = new Subseq([6, 2, 2]);
			expect(s.interleave(t)).toEqual([s1, t1]);
			// ==**++++==
			const s2 = new Subseq([4, 4, 2]);
			const t2 = new Subseq([2, 2, 6]);
			expect(t.interleave(s)).toEqual([t2, s2]);
		});

		test("complex 1", () => {
			// +=++ =+==
			const s = new Subseq([0, 1, 1, 2, 1, 1, 2]);
			//  =*  = ==*
			const t = new Subseq([1, 1, 3, 1]);
			// +=++*=+==*
			const s1 = new Subseq([0, 1, 1, 2, 2, 1, 3]);
			const t1 = new Subseq([4, 1, 4, 1]);
			expect(s.interleave(t)).toEqual([s1, t1]);
			// +=*++=+==*
			const s2 = new Subseq([0, 1, 2, 2, 1, 1, 3]);
			const t2 = new Subseq([2, 1, 6, 1]);
			expect(t.interleave(s)).toEqual([t2, s2]);
		});

		test("complex 2", () => {
			//     =====      ======++++
			const s = new Subseq([11, 4]);
			// ****=====******======*
			const t = new Subseq([0, 4, 5, 6, 6, 1]);
			// ****=====******======++++*
			const s1 = new Subseq([21, 4, 1]);
			const t1 = new Subseq([0, 4, 5, 6, 10, 1]);
			expect(s.interleave(t)).toEqual([s1, t1]);
			// ****=====******======*++++
			const s2 = new Subseq([22, 4]);
			const t2 = new Subseq([0, 4, 5, 6, 6, 1, 4]);
			expect(t.interleave(s)).toEqual([t2, s2]);
		});
	});

	describe("contains", () => {
		// 0123456789012345
		// ====+++==+++====
		test("basic", () => {
			const s = new Subseq([0, 100]);
			expect(s.contains(0)).toEqual(true);
			expect(s.contains(s.size - 1)).toEqual(true);
		});

		test("out of range", () => {
			const s = new Subseq([0, 100]);
			expect(s.contains(-1000)).toEqual(false);
			expect(s.contains(-1)).toEqual(false);
			expect(s.contains(s.size)).toEqual(false);
			expect(s.contains(s.size + 1000)).toEqual(false);
		});

		test("complex", () => {
			const s = new Subseq([4, 3, 2, 3, 4]);
			// @prettier-ignore
			const expected = [
				false,
				false,
				false,
				false,
				true,
				true,
				true,
				false,
				false,
				true,
				true,
				true,
				false,
				false,
				false,
				false,
			];
			for (let i = -1; i < expected.length + 1; i++) {
				expect(s.contains(i)).toEqual(expected[i] || false);
			}
		});
	});
});
