import {suite} from "uvu";
import * as Assert from "uvu/assert";

import {Edit} from "../src/edit";

const test = suite("Edit");
test("empty operations", () => {
	Assert.equal(new Edit([0]).operations(), []);
});

test("edit 1", () => {
	const edit = new Edit([5, "", "oo", 11]);
	Assert.is(edit.apply("hello world"), "hellooo world");
	Assert.equal(edit.operations(), [
		{type: "retain", start: 0, end: 5},
		{type: "insert", start: 5, value: "oo"},
		{type: "retain", start: 5, end: 11},
	]);
});

test("edit 2", () => {
	const edit = new Edit([1, "ello wor", "era", 11]);
	Assert.is(edit.apply("hello world"), "herald");
	Assert.equal(edit.operations(), [
		{type: "retain", start: 0, end: 1},
		{type: "delete", start: 1, end: 9, value: "ello wor"},
		{type: "insert", start: 1, value: "era"},
		{type: "retain", start: 9, end: 11},
	]);
});

test("edit 3", () => {
	const edit = new Edit([0, "he", "je", 5, " world", "", 11]);
	Assert.is(edit.apply("hello world"), "jello");
	Assert.equal(edit.operations(), [
		{type: "delete", start: 0, end: 2, value: "he"},
		{type: "insert", start: 0, value: "je"},
		{type: "retain", start: 2, end: 5},
		{type: "delete", start: 5, end: 11, value: " world"},
	]);
});

test("edit 4", () => {
	const edit = new Edit([4, "", " ", 5, " world", "n Earth", 11]);
	Assert.is(edit.apply("hello world"), "hell on Earth");
	Assert.equal(edit.operations(), [
		{type: "retain", start: 0, end: 4},
		{type: "insert", start: 4, value: " "},
		{type: "retain", start: 4, end: 5},
		{type: "delete", start: 5, end: 11, value: " world"},
		{type: "insert", start: 5, value: "n Earth"},
	]);
});

test("edit 5", () => {
	const edit = new Edit([6, "world", "buddy", 11]);
	Assert.is(edit.apply("hello world"), "hello buddy");
	Assert.equal(edit.operations(), [
		{type: "retain", start: 0, end: 6},
		{type: "delete", start: 6, end: 11, value: "world"},
		{type: "insert", start: 6, value: "buddy"},
	]);
});

test("edit 6", () => {
	const edit = new Edit([10, "d", "", 11]);
	Assert.is(edit.apply("hello world"), "hello worl");
	Assert.equal(edit.operations(), [
		{type: "retain", start: 0, end: 10},
		{type: "delete", start: 10, end: 11, value: "d"},
	]);
});

test("edit 7", () => {
	const edit = new Edit([11, "", "s", 11]);
	Assert.is(edit.apply("hello world"), "hello worlds");
	Assert.equal(edit.operations(), [
		{type: "retain", start: 0, end: 11},
		{type: "insert", start: 11, value: "s"},
	]);
});

test("compose 1", () => {
	// s0: "hello world"
	// dA:  =--------==
	//              "era"
	// iA: "=========+++=="
	// sA: "herald"
	// dB:  ======
	// iB:  ======+
	// sB: "heralds"
	const editA = new Edit([1, "ello wor", "era", 11]);
	const editB = new Edit([6, "", "s", 6]);
	const result = new Edit([2, "llo wor", "ra", 11, "", "s", 11]);
	Assert.equal(editA.compose(editB), result);
});

test("compose 2", () => {
	// s0: "hello world"
	// dA:  ===========
	//          "oo"
	// iA: "=====++======"
	// sA: "hellooo world"
	// dB:  =====--======
	// iB:  =============
	// sB: "hello world"
	const editA = new Edit([5, "", "oo", 11]);
	const editB = new Edit([5, "oo", "", 13]);
	const result = new Edit([11]);
	Assert.equal(editA.compose(editB), result);
});

test("compose 3", () => {
	// s0: "hello world"
	// dA:  =====-=====
	// iA:  ===========
	// sA: "helloworld"
	// dB:  ==========
	//          "_"
	// iB:  =====+=====
	// sB: "hello_world"
	const editA = new Edit([5, " ", "", 11]);
	const editB = new Edit([5, "", "_", 10]);
	const result = new Edit([5, " ", "_", 11]);
	Assert.equal(editA.compose(editB), result);
});

test("compose 4", () => {
	// s0: "hello world"
	// dA:  ==-------==
	// iA:  ===========
	// sA: "held"
	// dB:  ===-
	//         "lo"
	// iB:  ====++
	// sB: "hello"
	const editA = new Edit([2, "llo wor", "", 11]);
	const editB = new Edit([3, "d", "lo", 4]);
	const result = new Edit([2, "llo wor", "", 10, "d", "lo", 11]);
	Assert.equal(editA.compose(editB), result);
});

test("compose 5", () => {
	// s0: "hello world"
	// dA:  =====------
	// iA:  ===========
	// sA: "hello"
	// dB:  =====
	//          " world"
	// iB:  =====++++++
	// sB: "hello world"
	const editA = new Edit([5, " world", "", 11]);
	const editB = new Edit([5, "", " world", 5]);
	const result = new Edit([11]);
	Assert.equal(editA.compose(editB), result);
});

test("compose 6", () => {
	// s0: "hello world"
	// dA:  =====------
	// iA:  ===========
	// sA: "hello"
	// dB:  =====
	//          " word"
	// iB:  =====+++++
	// sB: "hello word"
	// dA:  =====------
	// dB:  ===========
	// dA:  =====------=====
	// iB:  ===========+++++
	// dB:  ================
	//     "hello world word"
	// do:  =====++++=======
	// io:  ===========++++=
	//     "hello worldd"
	// dA:  =========--=
	// iB:  ===========+
	// dB:  ============
	//                "d"
	// ic:  ===========+
	// dc:  =========--=
	const editA = new Edit([5, " world", "", 11]);
	const editB = new Edit([5, "", " word", 5]);
	const result = new Edit([9, "l", "", 11]);
	Assert.equal(editA.compose(editB), result);
});

test("compose 7", () => {
	const editA = new Edit([5, " ", "", 11]);
	const editB = new Edit([5, "", "_", 10]);
	const result = new Edit([5, " ", "_", 11]);
	Assert.equal(editA.compose(editB), result);
});

test("compose 8", () => {
	const editA = new Edit([5, " ", "", 11]);
	const editB = new Edit([5, "", " ", 10]);
	const result = new Edit([11]);
	Assert.equal(editA.compose(editB), result);
});

test("compose 9", () => {
	// s0: "hello world"
	// dA:  =====-=====
	// iA:  =====++======
	// sA: "hello__world"
	// dB:  =====--=====
	//          "    "
	// iB:  =====++++=====
	// sB: "hello     world"
	//
	//      hello " "
	// iB:  =====++++=====
	//          "__"
	// dB:  =====--======
	const editA = new Edit([5, " ", "__", 11]);
	const editB = new Edit([5, "__", "    ", 12]);
	const result = new Edit([6, "", "   ", 11]);
	Assert.equal(editA.compose(editB), result);
});

test("compose 10", () => {
	// s0: "x"
	// dA:  -
	//      "ab"
	// iA:  =++
	// sA: "ab"
	// dB:  ==
	// iB:  =+=
	// sB: "aab"
	const editA = new Edit([0, "x", "ab", 1]);
	const editB = new Edit([1, "", "a", 2]);
	const result = new Edit([0, "x", "aab", 1]);
	Assert.equal(editA.compose(editB), result);
});

test("compose 11: insert-then-delete cancellation", () => {
	// s0: "abcdef"
	// eA: insert "xyz" at 0, delete "def" -> "xyzabc"
	// eB: delete "xyza", insert "hi"      -> "hibc"
	const editA = new Edit([0, "", "xyz", 3, "def", "", 6]);
	const editB = new Edit([0, "xyza", "hi", 6]);
	const composed = editA.compose(editB);
	Assert.is(composed.apply("abcdef"), "hibc");
	Assert.is(composed.apply("abcdef"), editB.apply(editA.apply("abcdef")));
});

test("compose 12: associativity with cancellation", () => {
	// s0: "abcdefg"
	// eA: insert "xyz" at 0           -> "xyzabcdefg"
	// eB: delete "efg", insert "hijk" -> "xyzabcdhijk"
	// eC: delete "xyza", insert "mn"  -> "mnbcdhijk"
	const eA = new Edit([0, "", "xyz", 7]);
	const eB = new Edit([7, "efg", "hijk", 10]);
	const eC = new Edit([0, "xyza", "mn", 11]);
	const expected = eC.apply(eB.apply(eA.apply("abcdefg")));
	Assert.is(expected, "mnbcdhijk");
	Assert.is(eA.compose(eB).compose(eC).apply("abcdefg"), expected);
	Assert.is(eA.compose(eB.compose(eC)).apply("abcdefg"), expected);
});

test("invert 1", () => {
	const text = "hello world";
	const edit = Edit.builder(text).retain(5).insert("oo").build();
	const inverted = edit.invert();
	Assert.equal(inverted, new Edit([5, "oo", "", 13]));
	Assert.equal(inverted.apply(edit.apply(text)), text);
});

test("invert 2", () => {
	const text = "hello world";
	const edit = Edit.builder(text).retain(1).insert("era").delete(8).build();
	const inverted = edit.invert();
	Assert.equal(inverted, new Edit([1, "era", "ello wor", 6]));
	Assert.equal(inverted.apply(edit.apply(text)), text);
});

test("invert 3", () => {
	const text = "hello world";
	const edit = Edit.builder(text).retain(6).insert("buddy").delete(5).build();
	const inverted = edit.invert();
	Assert.equal(inverted, new Edit([6, "buddy", "world", 11]));
	Assert.equal(inverted.apply(edit.apply(text)), text);
});

test("invert 4", () => {
	const text = "hello world";
	const edit = Edit.builder(text).retain(10).delete(1).build();
	const inverted = edit.invert();
	Assert.equal(inverted, new Edit([10, "", "d", 10]));
	Assert.equal(inverted.apply(edit.apply(text)), text);
});

test("createBuilder empty", () => {
	Assert.equal(Edit.builder("hello world").build(), new Edit([11]));
});

test("createBuilder 1", () => {
	const builder = Edit.builder("hello world");
	builder.retain(5).insert("oo");
	Assert.equal(builder.build(), new Edit([5, "", "oo", 11]));
});

test("createBuilder 2", () => {
	const builder = Edit.builder("hello world");
	builder.retain(1).insert("era").delete(8);
	Assert.equal(builder.build(), new Edit([1, "ello wor", "era", 11]));
});

test("createBuilder 3", () => {
	const builder = Edit.builder("hello world");
	builder.retain(1).insert("era").delete(8);
	Assert.equal(builder.build(), new Edit([1, "ello wor", "era", 11]));
});

test("createBuilder 4", () => {
	const builder = Edit.builder("hello world");
	builder.retain(10).delete(1);
	Assert.equal(builder.build(), new Edit([10, "d", "", 11]));
});

test("createBuilder compose", () => {
	const editA = Edit.builder("hello world").insert("je").delete(2).build();
	const editB = Edit.builder("jello world").retain(5).delete(6).build();
	Assert.equal(
		editA.compose(editB),
		new Edit([0, "h", "j", 5, " world", "", 11]),
	);
});

// Validation tests
test("validation: empty array", () => {
	Assert.throws(() => new Edit([]), /Edit parts cannot be empty/);
});

test("validation: wrong length", () => {
	Assert.throws(() => new Edit([1, 2]), /Edit parts length 2 is invalid/);
});

test("validation: final position not number", () => {
	Assert.throws(
		() => new Edit(["not a number"]),
		/Single-element edit must be a number/,
	);
});

test("validation: negative final position", () => {
	Assert.throws(() => new Edit([-1]), /Final position cannot be negative/);
});

test("validation: position not number", () => {
	Assert.throws(
		() => new Edit(["not a number", "del", "ins", 5]),
		/Position at index 0 must be a number/,
	);
});

test("validation: deleted not string", () => {
	Assert.throws(
		() => new Edit([1, 2, "ins", 5]),
		/Deleted at index 1 must be a string/,
	);
});

test("validation: inserted not string", () => {
	Assert.throws(
		() => new Edit([1, "del", 3, 5]),
		/Inserted at index 2 must be a string/,
	);
});

test("validation: negative position", () => {
	Assert.throws(
		() => new Edit([-1, "del", "ins", 5]),
		/Position -1 at index 0 cannot be negative/,
	);
});

test("validation: positions not strictly increasing", () => {
	Assert.throws(
		() => new Edit([1, "a", "b", 2, "c", "d", 5]),
		/Position 2 at index 3 must be > previous end position 2/,
	);
});

test("validation: deletion exceeds next position", () => {
	Assert.throws(
		() => new Edit([1, "abc", "x", 3, "y", "z", 5]),
		/Deletion at position 1 extends to 4, exceeding next position 3/,
	);
});

test("validation: deletion exceeds final position", () => {
	Assert.throws(
		() => new Edit([1, "toolong", "ins", 5]),
		/Deletion at position 1 extends to 8, exceeding final position 5/,
	);
});

test("validation: valid empty edit", () => {
	// Should not throw
	const edit = new Edit([5]);
	Assert.is(edit.parts.length, 1);
});

test("validation: valid single operation", () => {
	// Should not throw
	const edit = new Edit([1, "del", "ins", 5]);
	Assert.is(edit.parts.length, 4);
});

test("validation: valid multiple operations", () => {
	// Should not throw
	const edit = new Edit([1, "a", "b", 3, "c", "d", 5]);
	Assert.is(edit.parts.length, 7);
});

test("validation: valid operations with gaps", () => {
	// Should not throw
	const edit = new Edit([1, "a", "b", 5, "c", "d", 10]);
	Assert.is(edit.parts.length, 7);
});

test("validation: valid adjacent operations", () => {
	// Should not throw - operations touch but don't overlap
	const edit = new Edit([1, "ab", "x", 4, "cd", "y", 6]);
	Assert.is(edit.parts.length, 7);
});

test("transform: concurrent insertions at different positions", () => {
	const text = "hello world";
	const left = new Edit([5, "", "oo", 11]);
	const right = new Edit([11, "", "!", 11]);
	const [lPrime, rPrime] = left.transform(right);
	Assert.is(rPrime.apply(left.apply(text)), lPrime.apply(right.apply(text)));
});

test("transform: concurrent deletions at different positions", () => {
	const text = "hello world";
	const left = new Edit([1, "ell", "", 11]);
	const right = new Edit([5, " wor", "", 11]);
	const [lPrime, rPrime] = left.transform(right);
	Assert.is(rPrime.apply(left.apply(text)), lPrime.apply(right.apply(text)));
});

test("transform: overlapping deletions", () => {
	const text = "hello world";
	const left = new Edit([2, "llo", "", 11]);
	const right = new Edit([4, "o ", "", 11]);
	const [lPrime, rPrime] = left.transform(right);
	Assert.is(rPrime.apply(left.apply(text)), lPrime.apply(right.apply(text)));
});

test("transform: insert vs delete at same position", () => {
	const text = "hello world";
	const left = new Edit([5, "", "ooo", 11]);
	const right = new Edit([5, " wor", "", 11]);
	const [lPrime, rPrime] = left.transform(right);
	Assert.is(rPrime.apply(left.apply(text)), lPrime.apply(right.apply(text)));
});

test("transform: both identity", () => {
	const text = "hello";
	const left = new Edit([5]);
	const right = new Edit([5]);
	const [lPrime, rPrime] = left.transform(right);
	Assert.is(rPrime.apply(left.apply(text)), lPrime.apply(right.apply(text)));
});

test("transform: one identity", () => {
	const text = "hello world";
	const left = new Edit([5, "", "oo", 11]);
	const right = new Edit([11]);
	const [lPrime, rPrime] = left.transform(right);
	Assert.is(rPrime.apply(left.apply(text)), lPrime.apply(right.apply(text)));
});

test("transform: concurrent insertions at same position", () => {
	const text = "hello";
	const left = new Edit([5, "", " world", 5]);
	const right = new Edit([5, "", "!", 5]);
	const [lPrime, rPrime] = left.transform(right);
	Assert.is(rPrime.apply(left.apply(text)), lPrime.apply(right.apply(text)));
});

test("transform: replace same region", () => {
	const text = "hello world";
	const left = new Edit([6, "world", "earth", 11]);
	const right = new Edit([6, "world", "mars", 11]);
	const [lPrime, rPrime] = left.transform(right);
	Assert.is(rPrime.apply(left.apply(text)), lPrime.apply(right.apply(text)));
});

test("transform: delete all vs insert", () => {
	const text = "abc";
	const left = new Edit([0, "abc", "", 3]);
	const right = new Edit([1, "", "X", 3]);
	const [lPrime, rPrime] = left.transform(right);
	Assert.is(rPrime.apply(left.apply(text)), lPrime.apply(right.apply(text)));
});

test("transform: multiple operations", () => {
	const text = "hello world";
	const left = new Edit([0, "h", "H", 5, " ", "_", 11]);
	const right = new Edit([6, "world", "WORLD", 11]);
	const [lPrime, rPrime] = left.transform(right);
	Assert.is(rPrime.apply(left.apply(text)), lPrime.apply(right.apply(text)));
});

test("transform: fully overlapping deletion", () => {
	const text = "hello world";
	const left = new Edit([5, " world", "", 11]);
	const right = new Edit([5, " world", "", 11]);
	const [lPrime, rPrime] = left.transform(right);
	const resultLR = rPrime.apply(left.apply(text));
	const resultRL = lPrime.apply(right.apply(text));
	Assert.is(resultLR, resultRL);
	Assert.is(resultLR, "hello");
});

test("transform: subset deletion", () => {
	const text = "hello world";
	const left = new Edit([2, "llo wor", "", 11]);
	const right = new Edit([4, "o w", "", 11]);
	const [lPrime, rPrime] = left.transform(right);
	Assert.is(rPrime.apply(left.apply(text)), lPrime.apply(right.apply(text)));
});

test("transform: insert at start", () => {
	const text = "hello";
	const left = new Edit([0, "", "A", 5]);
	const right = new Edit([0, "", "B", 5]);
	const [lPrime, rPrime] = left.transform(right);
	Assert.is(rPrime.apply(left.apply(text)), lPrime.apply(right.apply(text)));
});

test("transform: delete everything, both sides", () => {
	const text = "abc";
	const left = new Edit([0, "abc", "", 3]);
	const right = new Edit([0, "abc", "", 3]);
	const [lPrime, rPrime] = left.transform(right);
	const resultLR = rPrime.apply(left.apply(text));
	const resultRL = lPrime.apply(right.apply(text));
	Assert.is(resultLR, resultRL);
	Assert.is(resultLR, "");
});

test("transform: replace with different lengths", () => {
	const text = "abc";
	const left = new Edit([0, "abc", "ABCDEF", 3]);
	const right = new Edit([0, "abc", "X", 3]);
	const [lPrime, rPrime] = left.transform(right);
	Assert.is(rPrime.apply(left.apply(text)), lPrime.apply(right.apply(text)));
});

test("transform: adjacent non-overlapping operations", () => {
	const text = "abcdef";
	const left = new Edit([0, "abc", "", 6]);
	const right = new Edit([3, "def", "", 6]);
	const [lPrime, rPrime] = left.transform(right);
	const resultLR = rPrime.apply(left.apply(text));
	const resultRL = lPrime.apply(right.apply(text));
	Assert.is(resultLR, resultRL);
	Assert.is(resultLR, "");
});

test("transform: empty base document", () => {
	const text = "";
	const left = new Edit([0, "", "hello", 0]);
	const right = new Edit([0, "", "world", 0]);
	const [lPrime, rPrime] = left.transform(right);
	Assert.is(rPrime.apply(left.apply(text)), lPrime.apply(right.apply(text)));
});

test("transform: convergence with compose", () => {
	const text = "hello world";
	const left = new Edit([5, "", "oo", 11]);
	const right = new Edit([6, "world", "earth", 11]);
	const [lPrime, rPrime] = left.transform(right);
	const pathLR = left.compose(rPrime);
	const pathRL = right.compose(lPrime);
	Assert.is(pathLR.apply(text), pathRL.apply(text));
});

test("transform: left priority for same-position inserts", () => {
	const text = "ab";
	const left = new Edit([1, "", "X", 2]);
	const right = new Edit([1, "", "Y", 2]);
	const [_lPrime, rPrime] = left.transform(right);
	const result = rPrime.apply(left.apply(text));
	Assert.is(result, "aXYb");
});

test("transform: swapping arguments swaps priority", () => {
	const text = "ab";
	const left = new Edit([1, "", "X", 2]);
	const right = new Edit([1, "", "Y", 2]);
	// left.transform(right): left gets priority
	const [_lp1, rp1] = left.transform(right);
	Assert.is(rp1.apply(left.apply(text)), "aXYb");
	// right.transform(left): right gets priority
	const [_rp2, lp2] = right.transform(left);
	Assert.is(lp2.apply(right.apply(text)), "aYXb");
});

test("transform: same-position inserts on empty base", () => {
	const left = new Edit([0, "", " ", 0]);
	const right = new Edit([0, "", "!", 0]);
	const [lPrime, rPrime] = left.transform(right);
	Assert.is(rPrime.apply(left.apply("")), " !");
	Assert.is(lPrime.apply(right.apply("")), " !");
	// swapped: right gets priority
	const [rPrime2, lPrime2] = right.transform(left);
	Assert.is(lPrime2.apply(right.apply("")), "! ");
	Assert.is(rPrime2.apply(left.apply("")), "! ");
});

test("normalize + transform: append doesn't protect base from deletion", () => {
	// Normalized: retain "abc", insert "d" -- doesn't own "abc"
	// Raw: replace "abc" with "abcd" -- claims ownership of "abc"
	const base = "abc";
	const right = new Edit([0, "abc", "", 3]);

	const leftNorm = Edit.diff(base, "abcd");
	const [_lPn, rPn] = leftNorm.transform(right);
	Assert.is(rPn.apply(leftNorm.apply(base)), "d");

	const leftRaw = new Edit([0, "abc", "abcd", 3]);
	const [_lPr, rPr] = leftRaw.transform(right);
	Assert.is(rPr.apply(leftRaw.apply(base)), "abcd");
});

test("normalize + transform: prepend doesn't protect base from deletion", () => {
	const base = "abc";
	const right = new Edit([0, "abc", "", 3]);

	const leftNorm = Edit.diff(base, "xabc");
	const [_lPn, rPn] = leftNorm.transform(right);
	Assert.is(rPn.apply(leftNorm.apply(base)), "x");

	const leftRaw = new Edit([0, "abc", "xabc", 3]);
	const [_lPr, rPr] = leftRaw.transform(right);
	Assert.is(rPr.apply(leftRaw.apply(base)), "xabc");
});

test("normalize + transform: interior insert doesn't protect surrounding text", () => {
	// Normalized: retain "ab", insert "-", retain "cd" -- insert at 2 is
	// interior to right's deletion [1,3), so "-" is canceled
	// Raw: replace "bc" with "b-c" -- claims ownership of "b" and "c"
	const base = "abcd";
	const right = new Edit([1, "bc", "", 4]);

	const leftNorm = Edit.diff(base, "ab-cd");
	const [_lPn, rPn] = leftNorm.transform(right);
	Assert.is(rPn.apply(leftNorm.apply(base)), "ad");

	const leftRaw = new Edit([1, "bc", "b-c", 4]);
	const [_lPr, rPr] = leftRaw.transform(right);
	Assert.is(rPr.apply(leftRaw.apply(base)), "ab-cd");
});

test("transform canceled: insert interior to deletion is canceled", () => {
	// left inserts "-" at 2, right deletes "bc" at [1,3)
	// position 2 is interior to [1,3) -- canceled
	const base = "abcd";
	const left = new Edit([2, "", "-", 4]);
	const right = new Edit([1, "bc", "", 4]);
	const [lPrime, rPrime] = left.transform(right);
	const converged = rPrime.apply(left.apply(base));
	Assert.is(converged, "ad");
	Assert.is(lPrime.apply(right.apply(base)), "ad");
});

test("transform canceled: insert at deletion start boundary survives", () => {
	// left inserts "X" at 1, right deletes "bc" at [1,3)
	// position 1 == start of [1,3) -- not interior, survives
	const base = "abcd";
	const left = new Edit([1, "", "X", 4]);
	const right = new Edit([1, "bc", "", 4]);
	const [lPrime, rPrime] = left.transform(right);
	const converged = rPrime.apply(left.apply(base));
	Assert.is(converged, "aXd");
	Assert.is(lPrime.apply(right.apply(base)), "aXd");
});

test("transform canceled: insert at deletion end boundary survives", () => {
	// left inserts "X" at 3, right deletes "bc" at [1,3)
	// position 3 == end of [1,3) -- not interior, survives
	const base = "abcd";
	const left = new Edit([3, "", "X", 4]);
	const right = new Edit([1, "bc", "", 4]);
	const [lPrime, rPrime] = left.transform(right);
	const converged = rPrime.apply(left.apply(base));
	Assert.is(converged, "aXd");
	Assert.is(lPrime.apply(right.apply(base)), "aXd");
});

test("transform canceled: insert at start of string survives total deletion", () => {
	// left inserts "X" at 0, right deletes all [0,3)
	// position 0 is not > 0 -- not interior, survives
	const base = "abc";
	const left = new Edit([0, "", "X", 3]);
	const right = new Edit([0, "abc", "", 3]);
	const [lPrime, rPrime] = left.transform(right);
	const converged = rPrime.apply(left.apply(base));
	Assert.is(converged, "X");
	Assert.is(lPrime.apply(right.apply(base)), "X");
});

test("transform canceled: insert at end of string survives total deletion", () => {
	// left inserts "X" at 3, right deletes all [0,3)
	// position 3 == baseLength -- not interior, survives
	const base = "abc";
	const left = new Edit([3, "", "X", 3]);
	const right = new Edit([0, "abc", "", 3]);
	const [lPrime, rPrime] = left.transform(right);
	const converged = rPrime.apply(left.apply(base));
	Assert.is(converged, "X");
	Assert.is(lPrime.apply(right.apply(base)), "X");
});

test("transform canceled: both sides have canceled inserts", () => {
	// left: delete [0,3), insert "X" at 4 (canceled by right's [3,6))
	// right: delete [3,6), insert "Y" at 2 (canceled by left's [0,3))
	const base = "abcdef";
	const left = new Edit([0, "abc", "", 4, "", "X", 6]);
	const right = new Edit([2, "", "Y", 3, "def", "", 6]);
	const [lPrime, rPrime] = left.transform(right);
	const converged = rPrime.apply(left.apply(base));
	Assert.is(converged, "");
	Assert.is(lPrime.apply(right.apply(base)), "");
});

test("transform canceled: no canceled inserts gives identical behavior", () => {
	const base = "abcdef";
	const left = new Edit([0, "", "X", 3, "def", "", 6]);
	const right = new Edit([3, "", "Y", 6]);
	// X at 0: not interior, Y at 3: start boundary -- both survive
	const [lPrime, rPrime] = left.transform(right);
	const converged = rPrime.apply(left.apply(base));
	Assert.is(converged, lPrime.apply(right.apply(base)));
	Assert.is(converged, "XabcY");
});

test.run();
