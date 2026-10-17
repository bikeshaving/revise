import {suite} from "uvu";
import * as Assert from "uvu/assert";
import fc from "fast-check";

import {Edit} from "../src/edit.js";
import {Keyer} from "../src/keyer.js";

const test = suite("Keyer");
test("keyAt/transform", () => {
	const keyer = new Keyer();

	const key1 = keyer.keyAt(0);
	const key2 = keyer.keyAt(3);
	const key3 = keyer.keyAt(6);
	const key4 = keyer.keyAt(9);

	const keys1 = new Map([
		[0, key1],
		[3, key2],
		[6, key3],
		[9, key4],
	]);

	Assert.equal(keyer.keys, keys1);
	// "01\n34\n 67\n90"
	//          ^
	// "01\n34\n\n67\n90"
	// Initial simulated text would be "01\n34\n67\n90" (based on positions 0,3,6,9)
	const edit = Edit.builder("01\n34\n67\n90")
		.retain(6)
		.insert("\n")
		.retain(4)
		.build();

	keyer.transform(edit);
	const keys2 = new Map([
		[0, key1],
		[3, key2],
		[7, key3],
		[10, key4],
	]);

	Assert.equal(keyer.keys, keys2);
	const key5 = keyer.keyAt(6);
	keys2.set(6, key5);

	Assert.equal(keyer.keys, keys2);
	// After previous transform and key5 addition, simulated text would be "01\n34\n\n67\n90"
	const edit1 = Edit.builder("01\n34\n\n67\n90")
		.retain(5)
		.delete(2)
		.retain(4)
		.build();

	keyer.transform(edit1);
	const keys3 = new Map([
		[0, key1],
		[3, key2],
		[8, key4],
	]);
	Assert.equal(keyer.keys, keys3);
});

class MapKeyer {
	nextKey = 0;
	keys = new Map<number, number>();

	keyAt(i: number): number {
		if (!this.keys.has(i)) {
			this.keys.set(i, this.nextKey++);
		}

		return this.keys.get(i)!;
	}

	transform(edit: Edit): void {
		const operations = edit.operations();
		for (let i = operations.length - 1; i >= 0; i--) {
			const op = operations[i];
			const keys = new Map<number, number>();
			if (op.type === "delete") {
				const length = op.end - op.start;
				this.keys.forEach((key, index) => {
					if (index <= op.start) {
						keys.set(index, key);
					} else if (index > op.end) {
						keys.set(index - length, key);
					}
				});
				this.keys = keys;
			} else if (op.type === "insert") {
				this.keys.forEach((key, index) => {
					keys.set(index >= op.start ? index + op.value.length : index, key);
				});
				this.keys = keys;
			}
		}
	}
}

const step = fc.oneof(
	fc.record({type: fc.constant("keyAt" as const), at: fc.nat(40)}),
	fc.record({
		type: fc.constant("edit" as const),
		ops: fc.array(
			fc.tuple(
				fc.constantFrom("retain", "insert", "delete"),
				fc.integer({min: 1, max: 6}),
			),
			{maxLength: 6},
		),
	}),
);

test("matches a map-based reference", () => {
	fc.assert(
		fc.property(fc.array(step, {maxLength: 40}), (steps) => {
			const keyer = new Keyer();
			const reference = new MapKeyer();
			let length = 20;
			for (const s of steps) {
				if (s.type === "keyAt") {
					const at = Math.min(s.at, length);
					Assert.is(keyer.keyAt(at), reference.keyAt(at));
				} else {
					const builder = Edit.builder("x".repeat(length));
					let remaining = length;
					for (const [type, n] of s.ops) {
						if (type === "insert") {
							builder.insert("y".repeat(n));
							length += n;
						} else if (remaining > 0) {
							const k = Math.min(n, remaining);
							remaining -= k;
							if (type === "retain") {
								builder.retain(k);
							} else {
								builder.delete(k);
								length -= k;
							}
						}
					}

					const edit = builder.build();
					keyer.transform(edit);
					reference.transform(edit);
				}

				Assert.equal(keyer.keys, reference.keys);
			}
		}),
		{numRuns: 500},
	);
});

test.run();
