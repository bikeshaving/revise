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

test.run();
