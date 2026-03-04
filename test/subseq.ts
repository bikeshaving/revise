import {suite} from "uvu";
import * as Assert from "uvu/assert";

import * as Subseq from "../src/subseq.js";
const test = suite("Subseq");

test("measure", () => {
	const s = [10, 5, 8, 4, 4];
	Assert.equal(Subseq.measure(s), {
		length: 31,
		excludedLength: 22,
		includedLength: 9,
	});
});

test("union empty", () => {
	const s = [0, 4, 4];
	const t = [8];
	Assert.equal(Subseq.union(s, t), s);
});

test("union complex", () => {
	const s = [0, 2, 2, 2];
	const t = [1, 2, 2, 1];
	Assert.equal(Subseq.union(s, t), [0, 3, 1, 2]);
});

test("intersection empty", () => {
	const s = [0, 4, 4];
	const t = [8];
	Assert.equal(Subseq.intersection(s, t), [8]);
});

test("intersection complex", () => {
	const s = [0, 2, 2, 2];
	const t = [1, 2, 2, 1];
	Assert.equal(Subseq.intersection(s, t), [1, 1, 3, 1]);
});

test("difference simple", () => {
	const s = [0, 8];
	const t = [0, 4, 4];
	Assert.equal(Subseq.difference(s, t), [4, 4]);
});

test("difference complex", () => {
	const s = [0, 2, 2, 2];
	const t = [1, 1, 1, 1, 1, 1];
	Assert.equal(Subseq.difference(s, t), [0, 1, 3, 1, 1]);
});

test("expand empty", () => {
	const s = [8];
	const t = [4, 2, 4, 2];
	Assert.equal(Subseq.expand(s, t), [12]);
});

test("expand start", () => {
	const s = [0, 8];
	const t = [0, 4, 8];
	Assert.equal(Subseq.expand(s, t), [4, 8]);
});

test("expand middle", () => {
	const s = [2, 4, 2];
	const t = [2, 4, 6];
	Assert.equal(Subseq.expand(s, t), [6, 4, 2]);
});

test("expand end", () => {
	const s = [2, 4, 2];
	const t = [6, 4, 2];
	Assert.equal(Subseq.expand(s, t), [2, 4, 6]);
});

test("expand and shrink", () => {
	const s = [4, 4, 6, 5, 3];
	const t = [10, 5, 8, 4, 4];
	const expanded = [4, 4, 11, 4, 4, 1, 3];
	Assert.equal(Subseq.expand(s, t), expanded);
	Assert.equal(Subseq.shrink(expanded, t), s);
});

test("expand and align simple", () => {
	const s = [4, 3];
	const t = [2, 2, 5];
	const expanded = [6, 3];
	const union = [2, 2, 2, 3];
	Assert.equal(Subseq.expand(s, t), expanded);
	Assert.equal(Subseq.union(Subseq.expand(s, t), t), union);

	Assert.equal(Subseq.align(Subseq.expand(s, t), t), [
		[2, false, false],
		[2, false, true],
		[2, false, false],
		[3, true, false],
	]);
});

test("expand and align append", () => {
	const s = [0, 6, 5];
	const t = [11, 4];
	const expanded = [0, 6, 9];
	const union = [0, 6, 5, 4];
	Assert.equal(Subseq.expand(s, t), expanded);
	Assert.equal(Subseq.union(Subseq.expand(s, t), t), union);
	Assert.equal(Subseq.align(Subseq.expand(s, t), t), [
		[6, true, false],
		[5, false, false],
		[4, false, true],
	]);
});

test("interleave error when mismatched 1", () => {
	const s = [5, 1];
	const t = [0, 1, 4];
	Assert.throws(() => {
		Subseq.interleave(s, t);
	});
});

test("interleave error when mismatched 2", () => {
	const s = [12];
	const t = [11];
	Assert.throws(() => {
		Subseq.interleave(s, t);
	});
});

test("interleave empty 1", () => {
	// =++=======
	const s = [1, 2, 7];
	// ========
	const t = [8];
	// ==========
	const t1 = [10];
	Assert.equal(Subseq.interleave(s, t), [s, t1]);
	Assert.equal(Subseq.interleave(t, s), [t1, s]);
});

test("interleave empty 2", () => {
	// =====+======+
	const s = [5, 1, 6, 1];
	// ===========
	const t = [11];
	// =============
	const t1 = [13];
	Assert.equal(Subseq.interleave(s, t), [s, t1]);
	Assert.equal(Subseq.interleave(t, s), [t1, s]);
});

test("interleave simple 1", () => {
	// +=    ====
	const s = [0, 1, 5];
	//  =****====
	const t = [1, 4, 4];
	// +=****====
	const s1 = [0, 1, 9];
	const t1 = [2, 4, 4];
	Assert.equal(Subseq.interleave(s, t), [s1, t1]);
	// +=****====
	Assert.equal(Subseq.interleave(t, s), [t1, s1]);
});

test("interleave simple 2", () => {
	// ++=    ===
	const s = [0, 2, 4];
	//   =****===
	const t = [1, 4, 3];
	// ++=****===
	const s1 = [0, 2, 8];
	const t1 = [3, 4, 3];
	Assert.equal(Subseq.interleave(s, t), [s1, t1]);
	Assert.equal(Subseq.interleave(t, s), [t1, s1]);
});

test("interleave simple 3", () => {
	//  =++++====
	const s = [1, 4, 4];
	// *=    ====
	const t = [0, 1, 5];
	// *=++++====
	const s1 = [2, 4, 4];
	const t1 = [0, 1, 9];
	Assert.equal(Subseq.interleave(s, t), [s1, t1]);
	Assert.equal(Subseq.interleave(t, s), [t1, s1]);
});

test("interleave simple 4", () => {
	// ==    ==++
	const s = [4, 2];
	// ==****==
	const t = [2, 4, 2];
	// ==****==++
	const s1 = [8, 2];
	const t1 = [2, 4, 4];
	Assert.equal(Subseq.interleave(s, t), [s1, t1]);
	Assert.equal(Subseq.interleave(t, s), [t1, s1]);
});

test("interleave simple 5", () => {
	// =   =++===
	const s = [2, 2, 3];
	// =***=  ===
	const t = [1, 3, 4];
	// =***=++===
	const s1 = [5, 2, 3];
	const t1 = [1, 3, 6];
	Assert.equal(Subseq.interleave(s, t), [s1, t1]);
	Assert.equal(Subseq.interleave(t, s), [t1, s1]);
});

test("interleave simple 6", () => {
	//   =++++===
	const s = [1, 4, 3];
	// **=    ===
	const t = [0, 2, 4];
	// **=++++===
	const s1 = [3, 4, 3];
	const t1 = [0, 2, 8];
	Assert.equal(Subseq.interleave(s, t), [s1, t1]);
	Assert.equal(Subseq.interleave(t, s), [t1, s1]);
});

test("interleave overlapping 1", () => {
	// +++====+
	const s = [0, 3, 4, 1];
	// ***====
	const t = [0, 3, 4];
	// 12345678901
	// +++***====+
	const s1 = [0, 3, 7, 1];
	const t1 = [3, 3, 5];
	Assert.equal(Subseq.interleave(s, t), [s1, t1]);
	// ***+++====+
	const s2 = [3, 3, 4, 1];
	const t2 = [0, 3, 8];
	Assert.equal(Subseq.interleave(t, s), [t2, s2]);
});

test("interleave overlapping 2", () => {
	// ==++  ====
	const s = [2, 2, 4];
	// ==**  ====
	const t = [2, 2, 4];
	// ==++**====
	const s1 = [2, 2, 6];
	const t1 = [4, 2, 4];
	Assert.equal(Subseq.interleave(s, t), [s1, t1]);
	// ==**++====
	const s2 = [4, 2, 4];
	const t2 = [2, 2, 6];
	Assert.equal(Subseq.interleave(t, s), [t2, s2]);
});

test("interleave overlapping 3", () => {
	// ==++++  ==
	const s = [2, 4, 2];
	// ==**    ==
	const t = [2, 2, 2];
	// ==++++**==
	const s1 = [2, 4, 4];
	const t1 = [6, 2, 2];
	Assert.equal(Subseq.interleave(s, t), [s1, t1]);
	// ==**++++==
	const s2 = [4, 4, 2];
	const t2 = [2, 2, 6];
	Assert.equal(Subseq.interleave(t, s), [t2, s2]);
});

test("interleave complex 1", () => {
	// +=++ =+==
	const s = [0, 1, 1, 2, 1, 1, 2];
	//  =*  = ==*
	const t = [1, 1, 3, 1];
	// +=++*=+==*
	const s1 = [0, 1, 1, 2, 2, 1, 3];
	const t1 = [4, 1, 4, 1];
	Assert.equal(Subseq.interleave(s, t), [s1, t1]);
	// +=*++=+==*
	const s2 = [0, 1, 2, 2, 1, 1, 3];
	const t2 = [2, 1, 6, 1];
	Assert.equal(Subseq.interleave(t, s), [t2, s2]);
});

test("complex 2", () => {
	//     =====      ======++++
	const s = [11, 4];
	// ****=====******======*
	const t = [0, 4, 5, 6, 6, 1];
	// ****=====******======++++*
	const s1 = [21, 4, 1];
	const t1 = [0, 4, 5, 6, 10, 1];
	Assert.equal(Subseq.interleave(s, t), [s1, t1]);
	// ****=====******======*++++
	const s2 = [22, 4];
	const t2 = [0, 4, 5, 6, 6, 1, 4];
	Assert.equal(Subseq.interleave(t, s), [t2, s2]);
});

test("contains basic", () => {
	const s = [0, 100];
	Assert.is(Subseq.contains(s, 0), true);
	Assert.is(Subseq.contains(s, 99), true);
});

test("contains out of range", () => {
	const s = [0, 100];
	Assert.is(Subseq.contains(s, -1000), false);
	Assert.is(Subseq.contains(s, -1), false);
	Assert.is(Subseq.contains(s, 100), false);
	Assert.is(Subseq.contains(s, 1000), false);
});

test("contains complex", () => {
	const s = [4, 3, 2, 3, 4];
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
		Assert.equal(Subseq.contains(s, i), expected[i] || false);
	}
});

test.run();
