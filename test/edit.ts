import {suite} from "uvu";
import * as Assert from "uvu/assert";

import {Edit} from "../src/edit";

const test = suite("Edit");
test("empty operations", () => {
	Assert.equal(new Edit([0]).operations(), []);
});

test("operations 1", () => {
	Assert.equal(new Edit([0, 5, "oo", 5, 11]).operations(), [
		{type: "retain", start: 0, end: 5},
		{type: "insert", start: 5, value: "oo"},
		{type: "retain", start: 5, end: 11},
	]);
});

test("operations 2", () => {
	Assert.equal(new Edit([0, 1, "era", 9, 11]).operations(), [
		{type: "retain", start: 0, end: 1},
		{type: "insert", start: 1, value: "era"},
		{type: "delete", start: 1, end: 9, value: undefined},
		{type: "retain", start: 9, end: 11},
	]);
});

test("operations 3", () => {
	Assert.equal(new Edit(["je", 2, 5, 11]).operations(), [
		{type: "insert", start: 0, value: "je"},
		{type: "delete", start: 0, end: 2, value: undefined},
		{type: "retain", start: 2, end: 5},
		{type: "delete", start: 5, end: 11, value: undefined},
	]);
});

test("operations 4", () => {
	Assert.equal(new Edit([0, 4, " ", 4, 5, "n Earth", 11]).operations(), [
		{type: "retain", start: 0, end: 4},
		{type: "insert", start: 4, value: " "},
		{type: "retain", start: 4, end: 5},
		{type: "insert", start: 5, value: "n Earth"},
		{type: "delete", start: 5, end: 11, value: undefined},
	]);
});

test("operations 5", () => {
	Assert.equal(new Edit([0, 6, "buddy", 11]).operations(), [
		{type: "retain", start: 0, end: 6},
		{type: "insert", start: 6, value: "buddy"},
		{type: "delete", start: 6, end: 11, value: undefined},
	]);
});

test("operations 6", () => {
	Assert.equal(new Edit([0, 10, 11]).operations(), [
		{type: "retain", start: 0, end: 10},
		{type: "delete", start: 10, end: 11, value: undefined},
	]);
});

test("operations 7", () => {
	Assert.equal(new Edit([0, 11, "s"]).operations(), [
		{type: "retain", start: 0, end: 11},
		{type: "insert", start: 11, value: "s"},
	]);
});

//test("synthesize empty", () => {
//	Assert.equal(
//		Edit.synthesize(new Subseq([]), "", new Subseq([])),
//		new Edit([0]),
//	);
//});
//
//test("synthesize 1", () => {
//	const insertSeq = new Subseq([5, 2, 6]);
//	const inserted = "oo";
//	const deleteSeq = new Subseq([11]);
//	Assert.equal(
//		Edit.synthesize(insertSeq, inserted, deleteSeq),
//		new Edit([0, 5, "oo", 5, 11]),
//	);
//});
//
//test("synthesize 2", () => {
//	const insertSeq = new Subseq([1, 3, 10]);
//	const inserted = "era";
//	const deleteSeq = new Subseq([1, 8, 2]);
//	Assert.equal(
//		Edit.synthesize(insertSeq, inserted, deleteSeq),
//		new Edit([0, 1, "era", 9, 11]),
//	);
//});
//
//test("synthesize 3", () => {
//	const insertSeq = new Subseq([0, 2, 11]);
//	const inserted = "je";
//	const deleteSeq = new Subseq([0, 2, 3, 6]);
//	Assert.equal(
//		Edit.synthesize(insertSeq, inserted, deleteSeq),
//		new Edit(["je", 2, 5, 11]),
//	);
//});
//
//test("synthesize 4", () => {
//	const insertSeq = new Subseq([4, 1, 1, 7, 6]);
//	const inserted = " n Earth";
//	const deleteSeq = new Subseq([5, 6]);
//	Assert.equal(
//		Edit.synthesize(insertSeq, inserted, deleteSeq),
//		new Edit([0, 4, " ", 4, 5, "n Earth", 11]),
//	);
//});
//
//test("synthesize 5", () => {
//	const insertSeq = new Subseq([6, 5, 5]);
//	const inserted = "buddy";
//	const deleteSeq = new Subseq([6, 5]);
//	Assert.equal(
//		Edit.synthesize(insertSeq, inserted, deleteSeq),
//		new Edit([0, 6, "buddy", 11]),
//	);
//});
//
//test("synthesize 6", () => {
//	const insertSeq = new Subseq([11, 4]);
//	const inserted = "star";
//	const deleteSeq = new Subseq([0, 6, 5]);
//	Assert.equal(
//		Edit.synthesize(insertSeq, inserted, deleteSeq),
//		new Edit([6, 11, "star"]),
//	);
//});
//
//test("synthesize 7", () => {
//	// ======+++====
//	const insertSeq = new Subseq([3, 3, 7]);
//	const inserted = "foo";
//	// ===+++===+
//	const deleteSeq = new Subseq([3, 3, 3, 1]);
//	Assert.equal(
//		Edit.synthesize(insertSeq, inserted, deleteSeq),
//		new Edit([0, 3, "foo", 6, 9, 10]),
//	);
//});
//
//test("synthesize mismatched inserted and insertSeq throws", () => {
//	try {
//		Edit.synthesize(new Subseq([2, 2]), "foo", new Subseq([2]));
//		Assert.unreachable();
//	} catch (err) {
//		Assert.ok(err instanceof Error);
//		// TODO: test message
//	}
//});
//
//test("synthesize insertions after deletions", () => {
//	const insertSeq = new Subseq([6, 3, 5]);
//	const inserted = "bro";
//	const deleteSeq = new Subseq([6, 5]);
//	Assert.equal(
//		Edit.synthesize(insertSeq, inserted, deleteSeq),
//		new Edit([0, 6, "bro", 11]),
//	);
//});

test("compose 1", () => {
	// s0: "hello world"
	// d1:  =--------==
	//              "era"
	// i1: "=========+++=="
	// s1: "herald"
	// d2:  ======
	// i2:  ======+
	// s2: "heralds"
	const edit1 = new Edit([0, 1, "era", 9, 11], "ello wor");
	const edit2 = new Edit([0, 6, "s"], "");
	const result = new Edit([0, 2, "ra", 9, 11, "s"], "llo wor");
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
	const edit1 = new Edit([0, 5, "oo", 5, 11], "");
	const edit2 = new Edit([0, 5, 7, 13], "oo");
	const result = new Edit([0, 11], "");
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
	const edit1 = new Edit([0, 5, 6, 11], " ");
	const edit2 = new Edit([0, 5, "_", 5, 10], "");
	const result = new Edit([0, 5, "_", 6, 11], " ");
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
	const edit1 = new Edit([0, 2, 9, 11], "llo wor");
	const edit2 = new Edit([0, 3, "lo", 4], "d");
	const result = new Edit([0, 2, 9, 10, "lo", 11], "llo word");
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
	const edit1 = new Edit([0, 5, 11], " world");
	const edit2 = new Edit([0, 5, " world"], "");
	const result = new Edit([0, 11], "");
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
	const edit1 = new Edit([0, 5, 11], " world");
	const edit2 = new Edit([0, 5, " word"], "");
	const result = new Edit([0, 9, 10, 11], "l");
	Assert.equal(edit1.compose(edit2), result);
});

test("compose 7", () => {
	const edit1 = new Edit([0, 5, 6, 11], " ");
	const edit2 = new Edit([0, 5, "_", 5, 10], "");
	const result = new Edit([0, 5, "_", 6, 11], " ");
	Assert.equal(edit1.compose(edit2), result);
});

test("compose 8", () => {
	const edit1 = new Edit([0, 5, 6, 11], " ");
	const edit2 = new Edit([0, 5, " ", 5, 10], "");
	const result = new Edit([0, 11], "");
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
	const edit1 = new Edit([0, 5, "__", 6, 11], " ");
	const edit2 = new Edit([0, 5, "    ", 7, 12], "__");
	const result = new Edit([0, 6, "   ", 6, 11], "");
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
	const edit1 = new Edit([1, "ab"], "x");
	const edit2 = new Edit([0, 1, "a", 1, 2], "");
	const result = new Edit(["aab", 1], "x");
	Assert.equal(edit1.compose(edit2), result);
});

//test("build 1", () => {
//	Assert.equal(
//		Edit.build("hello world", "oo", 5),
//		new Edit([0, 5, "oo", 5, 11], ""),
//	);
//});
//
//test("build 2", () => {
//	Assert.equal(
//		Edit.build("hello world", "era", 1, 9),
//		new Edit([0, 1, "era", 9, 11], "ello wor"),
//	);
//});
//
//test("build 3", () => {
//	Assert.equal(
//		Edit.build("hello world", "buddy", 6, 11),
//		new Edit([0, 6, "buddy", 11], "world"),
//	);
//});
//
//test("build 4", () => {
//	Assert.equal(
//		Edit.build("hello world", "", 10, 11),
//		new Edit([0, 10, 11], "d"),
//	);
//});
//
//test("build compose", () => {
//	const edit1 = Edit.build("hello world", "je", 0, 2);
//	const edit2 = Edit.build("jello world", "", 5, 11);
//	Assert.equal(edit1.compose(edit2), new Edit(["j", 1, 5, 11], "h world"));
//});

test("invert 1", () => {
	const text = "hello world";
	const edit = Edit.build(text, "oo", 5);
	const inverted = edit.invert();
	Assert.equal(inverted, new Edit([0, 5, 7, 13], "oo"));
	Assert.equal(inverted.apply(edit.apply(text)), text);
});

test("invert 2", () => {
	const text = "hello world";
	const edit = Edit.build(text, "era", 1, 9);
	const inverted = edit.invert();
	Assert.equal(inverted, new Edit([0, 1, "ello wor", 4, 6], "era"));
	Assert.equal(inverted.apply(edit.apply(text)), text);
});

test("invert 3", () => {
	const text = "hello world";
	const edit = Edit.build(text, "buddy", 6, 11);
	const inverted = edit.invert();
	Assert.equal(inverted, new Edit([0, 6, "world", 11], "buddy"));
	Assert.equal(inverted.apply(edit.apply(text)), text);
});

test("invert 4", () => {
	const text = "hello world";
	const edit = Edit.build("hello world", "", 10, 11);
	const inverted = edit.invert();
	Assert.equal(inverted, new Edit([0, 10, "d"], ""));
	Assert.equal(inverted.apply(edit.apply(text)), text);
});

test.run();
