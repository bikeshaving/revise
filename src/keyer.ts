import type {Edit} from "./edit.js";

export class Keyer {
	nextKey: number;
	#indices: Array<number>;
	#keys: Array<number>;

	constructor() {
		this.nextKey = 0;
		this.#indices = [];
		this.#keys = [];
	}

	/** A snapshot of the index-to-key mapping. */
	get keys(): Map<number, number> {
		const keys = new Map<number, number>();
		for (let i = 0; i < this.#indices.length; i++) {
			keys.set(this.#indices[i], this.#keys[i]);
		}

		return keys;
	}

	keyAt(i: number): number {
		const indices = this.#indices;
		const last = indices.length - 1;
		if (last === -1 || indices[last] < i) {
			indices.push(i);
			this.#keys.push(this.nextKey);
			return this.nextKey++;
		}

		const j = lowerBound(indices, i);
		if (indices[j] === i) {
			return this.#keys[j];
		}

		indices.splice(j, 0, i);
		this.#keys.splice(j, 0, this.nextKey);
		return this.nextKey++;
	}

	transform(edit: Edit): void {
		const indices = this.#indices;
		const operations = edit.operations();
		for (let i = operations.length - 1; i >= 0; i--) {
			const op = operations[i];
			switch (op.type) {
				case "delete": {
					const length = op.end - op.start;
					const from = lowerBound(indices, op.start + 1);
					const to = lowerBound(indices, op.end + 1);
					if (to > from) {
						indices.splice(from, to - from);
						this.#keys.splice(from, to - from);
					}

					for (let j = from; j < indices.length; j++) {
						indices[j] -= length;
					}
					break;
				}
				case "insert": {
					const length = op.value.length;
					for (let j = lowerBound(indices, op.start); j < indices.length; j++) {
						indices[j] += length;
					}
					break;
				}
			}
		}
	}
}

function lowerBound(indices: Array<number>, i: number): number {
	let lo = 0;
	let hi = indices.length;
	while (lo < hi) {
		const mid = (lo + hi) >> 1;
		if (indices[mid] < i) {
			lo = mid + 1;
		} else {
			hi = mid;
		}
	}

	return lo;
}
