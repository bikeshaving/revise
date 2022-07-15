import {suite} from "uvu";
import * as Assert from "uvu/assert";

import {Subseq} from "../src/subseq";

const test = suite("Subseq");

test("size", () => {
	const s = new Subseq([10, 5, 8, 4, 4]);
	Assert.is(s.size, 31);
	Assert.is(s.excludedSize, 22);
	Assert.is(s.includedSize, 9);
});

test("union empty", () => {
	const s = new Subseq([0, 4, 4]);
	const t = new Subseq([8]);
	Assert.equal(s.union(t), s);
});

test("union complex", () => {
	const s = new Subseq([0, 2, 2, 2]);
	const t = new Subseq([1, 2, 2, 1]);
	Assert.equal(s.union(t), new Subseq([0, 3, 1, 2]));
});

test("intersection empty", () => {
	const s = new Subseq([0, 4, 4]);
	const t = new Subseq([8]);
	Assert.equal(s.intersection(t), new Subseq([8]));
});

test("intersection complex", () => {
	const s = new Subseq([0, 2, 2, 2]);
	const t = new Subseq([1, 2, 2, 1]);
	Assert.equal(s.intersection(t), new Subseq([1, 1, 3, 1]));
});

test("difference simple", () => {
	const s = new Subseq([0, 8]);
	const t = new Subseq([0, 4, 4]);
	Assert.equal(s.difference(t), new Subseq([4, 4]));
});

test("difference complex", () => {
	const s = new Subseq([0, 2, 2, 2]);
	const t = new Subseq([1, 1, 1, 1, 1, 1]);
	Assert.equal(s.difference(t), new Subseq([0, 1, 3, 1, 1]));
});

test("expand empty", () => {
	const s = new Subseq([8]);
	const t = new Subseq([4, 2, 4, 2]);
	Assert.equal(s.expand(t), new Subseq([12]));
});

test("expand start", () => {
	const s = new Subseq([0, 8]);
	const t = new Subseq([0, 4, 8]);
	Assert.equal(s.expand(t), new Subseq([4, 8]));
});

test("expand middle", () => {
	const s = new Subseq([2, 4, 2]);
	const t = new Subseq([2, 4, 6]);
	Assert.equal(s.expand(t), new Subseq([6, 4, 2]));
});

test("expand end", () => {
	const s = new Subseq([2, 4, 2]);
	const t = new Subseq([6, 4, 2]);
	Assert.equal(s.expand(t), new Subseq([2, 4, 6]));
});

test("expand and shrink", () => {
	const s = new Subseq([4, 4, 6, 5, 3]);
	const t = new Subseq([10, 5, 8, 4, 4]);
	const expanded = new Subseq([4, 4, 11, 4, 4, 1, 3]);
	Assert.equal(s.expand(t), expanded);
	Assert.equal(expanded.shrink(t), s);
});

test("expand and align simple", () => {
	const s = new Subseq([4, 3]);
	const t = new Subseq([2, 2, 5]);
	const expanded = new Subseq([6, 3]);
	const union = new Subseq([2, 2, 2, 3]);
	Assert.equal(s.expand(t), expanded);
	Assert.equal(s.expand(t).union(t), union);

	Assert.equal(s.expand(t).align(t), [
		[2, false, false],
		[2, false, true],
		[2, false, false],
		[3, true, false],
	]);
});

test("expand and align append", () => {
	const s = new Subseq([0, 6, 5]);
	const t = new Subseq([11, 4]);
	const expanded = new Subseq([0, 6, 9]);
	const union = new Subseq([0, 6, 5, 4]);
	Assert.equal(s.expand(t), expanded);
	Assert.equal(s.expand(t).union(t), union);
	Assert.equal(s.expand(t).align(t), [
		[6, true, false],
		[5, false, false],
		[4, false, true],
	]);
});

test("interleave error when mismatched 1", () => {
	const s = new Subseq([5, 1]);
	const t = new Subseq([0, 1, 4]);
	Assert.throws(() => {
		s.interleave(t);
	});
});

test("interleave error when mismatched 2", () => {
	const s = new Subseq([12]);
	const t = new Subseq([11]);
	Assert.throws(() => {
		s.interleave(t);
	});
});

test("interleave empty 1", () => {
	// =++=======
	const s = new Subseq([1, 2, 7]);
	// ========
	const t = new Subseq([8]);
	// ==========
	const t1 = new Subseq([10]);
	Assert.equal(s.interleave(t), [s, t1]);
	Assert.equal(t.interleave(s), [t1, s]);
});

test("interleave empty 2", () => {
	// =====+======+
	const s = new Subseq([5, 1, 6, 1]);
	// ===========
	const t = new Subseq([11]);
	// =============
	const t1 = new Subseq([13]);
	Assert.equal(s.interleave(t), [s, t1]);
	Assert.equal(t.interleave(s), [t1, s]);
});

test("interleave simple 1", () => {
	// +=    ====
	const s = new Subseq([0, 1, 5]);
	//  =****====
	const t = new Subseq([1, 4, 4]);
	// +=****====
	const s1 = new Subseq([0, 1, 9]);
	const t1 = new Subseq([2, 4, 4]);
	Assert.equal(s.interleave(t), [s1, t1]);
	// +=****====
	Assert.equal(t.interleave(s), [t1, s1]);
});

test("interleave simple 2", () => {
	// ++=    ===
	const s = new Subseq([0, 2, 4]);
	//   =****===
	const t = new Subseq([1, 4, 3]);
	// ++=****===
	const s1 = new Subseq([0, 2, 8]);
	const t1 = new Subseq([3, 4, 3]);
	Assert.equal(s.interleave(t), [s1, t1]);
	Assert.equal(t.interleave(s), [t1, s1]);
});

test("interleave simple 3", () => {
	//  =++++====
	const s = new Subseq([1, 4, 4]);
	// *=    ====
	const t = new Subseq([0, 1, 5]);
	// *=++++====
	const s1 = new Subseq([2, 4, 4]);
	const t1 = new Subseq([0, 1, 9]);
	Assert.equal(s.interleave(t), [s1, t1]);
	Assert.equal(t.interleave(s), [t1, s1]);
});

test("interleave simple 4", () => {
	// ==    ==++
	const s = new Subseq([4, 2]);
	// ==****==
	const t = new Subseq([2, 4, 2]);
	// ==****==++
	const s1 = new Subseq([8, 2]);
	const t1 = new Subseq([2, 4, 4]);
	Assert.equal(s.interleave(t), [s1, t1]);
	Assert.equal(t.interleave(s), [t1, s1]);
});

test("interleave simple 5", () => {
	// =   =++===
	const s = new Subseq([2, 2, 3]);
	// =***=  ===
	const t = new Subseq([1, 3, 4]);
	// =***=++===
	const s1 = new Subseq([5, 2, 3]);
	const t1 = new Subseq([1, 3, 6]);
	Assert.equal(s.interleave(t), [s1, t1]);
	Assert.equal(t.interleave(s), [t1, s1]);
});

test("interleave simple 6", () => {
	//   =++++===
	const s = new Subseq([1, 4, 3]);
	// **=    ===
	const t = new Subseq([0, 2, 4]);
	// **=++++===
	const s1 = new Subseq([3, 4, 3]);
	const t1 = new Subseq([0, 2, 8]);
	Assert.equal(s.interleave(t), [s1, t1]);
	Assert.equal(t.interleave(s), [t1, s1]);
});

test("interleave overlapping 1", () => {
	// +++====+
	const s = new Subseq([0, 3, 4, 1]);
	// ***====
	const t = new Subseq([0, 3, 4]);
	// 12345678901
	// +++***====+
	const s1 = new Subseq([0, 3, 7, 1]);
	const t1 = new Subseq([3, 3, 5]);
	Assert.equal(s.interleave(t), [s1, t1]);
	// ***+++====+
	const s2 = new Subseq([3, 3, 4, 1]);
	const t2 = new Subseq([0, 3, 8]);
	Assert.equal(t.interleave(s), [t2, s2]);
});

test("interleave overlapping 2", () => {
	// ==++  ====
	const s = new Subseq([2, 2, 4]);
	// ==**  ====
	const t = new Subseq([2, 2, 4]);
	// ==++**====
	const s1 = new Subseq([2, 2, 6]);
	const t1 = new Subseq([4, 2, 4]);
	Assert.equal(s.interleave(t), [s1, t1]);
	// ==**++====
	const s2 = new Subseq([4, 2, 4]);
	const t2 = new Subseq([2, 2, 6]);
	Assert.equal(t.interleave(s), [t2, s2]);
});

test("interleave overlapping 3", () => {
	// ==++++  ==
	const s = new Subseq([2, 4, 2]);
	// ==**    ==
	const t = new Subseq([2, 2, 2]);
	// ==++++**==
	const s1 = new Subseq([2, 4, 4]);
	const t1 = new Subseq([6, 2, 2]);
	Assert.equal(s.interleave(t), [s1, t1]);
	// ==**++++==
	const s2 = new Subseq([4, 4, 2]);
	const t2 = new Subseq([2, 2, 6]);
	Assert.equal(t.interleave(s), [t2, s2]);
});

test("interleave complex 1", () => {
	// +=++ =+==
	const s = new Subseq([0, 1, 1, 2, 1, 1, 2]);
	//  =*  = ==*
	const t = new Subseq([1, 1, 3, 1]);
	// +=++*=+==*
	const s1 = new Subseq([0, 1, 1, 2, 2, 1, 3]);
	const t1 = new Subseq([4, 1, 4, 1]);
	Assert.equal(s.interleave(t), [s1, t1]);
	// +=*++=+==*
	const s2 = new Subseq([0, 1, 2, 2, 1, 1, 3]);
	const t2 = new Subseq([2, 1, 6, 1]);
	Assert.equal(t.interleave(s), [t2, s2]);
});

test("complex 2", () => {
	//     =====      ======++++
	const s = new Subseq([11, 4]);
	// ****=====******======*
	const t = new Subseq([0, 4, 5, 6, 6, 1]);
	// ****=====******======++++*
	const s1 = new Subseq([21, 4, 1]);
	const t1 = new Subseq([0, 4, 5, 6, 10, 1]);
	Assert.equal(s.interleave(t), [s1, t1]);
	// ****=====******======*++++
	const s2 = new Subseq([22, 4]);
	const t2 = new Subseq([0, 4, 5, 6, 6, 1, 4]);
	Assert.equal(t.interleave(s), [t2, s2]);
});

test("contains basic", () => {
	const s = new Subseq([0, 100]);
	Assert.is(s.contains(0), true);
	Assert.is(s.contains(s.size - 1), true);
});

test("contains out of range", () => {
	const s = new Subseq([0, 100]);
	Assert.is(s.contains(-1000), false);
	Assert.is(s.contains(-1), false);
	Assert.is(s.contains(s.size), false);
	Assert.is(s.contains(s.size + 1000), false);
});

test("contains complex", () => {
	const s = new Subseq([4, 3, 2, 3, 4]);
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
		Assert.equal(s.contains(i), expected[i] || false);
	}
});

test.run();
