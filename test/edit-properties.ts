import {suite} from "uvu";
import * as Assert from "uvu/assert";
import fc from "fast-check";
import {Edit} from "../src/edit";

const test = suite("Edit properties");

/**
 * Arbitrary that generates a random Edit against a given base string.
 * Tracks remaining base characters to ensure valid edits.
 */
function arbitraryEdit(base: string): fc.Arbitrary<Edit> {
	// Generate a list of operations as data, then build the edit
	const op = fc.oneof(
		fc.record({
			type: fc.constant("retain" as const),
			length: fc.integer({min: 1, max: 10}),
		}),
		fc.record({
			type: fc.constant("insert" as const),
			value: fc.string({minLength: 1, maxLength: 8}),
		}),
		fc.record({
			type: fc.constant("delete" as const),
			length: fc.integer({min: 1, max: 10}),
		}),
	);

	return fc.array(op, {minLength: 0, maxLength: 8}).map((ops) => {
		const builder = Edit.builder(base);
		let remaining = base.length;
		for (const o of ops) {
			switch (o.type) {
				case "retain": {
					const len = Math.min(o.length, remaining);
					if (len > 0) {
						builder.retain(len);
						remaining -= len;
					}
					break;
				}
				case "insert":
					builder.insert(o.value);
					break;
				case "delete": {
					const len = Math.min(o.length, remaining);
					if (len > 0) {
						builder.delete(len);
						remaining -= len;
					}
					break;
				}
			}
		}
		return builder.build();
	});
}

/** Arbitrary that generates a base string and two concurrent edits. */
function arbitraryConcurrentEdits(): fc.Arbitrary<{base: string; editA: Edit; editB: Edit}> {
	return fc.string({minLength: 0, maxLength: 20}).chain((base) =>
		fc.tuple(arbitraryEdit(base), arbitraryEdit(base)).map(([editA, editB]) => ({
			base,
			editA,
			editB,
		})),
	);
}

test("transform convergence (TP1)", () => {
	fc.assert(
		fc.property(arbitraryConcurrentEdits(), ({base, editA, editB}) => {
			const [aPrime, bPrime] = editA.transform(editB);
			const resultAB = bPrime.apply(editA.apply(base));
			const resultBA = aPrime.apply(editB.apply(base));
			Assert.is(resultAB, resultBA);
		}),
		{numRuns: 2000},
	);
});

test("transform with compose convergence", () => {
	fc.assert(
		fc.property(arbitraryConcurrentEdits(), ({base, editA, editB}) => {
			const [aPrime, bPrime] = editA.transform(editB);
			const pathAB = editA.compose(bPrime);
			const pathBA = editB.compose(aPrime);
			Assert.is(pathAB.apply(base), pathBA.apply(base));
		}),
		{numRuns: 2000},
	);
});

test("transform identity: transform(id, B) produces convergent results", () => {
	fc.assert(
		fc.property(
			fc.string({minLength: 0, maxLength: 20}).chain((base) =>
				arbitraryEdit(base).map((edit) => ({base, edit})),
			),
			({base, edit}) => {
				const identity = new Edit([base.length]);
				const [aPrime, bPrime] = identity.transform(edit);
				Assert.is(aPrime.apply(edit.apply(base)), bPrime.apply(base));
			},
		),
		{numRuns: 1000},
	);
});

test("transform convergence holds for both argument orderings", () => {
	fc.assert(
		fc.property(arbitraryConcurrentEdits(), ({base, editA, editB}) => {
			// A.transform(B) converges
			const [aPrime, bPrime] = editA.transform(editB);
			Assert.is(
				bPrime.apply(editA.apply(base)),
				aPrime.apply(editB.apply(base)),
			);
			// B.transform(A) also converges (with B getting left priority)
			const [bPrime2, aPrime2] = editB.transform(editA);
			Assert.is(
				aPrime2.apply(editB.apply(base)),
				bPrime2.apply(editA.apply(base)),
			);
		}),
		{numRuns: 2000},
	);
});

test("transform then apply produces valid string", () => {
	fc.assert(
		fc.property(arbitraryConcurrentEdits(), ({base, editA, editB}) => {
			const [_aPrime, bPrime] = editA.transform(editB);
			const result = bPrime.apply(editA.apply(base));
			Assert.type(result, "string");
		}),
		{numRuns: 1000},
	);
});

// --- apply ---

test("apply: identity edit preserves string", () => {
	fc.assert(
		fc.property(fc.string({minLength: 0, maxLength: 50}), (base) => {
			const identity = new Edit([base.length]);
			Assert.is(identity.apply(base), base);
		}),
		{numRuns: 1000},
	);
});

test("apply: edit produces string of expected length", () => {
	fc.assert(
		fc.property(
			fc.string({minLength: 0, maxLength: 20}).chain((base) =>
				arbitraryEdit(base).map((edit) => ({base, edit})),
			),
			({base, edit}) => {
				const result = edit.apply(base);
				const expectedLen = base.length - edit.deleted.length + edit.inserted.length;
				Assert.is(result.length, expectedLen);
			},
		),
		{numRuns: 2000},
	);
});

// --- invert ---

test("invert: edit.invert().apply(edit.apply(s)) === s", () => {
	fc.assert(
		fc.property(
			fc.string({minLength: 0, maxLength: 20}).chain((base) =>
				arbitraryEdit(base).map((edit) => ({base, edit})),
			),
			({base, edit}) => {
				const inverted = edit.invert();
				Assert.is(inverted.apply(edit.apply(base)), base);
			},
		),
		{numRuns: 2000},
	);
});

test("invert: double invert is identity", () => {
	fc.assert(
		fc.property(
			fc.string({minLength: 0, maxLength: 20}).chain((base) =>
				arbitraryEdit(base).map((edit) => ({base, edit})),
			),
			({base, edit}) => {
				const result = edit.invert().invert().apply(base);
				Assert.is(result, edit.apply(base));
			},
		),
		{numRuns: 2000},
	);
});

test("invert: swaps inserted and deleted", () => {
	fc.assert(
		fc.property(
			fc.string({minLength: 0, maxLength: 20}).chain((base) =>
				arbitraryEdit(base).map((edit) => ({base, edit})),
			),
			({base, edit}) => {
				const inverted = edit.invert();
				Assert.is(inverted.inserted, edit.deleted);
				Assert.is(inverted.deleted, edit.inserted);
			},
		),
		{numRuns: 1000},
	);
});

// --- compose ---

test("compose: sequential apply equals composed apply", () => {
	fc.assert(
		fc.property(
			fc.string({minLength: 0, maxLength: 20}).chain((base) =>
				arbitraryEdit(base).chain((edit1) => {
					const mid = edit1.apply(base);
					return arbitraryEdit(mid).map((edit2) => ({base, edit1, edit2}));
				}),
			),
			({base, edit1, edit2}) => {
				const composed = edit1.compose(edit2);
				Assert.is(composed.apply(base), edit2.apply(edit1.apply(base)));
			},
		),
		{numRuns: 2000},
	);
});

test("compose: composing with identity is no-op", () => {
	fc.assert(
		fc.property(
			fc.string({minLength: 0, maxLength: 20}).chain((base) =>
				arbitraryEdit(base).map((edit) => ({base, edit})),
			),
			({base, edit}) => {
				const mid = edit.apply(base);
				const identity = new Edit([mid.length]);
				const composed = edit.compose(identity);
				Assert.is(composed.apply(base), edit.apply(base));
			},
		),
		{numRuns: 1000},
	);
});

test("compose: identity composed with edit equals edit", () => {
	fc.assert(
		fc.property(
			fc.string({minLength: 0, maxLength: 20}).chain((base) =>
				arbitraryEdit(base).map((edit) => ({base, edit})),
			),
			({base, edit}) => {
				const identity = new Edit([base.length]);
				const composed = identity.compose(edit);
				Assert.is(composed.apply(base), edit.apply(base));
			},
		),
		{numRuns: 1000},
	);
});

test("compose: associativity", () => {
	fc.assert(
		fc.property(
			fc.string({minLength: 0, maxLength: 15}).chain((base) =>
				arbitraryEdit(base).chain((edit1) => {
					const s1 = edit1.apply(base);
					return arbitraryEdit(s1).chain((edit2) => {
						const s2 = edit2.apply(s1);
						return arbitraryEdit(s2).map((edit3) => ({base, edit1, edit2, edit3}));
					});
				}),
			),
			({base, edit1, edit2, edit3}) => {
				const leftAssoc = edit1.compose(edit2).compose(edit3);
				const rightAssoc = edit1.compose(edit2.compose(edit3));
				Assert.is(leftAssoc.apply(base), rightAssoc.apply(base));
			},
		),
		{numRuns: 2000},
	);
});

// --- compose + invert ---

test("compose with invert: edit.compose(edit.invert()) is identity", () => {
	fc.assert(
		fc.property(
			fc.string({minLength: 0, maxLength: 20}).chain((base) =>
				arbitraryEdit(base).map((edit) => ({base, edit})),
			),
			({base, edit}) => {
				const composed = edit.compose(edit.invert());
				Assert.is(composed.apply(base), base);
			},
		),
		{numRuns: 2000},
	);
});

// --- diff ---

test("diff: diff(a, b).apply(a) === b", () => {
	fc.assert(
		fc.property(
			fc.string({minLength: 0, maxLength: 20}),
			fc.string({minLength: 0, maxLength: 20}),
			(a, b) => {
				const edit = Edit.diff(a, b);
				Assert.is(edit.apply(a), b);
			},
		),
		{numRuns: 2000},
	);
});

test("diff: diff(a, a) is identity", () => {
	fc.assert(
		fc.property(fc.string({minLength: 0, maxLength: 20}), (a) => {
			const edit = Edit.diff(a, a);
			Assert.is(edit.apply(a), a);
			Assert.is(edit.inserted, "");
			Assert.is(edit.deleted, "");
		}),
		{numRuns: 1000},
	);
});

// --- normalize ---

test("normalize: normalized edit produces same result", () => {
	fc.assert(
		fc.property(
			fc.string({minLength: 0, maxLength: 20}).chain((base) =>
				arbitraryEdit(base).map((edit) => ({base, edit})),
			),
			({base, edit}) => {
				Assert.is(edit.normalize().apply(base), edit.apply(base));
			},
		),
		{numRuns: 2000},
	);
});

test("normalize: double normalize is idempotent", () => {
	fc.assert(
		fc.property(
			fc.string({minLength: 0, maxLength: 20}).chain((base) =>
				arbitraryEdit(base).map((edit) => ({base, edit})),
			),
			({base, edit}) => {
				const once = edit.normalize();
				const twice = once.normalize();
				Assert.equal(once.parts, twice.parts);
			},
		),
		{numRuns: 1000},
	);
});

test.run();
