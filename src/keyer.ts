import type {Edit} from "./edit.js";

export class Keyer {
	nextKey: number;
	keys: Array<number>;

	// TODO: Accept a custom key function.
	constructor() {
		this.nextKey = 0;
		this.keys = [];
	}

	keyAt(i: number): number {
		// TODO: maybe we can use `in`
		if (typeof this.keys[i] === "undefined") {
			this.keys[i] = this.nextKey++;
		}

		return this.keys[i];
	}

	transform(edit: Edit): void {
		const operations = edit.operations();
		for (let i = operations.length - 1; i >= 0; i--) {
			const op = operations[i];
			switch (op.type) {
				case "delete": {
					this.keys.splice(op.start + 1, op.end - op.start);
					break;
				}
				case "insert": {
					this.keys = this.keys
						.slice(0, op.start)
						.concat(new Array(op.value.length))
						.concat(this.keys.slice(op.start));
					break;
				}
			}
		}
	}
}
