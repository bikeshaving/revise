import type {Edit} from "./edit.js";

export class Keyer {
	nextKey: number;
	keys: Map<number, number>;

	// TODO: Accept a custom key function.
	constructor() {
		this.nextKey = 0;
		this.keys = new Map();
	}

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
			switch (op.type) {
				case "delete": {
					for (let j = op.start + 1; j <= op.end; j++) {
						this.keys.delete(j);
					}
					// Adjust keys after the deleted range
					this.keys = adjustKeysAfterDelete(
						this.keys,
						op.start,
						op.end - op.start,
					);
					break;
				}
				case "insert": {
					// Shift keys after the insertion point
					this.keys = shiftKeysAfterInsert(
						this.keys,
						op.start,
						op.value.length,
					);
					break;
				}
			}
		}
	}
}

function adjustKeysAfterDelete(
	keys: Map<number, number>,
	start: number,
	length: number,
): Map<number, number> {
	const newKeys = new Map<number, number>();
	keys.forEach((value, key) => {
		if (key > start) {
			newKeys.set(key - length, value);
		} else {
			newKeys.set(key, value);
		}
	});
	return newKeys;
}

function shiftKeysAfterInsert(
	keys: Map<number, number>,
	start: number,
	length: number,
): Map<number, number> {
	const newKeys = new Map<number, number>();
	keys.forEach((value, key) => {
		if (key >= start) {
			newKeys.set(key + length, value);
		} else {
			newKeys.set(key, value);
		}
	});
	return newKeys;
}
