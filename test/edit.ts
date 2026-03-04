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
	// d1:  =--------==
	//              "era"
	// i1: "=========+++=="
	// s1: "herald"
	// d2:  ======
	// i2:  ======+
	// s2: "heralds"
	const edit1 = new Edit([1, "ello wor", "era", 11]);
	const edit2 = new Edit([6, "", "s", 6]);
	const result = new Edit([2, "llo wor", "ra", 11, "", "s", 11]);
	Assert.equal(edit1.compose(edit2), result);
});

test("compose 2", () => {
	// s0: "hello world"
	// d1:  ===========
	//          "oo"
	// i1: "=====++======"
	// s1: "hellooo world"
	// d2:  =====--======
	// i2:  =============
	// s2: "hello world"
	const edit1 = new Edit([5, "", "oo", 11]);
	const edit2 = new Edit([5, "oo", "", 13]);
	const result = new Edit([11]);
	Assert.equal(edit1.compose(edit2), result);
});

test("compose 3", () => {
	// s0: "hello world"
	// d1:  =====-=====
	// i1:  ===========
	// s1: "helloworld"
	// d2:  ==========
	//          "_"
	// i2:  =====+=====
	// s2: "hello_world"
	const edit1 = new Edit([5, " ", "", 11]);
	const edit2 = new Edit([5, "", "_", 10]);
	const result = new Edit([5, " ", "_", 11]);
	Assert.equal(edit1.compose(edit2), result);
});

test("compose 4", () => {
	// s0: "hello world"
	// d1:  ==-------==
	// i1:  ===========
	// s1: "held"
	// d2:  ===-
	//         "lo"
	// i2:  ====++
	// s2: "hello"
	const edit1 = new Edit([2, "llo wor", "", 11]);
	const edit2 = new Edit([3, "d", "lo", 4]);
	const result = new Edit([2, "llo wor", "", 10, "d", "lo", 11]);
	Assert.equal(edit1.compose(edit2), result);
});

test("compose 5", () => {
	// s0: "hello world"
	// d1:  =====------
	// i1:  ===========
	// s1: "hello"
	// d2:  =====
	//          " world"
	// i2:  =====++++++
	// s2: "hello world"
	const edit1 = new Edit([5, " world", "", 11]);
	const edit2 = new Edit([5, "", " world", 5]);
	const result = new Edit([11]);
	Assert.equal(edit1.compose(edit2), result);
});

test("compose 6", () => {
	// s0: "hello world"
	// d1:  =====------
	// i1:  ===========
	// s1: "hello"
	// d2:  =====
	//          " word"
	// i2:  =====+++++
	// s2: "hello word"
	// d1:  =====------
	// d2:  ===========
	// d1:  =====------=====
	// i2:  ===========+++++
	// d2:  ================
	//     "hello world word"
	// do:  =====++++=======
	// io:  ===========++++=
	//     "hello worldd"
	// d1:  =========--=
	// i2:  ===========+
	// d2:  ============
	//                "d"
	// ic:  ===========+
	// dc:  =========--=
	const edit1 = new Edit([5, " world", "", 11]);
	const edit2 = new Edit([5, "", " word", 5]);
	const result = new Edit([9, "l", "", 11]);
	Assert.equal(edit1.compose(edit2), result);
});

test("compose 7", () => {
	const edit1 = new Edit([5, " ", "", 11]);
	const edit2 = new Edit([5, "", "_", 10]);
	const result = new Edit([5, " ", "_", 11]);
	Assert.equal(edit1.compose(edit2), result);
});

test("compose 8", () => {
	const edit1 = new Edit([5, " ", "", 11]);
	const edit2 = new Edit([5, "", " ", 10]);
	const result = new Edit([11]);
	Assert.equal(edit1.compose(edit2), result);
});

test("compose 9", () => {
	// s0: "hello world"
	// d1:  =====-=====
	// i1:  =====++======
	// s1: "hello__world"
	// d2:  =====--=====
	//          "    "
	// i2:  =====++++=====
	// s2: "hello     world"
	//
	//      hello " "
	// i2:  =====++++=====
	//          "__"
	// d2:  =====--======
	const edit1 = new Edit([5, " ", "__", 11]);
	const edit2 = new Edit([5, "__", "    ", 12]);
	const result = new Edit([6, "", "   ", 11]);
	Assert.equal(edit1.compose(edit2), result);
});

test("compose 10", () => {
	// s0: "x"
	// d1:  -
	//      "ab"
	// i1:  =++
	// s1: "ab"
	// d2:  ==
	// i2:  =+=
	// s2: "aab"
	const edit1 = new Edit([0, "x", "ab", 1]);
	const edit2 = new Edit([1, "", "a", 2]);
	const result = new Edit([0, "x", "aab", 1]);
	Assert.equal(edit1.compose(edit2), result);
});

// compose where edit2 deletes characters that edit1 inserted
test("compose 11: insert-then-delete cancellation", () => {
	// base: "abcdef"
	// edit1: insert "xyz" at 0, delete "def" at 3
	//   "abcdef" → "xyzabc"
	// edit2: delete "xyza" at 0, insert "hi"
	//   "xyzabc" → "hibc"
	// The 3 inserted chars "xyz" are deleted by edit2 and must cancel out.
	// The remaining deletion "a" is a real base char.
	const edit1 = new Edit([0, "", "xyz", 3, "def", "", 6]);
	const edit2 = new Edit([0, "xyza", "hi", 6]);
	const composed = edit1.compose(edit2);
	Assert.is(composed.apply("abcdef"), "hibc");
	Assert.is(composed.apply("abcdef"), edit2.apply(edit1.apply("abcdef")));
});

// compose associativity with insert-then-delete across three edits
test("compose 12: associativity with cancellation", () => {
	// base: "abcdefg"
	// e1: insert "xyz" at 0               → "xyzabcdefg"
	// e2: delete "efg" at 7, insert "hijk" → "xyzabcdhijk"
	// e3: delete "xyza" at 0, insert "mn"  → "mnbcdhijk"
	// (e1∘e2)∘e3 and e1∘(e2∘e3) must agree.
	const e1 = new Edit([0, "", "xyz", 7]);
	const e2 = new Edit([7, "efg", "hijk", 10]);
	const e3 = new Edit([0, "xyza", "mn", 11]);
	const expected = e3.apply(e2.apply(e1.apply("abcdefg")));
	Assert.is(expected, "mnbcdhijk");
	Assert.is(e1.compose(e2).compose(e3).apply("abcdefg"), expected);
	Assert.is(e1.compose(e2.compose(e3)).apply("abcdefg"), expected);
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
	const edit1 = Edit.builder("hello world").insert("je").delete(2).build();
	const edit2 = Edit.builder("jello world").retain(5).delete(6).build();
	Assert.equal(
		edit1.compose(edit2),
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
	const editA = new Edit([5, "", "oo", 11]);   // "hellooo world"
	const editB = new Edit([11, "", "!", 11]);    // "hello world!"
	const [aPrime, bPrime] = editA.transform(editB);
	Assert.is(bPrime.apply(editA.apply(text)), aPrime.apply(editB.apply(text)));
});

test("transform: concurrent deletions at different positions", () => {
	const text = "hello world";
	const editA = new Edit([1, "ell", "", 11]);   // "ho world"
	const editB = new Edit([5, " wor", "", 11]);  // "hellold"
	const [aPrime, bPrime] = editA.transform(editB);
	Assert.is(bPrime.apply(editA.apply(text)), aPrime.apply(editB.apply(text)));
});

test("transform: overlapping deletions", () => {
	const text = "hello world";
	const editA = new Edit([2, "llo", "", 11]);   // "he world"
	const editB = new Edit([4, "o ", "", 11]);     // "hellworld"
	const [aPrime, bPrime] = editA.transform(editB);
	Assert.is(bPrime.apply(editA.apply(text)), aPrime.apply(editB.apply(text)));
});

test("transform: insert vs delete at same position", () => {
	const text = "hello world";
	const editA = new Edit([5, "", "ooo", 11]);    // "helloooo world"
	const editB = new Edit([5, " wor", "", 11]);   // "hellold"
	const [aPrime, bPrime] = editA.transform(editB);
	Assert.is(bPrime.apply(editA.apply(text)), aPrime.apply(editB.apply(text)));
});

test("transform: both identity", () => {
	const text = "hello";
	const editA = new Edit([5]);
	const editB = new Edit([5]);
	const [aPrime, bPrime] = editA.transform(editB);
	Assert.is(bPrime.apply(editA.apply(text)), aPrime.apply(editB.apply(text)));
});

test("transform: one identity", () => {
	const text = "hello world";
	const editA = new Edit([5, "", "oo", 11]);
	const editB = new Edit([11]);
	const [aPrime, bPrime] = editA.transform(editB);
	Assert.is(bPrime.apply(editA.apply(text)), aPrime.apply(editB.apply(text)));
});

test("transform: concurrent insertions at same position", () => {
	const text = "hello";
	const editA = new Edit([5, "", " world", 5]);
	const editB = new Edit([5, "", "!", 5]);
	const [aPrime, bPrime] = editA.transform(editB);
	Assert.is(bPrime.apply(editA.apply(text)), aPrime.apply(editB.apply(text)));
});

test("transform: replace same region", () => {
	const text = "hello world";
	const editA = new Edit([6, "world", "earth", 11]);
	const editB = new Edit([6, "world", "mars", 11]);
	const [aPrime, bPrime] = editA.transform(editB);
	Assert.is(bPrime.apply(editA.apply(text)), aPrime.apply(editB.apply(text)));
});

test("transform: delete all vs insert", () => {
	const text = "abc";
	const editA = new Edit([0, "abc", "", 3]);
	const editB = new Edit([1, "", "X", 3]);
	const [aPrime, bPrime] = editA.transform(editB);
	Assert.is(bPrime.apply(editA.apply(text)), aPrime.apply(editB.apply(text)));
});

test("transform: multiple operations", () => {
	const text = "hello world";
	const editA = new Edit([0, "h", "H", 5, " ", "_", 11]);
	const editB = new Edit([6, "world", "WORLD", 11]);
	const [aPrime, bPrime] = editA.transform(editB);
	Assert.is(bPrime.apply(editA.apply(text)), aPrime.apply(editB.apply(text)));
});

test("transform: fully overlapping deletion", () => {
	const text = "hello world";
	// Both delete the same region exactly
	const editA = new Edit([5, " world", "", 11]);
	const editB = new Edit([5, " world", "", 11]);
	const [aPrime, bPrime] = editA.transform(editB);
	const resultAB = bPrime.apply(editA.apply(text));
	const resultBA = aPrime.apply(editB.apply(text));
	Assert.is(resultAB, resultBA);
	Assert.is(resultAB, "hello");
});

test("transform: subset deletion", () => {
	const text = "hello world";
	// A deletes "llo wor", B deletes "o w"
	const editA = new Edit([2, "llo wor", "", 11]);
	const editB = new Edit([4, "o w", "", 11]);
	const [aPrime, bPrime] = editA.transform(editB);
	Assert.is(bPrime.apply(editA.apply(text)), aPrime.apply(editB.apply(text)));
});

test("transform: insert at start", () => {
	const text = "hello";
	const editA = new Edit([0, "", "A", 5]);
	const editB = new Edit([0, "", "B", 5]);
	const [aPrime, bPrime] = editA.transform(editB);
	Assert.is(bPrime.apply(editA.apply(text)), aPrime.apply(editB.apply(text)));
});

test("transform: delete everything, both sides", () => {
	const text = "abc";
	const editA = new Edit([0, "abc", "", 3]);
	const editB = new Edit([0, "abc", "", 3]);
	const [aPrime, bPrime] = editA.transform(editB);
	const resultAB = bPrime.apply(editA.apply(text));
	const resultBA = aPrime.apply(editB.apply(text));
	Assert.is(resultAB, resultBA);
	Assert.is(resultAB, "");
});

test("transform: replace with different lengths", () => {
	const text = "abc";
	const editA = new Edit([0, "abc", "ABCDEF", 3]);
	const editB = new Edit([0, "abc", "X", 3]);
	const [aPrime, bPrime] = editA.transform(editB);
	Assert.is(bPrime.apply(editA.apply(text)), aPrime.apply(editB.apply(text)));
});

test("transform: adjacent non-overlapping operations", () => {
	const text = "abcdef";
	// A deletes "abc", B deletes "def"
	const editA = new Edit([0, "abc", "", 6]);
	const editB = new Edit([3, "def", "", 6]);
	const [aPrime, bPrime] = editA.transform(editB);
	const resultAB = bPrime.apply(editA.apply(text));
	const resultBA = aPrime.apply(editB.apply(text));
	Assert.is(resultAB, resultBA);
	Assert.is(resultAB, "");
});

test("transform: empty base document", () => {
	const text = "";
	const editA = new Edit([0, "", "hello", 0]);
	const editB = new Edit([0, "", "world", 0]);
	const [aPrime, bPrime] = editA.transform(editB);
	Assert.is(bPrime.apply(editA.apply(text)), aPrime.apply(editB.apply(text)));
});

test("transform: convergence with compose", () => {
	// Verify that A.compose(B') === B.compose(A')
	const text = "hello world";
	const editA = new Edit([5, "", "oo", 11]);
	const editB = new Edit([6, "world", "earth", 11]);
	const [aPrime, bPrime] = editA.transform(editB);

	// A then B' should produce the same edit as B then A'
	const pathAB = editA.compose(bPrime);
	const pathBA = editB.compose(aPrime);
	Assert.is(pathAB.apply(text), pathBA.apply(text));
});

test("transform: left priority for same-position inserts", () => {
	const text = "ab";
	const editA = new Edit([1, "", "X", 2]);
	const editB = new Edit([1, "", "Y", 2]);
	const [_aPrime, bPrime] = editA.transform(editB);
	const result = bPrime.apply(editA.apply(text));
	// A gets left priority, so A's insert comes first
	Assert.is(result, "aXYb");
});

test("transform: swapping arguments swaps priority", () => {
	const text = "ab";
	const editA = new Edit([1, "", "X", 2]);
	const editB = new Edit([1, "", "Y", 2]);
	// A.transform(B): A gets priority → "aXYb"
	const [_ap1, bp1] = editA.transform(editB);
	Assert.is(bp1.apply(editA.apply(text)), "aXYb");
	// B.transform(A): B gets priority → "aYXb"
	const [_bp2, ap2] = editB.transform(editA);
	Assert.is(ap2.apply(editB.apply(text)), "aYXb");
});

test("transform: same-position inserts on empty base", () => {
	// Exact counterexample found by fast-check fuzzer
	const editA = new Edit([0, "", " ", 0]);
	const editB = new Edit([0, "", "!", 0]);
	const [aPrime, bPrime] = editA.transform(editB);
	// Both paths converge (A has priority)
	Assert.is(bPrime.apply(editA.apply("")), " !");
	Assert.is(aPrime.apply(editB.apply("")), " !");
	// Swapped: B has priority
	const [bPrime2, aPrime2] = editB.transform(editA);
	Assert.is(aPrime2.apply(editB.apply("")), "! ");
	Assert.is(bPrime2.apply(editA.apply("")), "! ");
});

// --- normalize + transform interaction ---

test("normalize + transform: append doesn't protect base from deletion", () => {
	// Alice appends "d" to "abc" → "abcd"
	// Bob deletes "abc" → ""
	// Normalized Alice: retain "abc", insert "d" — she doesn't own "abc"
	// Raw Alice: replace "abc" with "abcd" — she claims to own "abc"
	const base = "abc";
	const bob = new Edit([0, "abc", "", 3]);

	const aliceNorm = Edit.diff(base, "abcd"); // [3, "", "d", 3]
	const [_aPn, bPn] = aliceNorm.transform(bob);
	Assert.is(bPn.apply(aliceNorm.apply(base)), "d");

	const aliceRaw = new Edit([0, "abc", "abcd", 3]);
	const [_aPr, bPr] = aliceRaw.transform(bob);
	Assert.is(bPr.apply(aliceRaw.apply(base)), "abcd");
});

test("normalize + transform: prepend doesn't protect base from deletion", () => {
	// Alice prepends "x" to "abc" → "xabc"
	// Bob deletes "abc" → ""
	const base = "abc";
	const bob = new Edit([0, "abc", "", 3]);

	const aliceNorm = Edit.diff(base, "xabc"); // [0, "", "x", 3]
	const [_aPn, bPn] = aliceNorm.transform(bob);
	Assert.is(bPn.apply(aliceNorm.apply(base)), "x");

	const aliceRaw = new Edit([0, "abc", "xabc", 3]);
	const [_aPr, bPr] = aliceRaw.transform(bob);
	Assert.is(bPr.apply(aliceRaw.apply(base)), "xabc");
});

test("normalize + transform: interior insert doesn't protect surrounding text", () => {
	// Alice inserts "-" in the middle: "abcd" → "ab-cd"
	// Bob deletes "bc": "abcd" → "ad"
	const base = "abcd";
	const bob = new Edit([1, "bc", "", 4]);

	const aliceNorm = Edit.diff(base, "ab-cd"); // [2, "", "-", 4]
	const [_aPn, bPn] = aliceNorm.transform(bob);
	// "-" at position 2 is interior to Bob's deletion [1,3) → orphaned
	Assert.is(bPn.apply(aliceNorm.apply(base)), "ad");

	// Raw: replace "bc" with "b-c" — Alice claims ownership of "b" and "c"
	const aliceRaw = new Edit([1, "bc", "b-c", 4]);
	const [_aPr, bPr] = aliceRaw.transform(bob);
	Assert.is(bPr.apply(aliceRaw.apply(base)), "ab-cd");
});

// --- orphan deletion in transform ---

test("transform orphan: insert interior to deletion is swallowed", () => {
	// base "abcd", Alice inserts "-" at 2, Bob deletes "bc" at [1,3)
	// Position 2 is interior to [1,3) → "-" is orphaned
	const base = "abcd";
	const alice = new Edit([2, "", "-", 4]);
	const bob = new Edit([1, "bc", "", 4]);
	const [aPrime, bPrime] = alice.transform(bob);
	const converged = bPrime.apply(alice.apply(base));
	Assert.is(converged, "ad");
	Assert.is(aPrime.apply(bob.apply(base)), "ad");
});

test("transform orphan: insert at deletion start boundary survives", () => {
	// base "abcd", Alice inserts "X" at 1, Bob deletes "bc" at [1,3)
	// Position 1 == start of [1,3) → not interior, survives
	const base = "abcd";
	const alice = new Edit([1, "", "X", 4]);
	const bob = new Edit([1, "bc", "", 4]);
	const [aPrime, bPrime] = alice.transform(bob);
	const converged = bPrime.apply(alice.apply(base));
	Assert.is(converged, "aXd");
	Assert.is(aPrime.apply(bob.apply(base)), "aXd");
});

test("transform orphan: insert at deletion end boundary survives", () => {
	// base "abcd", Alice inserts "X" at 3, Bob deletes "bc" at [1,3)
	// Position 3 == end of [1,3) → not interior, survives
	const base = "abcd";
	const alice = new Edit([3, "", "X", 4]);
	const bob = new Edit([1, "bc", "", 4]);
	const [aPrime, bPrime] = alice.transform(bob);
	const converged = bPrime.apply(alice.apply(base));
	Assert.is(converged, "aXd");
	Assert.is(aPrime.apply(bob.apply(base)), "aXd");
});

test("transform orphan: insert at start of string survives total deletion", () => {
	// base "abc", Alice inserts "X" at 0, Bob deletes all [0,3)
	// Position 0 is not > 0 → not interior, survives
	const base = "abc";
	const alice = new Edit([0, "", "X", 3]);
	const bob = new Edit([0, "abc", "", 3]);
	const [aPrime, bPrime] = alice.transform(bob);
	const converged = bPrime.apply(alice.apply(base));
	Assert.is(converged, "X");
	Assert.is(aPrime.apply(bob.apply(base)), "X");
});

test("transform orphan: insert at end of string survives total deletion", () => {
	// base "abc", Alice inserts "X" at 3, Bob deletes all [0,3)
	// Position 3 == baseLength → not interior, survives
	const base = "abc";
	const alice = new Edit([3, "", "X", 3]);
	const bob = new Edit([0, "abc", "", 3]);
	const [aPrime, bPrime] = alice.transform(bob);
	const converged = bPrime.apply(alice.apply(base));
	Assert.is(converged, "X");
	Assert.is(aPrime.apply(bob.apply(base)), "X");
});

test("transform orphan: both sides have orphaned inserts", () => {
	// base "abcdef", Alice deletes "bcde" [1,5) and has no inserts
	// Bob inserts "X" at 2 and "Y" at 4 — both interior to [1,5)
	// Meanwhile Bob deletes "bcde" [1,5) and Alice inserts "P" at 3 — interior to [1,5)
	const base = "abcdef";
	// Alice: insert "P" at 3, delete [4,5) "e"
	// Bob: insert "Q" at 2, delete [1,4) "bcd"
	// P at 3 is interior to Bob's deletion [1,4) → orphaned
	// Q at 2 is interior to Alice's deletion [4,5)? No, 2 is not in [4,5).
	// Let me use a cleaner example:
	// Alice: delete [0,3) "abc"
	// Bob: delete [3,6) "def"
	// Alice: insert "X" at 4, which is interior to Bob's [3,6)
	// Bob: insert "Y" at 2, which is interior to Alice's [0,3)
	const alice = new Edit([0, "abc", "", 4, "", "X", 6]);
	const bob = new Edit([2, "", "Y", 3, "def", "", 6]);
	const [aPrime, bPrime] = alice.transform(bob);
	const converged = bPrime.apply(alice.apply(base));
	// X is orphaned (interior to Bob's [3,6)), Y is orphaned (interior to Alice's [0,3))
	// Both orphans are swallowed → converged = ""
	Assert.is(converged, "");
	Assert.is(aPrime.apply(bob.apply(base)), "");
});

test("transform orphan: no orphans gives identical behavior to old transform", () => {
	// Insertions at non-interior positions should not be affected
	const base = "abcdef";
	const alice = new Edit([0, "", "X", 3, "def", "", 6]); // insert at 0, delete [3,6)
	const bob = new Edit([3, "", "Y", 6]);                  // insert at 3
	// X at 0: not interior (0 not > 0), Y at 3: Bob's insert at 3, Alice deletes [3,6),
	// 3 == start boundary → not interior
	const [aPrime, bPrime] = alice.transform(bob);
	const converged = bPrime.apply(alice.apply(base));
	Assert.is(converged, aPrime.apply(bob.apply(base)));
	// X survives (at start), Y survives (at boundary)
	Assert.is(converged, "XabcY");
});

test.run();
