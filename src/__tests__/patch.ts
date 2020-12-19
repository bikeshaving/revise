import {Patch} from "../patch";
import {Subseq} from "../subseq";

describe("Patch", () => {
	describe("operations", () => {
		test("operations 1", () => {
			expect(new Patch([5, "oo", 11]).operations()).toEqual([
				{type: "retain", start: 0, end: 5},
				{type: "insert", start: 5, value: "oo"},
				{type: "retain", start: 5, end: 11},
			]);
		});

		test("operations 2", () => {
			expect(new Patch([1, 9, "era", 11]).operations()).toEqual([
				{type: "retain", start: 0, end: 1},
				{type: "delete", start: 1, end: 9},
				{type: "insert", start: 1, value: "era"},
				{type: "retain", start: 9, end: 11},
			]);
		});

		test("operations 3", () => {
			expect(new Patch([0, 2, "je", 5, 11]).operations()).toEqual([
				{type: "delete", start: 0, end: 2},
				{type: "insert", start: 0, value: "je"},
				{type: "retain", start: 2, end: 5},
				{type: "delete", start: 5, end: 11},
			]);
		});

		test("operations 4", () => {
			expect(new Patch([4, " ", 5, 11, "n Earth"]).operations()).toEqual([
				{type: "retain", start: 0, end: 4},
				{type: "insert", start: 4, value: " "},
				{type: "retain", start: 4, end: 5},
				{type: "delete", start: 5, end: 11},
				{type: "insert", start: 5, value: "n Earth"},
			]);
		});

		test("operations 5", () => {
			expect(new Patch([6, 11, "buddy"]).operations()).toEqual([
				{type: "retain", start: 0, end: 6},
				{type: "delete", start: 6, end: 11},
				{type: "insert", start: 6, value: "buddy"},
			]);
		});

		test("operations 6", () => {
			expect(new Patch([10, 11]).operations()).toEqual([
				{type: "retain", start: 0, end: 10},
				{type: "delete", start: 10, end: 11},
			]);
		});
	});

	describe("synthesize", () => {
		test("synthesize 1", () => {
			const insertSeq = new Subseq([5, 2, 6]);
			const deleteSeq = new Subseq([11]);
			const inserted = "oo";
			const factored = {insertSeq, deleteSeq, inserted};
			expect(Patch.synthesize(factored)).toEqual(new Patch([5, "oo", 11]));
			expect(Patch.synthesize(factored).factor()).toEqual(factored);
		});

		test("synthesize 2", () => {
			const insertSeq = new Subseq([9, 3, 2]);
			const deleteSeq = new Subseq([1, 8, 2]);
			const inserted = "era";
			expect(Patch.synthesize({insertSeq, deleteSeq, inserted})).toEqual(
				new Patch([1, 9, "era", 11]),
			);

			expect(
				Patch.synthesize({insertSeq, deleteSeq, inserted}).factor(),
			).toEqual({
				insertSeq,
				deleteSeq,
				inserted,
			});
		});

		test("synthesize 3", () => {
			const insertSeq = new Subseq([2, 2, 9]);
			const deleteSeq = new Subseq([0, 2, 3, 6]);
			const inserted = "je";
			expect(Patch.synthesize({insertSeq, deleteSeq, inserted})).toEqual(
				new Patch([0, 2, "je", 5, 11]),
			);
		});

		test("synthesize 4", () => {
			const insertSeq = new Subseq([4, 1, 7, 7]);
			const deleteSeq = new Subseq([5, 6]);
			const inserted = " n Earth";
			expect(Patch.synthesize({insertSeq, deleteSeq, inserted})).toEqual(
				new Patch([4, " ", 5, 11, "n Earth"]),
			);
		});

		test("synthesize 5", () => {
			const insertSeq = new Subseq([11, 5]);
			const deleteSeq = new Subseq([6, 5]);
			const inserted = "buddy";
			expect(Patch.synthesize({insertSeq, deleteSeq, inserted})).toEqual(
				new Patch([6, 11, "buddy"]),
			);
		});

		test("synthesize 6", () => {
			const insertSeq = new Subseq([11, 4]);
			const deleteSeq = new Subseq([0, 6, 5]);
			const inserted = "star";
			expect(Patch.synthesize({insertSeq, deleteSeq, inserted})).toEqual(
				new Patch([0, 6, 11, "star"]),
			);
		});

		test("simple", () => {
			// ======+++====
			const insertSeq = new Subseq([6, 3, 4]);
			// ===+++===+
			const deleteSeq = new Subseq([3, 3, 3, 1]);
			const inserted = "foo";
			expect(Patch.synthesize({insertSeq, deleteSeq, inserted})).toEqual(
				new Patch([3, 6, "foo", 9, 10]),
			);
		});

		test("mismatched inserted and insertSeq throws", () => {
			expect(() => {
				Patch.synthesize({
					insertSeq: new Subseq([2, 2]),
					deleteSeq: new Subseq([2]),
					inserted: "foo",
				});
			}).toThrow();
		});

		test("insertions after deletions", () => {
			expect(
				Patch.synthesize({
					insertSeq: new Subseq([11, 3]),
					deleteSeq: new Subseq([6, 5]),
					inserted: "bro",
				}),
			).toEqual(new Patch([6, 11, "bro"]));
		});

		test("empty", () => {
			expect(
				Patch.synthesize({
					insertSeq: new Subseq([]),
					deleteSeq: new Subseq([]),
					inserted: "",
				}),
			).toEqual(new Patch([0]));
		});
	});

	describe("compose", () => {
		test("compose 1", () => {
			// s0: "hello world"
			// d1:  =--------==
			//              "era"
			// i1: "=========+++=="
			// s1: "herald"
			// d2:  ======
			// i2:  ======+
			// s2: "heralds"
			const patch1 = new Patch([1, 9, "era", 11], "ello wor");
			const patch2 = new Patch([6, "s"], "");
			const result = new Patch([1, 9, "era", 11, "s"], "ello wor");
			expect(patch1.compose(patch2)).toEqual(result);
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
			const patch1 = new Patch([5, "oo", 11], "");
			const patch2 = new Patch([5, 7, 13], "oo");
			const result = new Patch([11], "");
			expect(patch1.compose(patch2)).toEqual(result);
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
			const patch1 = new Patch([5, 6, 11], " ");
			const patch2 = new Patch([5, "_", 10], "");
			const result = new Patch([5, 6, "_", 11], " ");
			expect(patch1.compose(patch2)).toEqual(result);
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
			const patch1 = new Patch([2, 9, 11], "llo wor");
			const patch2 = new Patch([3, 4, "lo"], "d");
			const result = new Patch([2, 9, 10, 11, "lo"], "llo word");
			expect(patch1.compose(patch2)).toEqual(result);
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
			const patch1 = new Patch([5, 11], " world");
			const patch2 = new Patch([5, " world"], "");
			const result = new Patch([11], "");
			expect(patch1.compose(patch2)).toEqual(result);
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
			const patch1 = new Patch([5, 11], " world");
			const patch2 = new Patch([5, " word"], "");
			const result = new Patch([9, 11, "d"], "ld");
			expect(patch1.compose(patch2)).toEqual(result);
		});

		test("compose 7", () => {
			const patch1 = new Patch([5, 6, 11], " ");
			const patch2 = new Patch([5, "_", 10], "");
			const result = new Patch([5, 6, "_", 11], " ");
			expect(patch1.compose(patch2)).toEqual(result);
		});

		test("compose 8", () => {
			const patch1 = new Patch([5, 6, 11], " ");
			const patch2 = new Patch([5, " ", 10], "");
			const result = new Patch([11], "");
			expect(patch1.compose(patch2)).toEqual(result);
		});

		test("compose 9", () => {
			// s0: "hello world"
			// d1:  =====-=====
			//           "__"
			// i1:  ======++=====
			// s1: "hello__world"
			// d2:  =====--=====
			//            "    "
			// i2:  =======++++=====
			// s2: "hello    world"
			const patch1 = new Patch([5, 6, "__", 11], " ");
			const patch2 = new Patch([5, 7, "    ", 12], "__");
			const result = new Patch([6, "   ", 11], "");
			expect(patch1.compose(patch2)).toEqual(result);
		});
	});
});
