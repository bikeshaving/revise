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

test.run();
