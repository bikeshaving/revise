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

test("apply: retained characters are preserved from base", () => {
	fc.assert(
		fc.property(
			fc.string({minLength: 0, maxLength: 20}).chain((base) =>
				arbitraryEdit(base).map((edit) => ({base, edit})),
			),
			({base, edit}) => {
				const result = edit.apply(base);
				// Walk operations: retained spans must appear verbatim in output
				let srcPos = 0;
				let outPos = 0;
				for (const op of edit.operations()) {
					switch (op.type) {
						case "retain": {
							const len = op.end - op.start;
							Assert.is(
								result.slice(outPos, outPos + len),
								base.slice(srcPos, srcPos + len),
							);
							srcPos += len;
							outPos += len;
							break;
						}
						case "delete":
							srcPos += op.end - op.start;
							break;
						case "insert":
							outPos += op.value.length;
							break;
					}
				}
			},
		),
		{numRuns: 2000},
	);
});

test("apply: inserted text appears verbatim in output", () => {
	fc.assert(
		fc.property(
			fc.string({minLength: 0, maxLength: 20}).chain((base) =>
				arbitraryEdit(base).map((edit) => ({base, edit})),
			),
			({base, edit}) => {
				const result = edit.apply(base);
				let outPos = 0;
				for (const op of edit.operations()) {
					switch (op.type) {
						case "retain":
							outPos += op.end - op.start;
							break;
						case "delete":
							break;
						case "insert":
							Assert.is(
								result.slice(outPos, outPos + op.value.length),
								op.value,
							);
							outPos += op.value.length;
							break;
					}
				}
			},
		),
		{numRuns: 2000},
	);
});

test("apply: deleted text matches base at the given positions", () => {
	fc.assert(
		fc.property(
			fc.string({minLength: 0, maxLength: 20}).chain((base) =>
				arbitraryEdit(base).map((edit) => ({base, edit})),
			),
			({base, edit}) => {
				for (const op of edit.operations()) {
					if (op.type === "delete") {
						Assert.is(
							base.slice(op.start, op.end),
							op.value,
						);
					}
				}
			},
		),
		{numRuns: 2000},
	);
});

test("apply: pure insert edit prepends/appends without losing base", () => {
	fc.assert(
		fc.property(
			fc.string({minLength: 0, maxLength: 20}),
			fc.string({minLength: 1, maxLength: 10}),
			fc.boolean(),
			(base, text, atEnd) => {
				const builder = Edit.builder(base);
				if (atEnd) {
					builder.retain(base.length).insert(text);
				} else {
					builder.insert(text).retain(base.length);
				}
				const result = builder.build().apply(base);
				Assert.is(result, atEnd ? base + text : text + base);
			},
		),
		{numRuns: 1000},
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

// --- operations / builder roundtrip ---

test("operations: rebuild from operations matches apply", () => {
	fc.assert(
		fc.property(
			fc.string({minLength: 0, maxLength: 20}).chain((base) =>
				arbitraryEdit(base).map((edit) => ({base, edit})),
			),
			({base, edit}) => {
				const builder = Edit.builder(base);
				for (const op of edit.operations()) {
					switch (op.type) {
						case "retain":
							builder.retain(op.end - op.start);
							break;
						case "delete":
							builder.delete(op.end - op.start);
							break;
						case "insert":
							builder.insert(op.value);
							break;
					}
				}
				Assert.is(builder.build().apply(base), edit.apply(base));
			},
		),
		{numRuns: 2000},
	);
});

// --- diff cross-method ---

test("diff + invert: diff(a, b).invert().apply(b) === a", () => {
	fc.assert(
		fc.property(
			fc.string({minLength: 0, maxLength: 20}),
			fc.string({minLength: 0, maxLength: 20}),
			(a, b) => {
				Assert.is(Edit.diff(a, b).invert().apply(b), a);
			},
		),
		{numRuns: 2000},
	);
});

test("diff + compose: diff(a, b).compose(diff(b, c)).apply(a) === c", () => {
	fc.assert(
		fc.property(
			fc.string({minLength: 0, maxLength: 15}),
			fc.string({minLength: 0, maxLength: 15}),
			fc.string({minLength: 0, maxLength: 15}),
			(a, b, c) => {
				Assert.is(Edit.diff(a, b).compose(Edit.diff(b, c)).apply(a), c);
			},
		),
		{numRuns: 2000},
	);
});

// --- invert cross-method ---

test("invert + compose: edit.invert().compose(edit.invert().invert()) is identity", () => {
	fc.assert(
		fc.property(
			fc.string({minLength: 0, maxLength: 20}).chain((base) =>
				arbitraryEdit(base).map((edit) => ({base, edit})),
			),
			({base, edit}) => {
				const mid = edit.apply(base);
				const inv = edit.invert();
				const composed = inv.compose(inv.invert());
				Assert.is(composed.apply(mid), mid);
			},
		),
		{numRuns: 2000},
	);
});

// --- transform cross-method ---

test("transform + invert: A'.invert() undoes A' on B's output", () => {
	fc.assert(
		fc.property(arbitraryConcurrentEdits(), ({base, editA, editB}) => {
			const [_aPrime, bPrime] = editA.transform(editB);
			const afterA = editA.apply(base);
			const converged = bPrime.apply(afterA);
			Assert.is(bPrime.invert().apply(converged), afterA);
		}),
		{numRuns: 2000},
	);
});

test("transform + compose + invert: round-trip through transform", () => {
	fc.assert(
		fc.property(arbitraryConcurrentEdits(), ({base, editA, editB}) => {
			const [_aPrime, bPrime] = editA.transform(editB);
			// Going forward via A then B' and back via B'.invert() lands on A's output
			const pathAB = editA.compose(bPrime);
			const roundTrip = pathAB.compose(bPrime.invert());
			Assert.is(roundTrip.apply(base), editA.apply(base));
		}),
		{numRuns: 2000},
	);
});

// --- normalize cross-method ---

test("normalize + compose: normalizing inputs doesn't change compose result", () => {
	fc.assert(
		fc.property(
			fc.string({minLength: 0, maxLength: 20}).chain((base) =>
				arbitraryEdit(base).chain((edit1) => {
					const mid = edit1.apply(base);
					return arbitraryEdit(mid).map((edit2) => ({base, edit1, edit2}));
				}),
			),
			({base, edit1, edit2}) => {
				const raw = edit1.compose(edit2);
				const normalized = edit1.normalize().compose(edit2.normalize());
				Assert.is(raw.apply(base), normalized.apply(base));
			},
		),
		{numRuns: 2000},
	);
});

test("normalize + invert: normalizing before invert doesn't change result", () => {
	fc.assert(
		fc.property(
			fc.string({minLength: 0, maxLength: 20}).chain((base) =>
				arbitraryEdit(base).map((edit) => ({base, edit})),
			),
			({base, edit}) => {
				const raw = edit.invert().apply(edit.apply(base));
				const normalized = edit.normalize().invert().apply(edit.normalize().apply(base));
				Assert.is(raw, base);
				Assert.is(normalized, base);
			},
		),
		{numRuns: 2000},
	);
});

test.run();
