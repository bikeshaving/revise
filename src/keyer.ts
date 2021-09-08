import type {Patch} from "./patch";

export class Keyer {
	nextKey: number;
	keys: Array<number>;

	constructor(length: number = 0) {
		this.nextKey = 0;
		this.keys = new Array(length);
	}

	keyOf(i: number): number {
		// TODO: maybe we can use `in`
		if (typeof this.keys[i] === "undefined") {
			this.keys[i] = this.nextKey++;
		}

		return this.keys[i];
	}

	push(patch: Patch): void {
		for (let i = patch.operations.length - 1; i >= 0; i--) {
			const op = patch.operations[i];
			// TODO: Is this correct?
			switch (op.type) {
				case "delete":
					this.keys.splice(op.start + 1, op.end - op.start);
					break;
				case "insert":
					// We use slice and concat rather than splice(op.start, 0, ...new
					// Array(op.value.length) because the latter seems to fill in added
					// indices with undefined rather than leaving the array sparse.
					this.keys.length = Math.max(this.keys.length, op.start + 1);
					this.keys = this.keys
						.slice(0, op.start + 1)
						.concat(new Array(op.value.length))
						.concat(this.keys.slice(op.start + 1));
					break;
			}
		}
	}
}
