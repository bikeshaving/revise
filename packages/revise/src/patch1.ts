// TODO: use this
import {Subseq1} from "./subseq1";

export interface RetainOperation {
	type: "retain";
	start: number;
	end: number;
}

export interface DeleteOperation {
	type: "delete";
	start: number;
	end: number;
	value?: string;
}

export interface InsertOperation {
	type: "insert";
	start: number;
	value: string;
}

export type Operation = RetainOperation | DeleteOperation | InsertOperation;
// Should we make insertSeqs and deleteSeqs the same length
// Pros:
// - Can create patches with toggle operations
// - Don’t need to expand the deleteSeq by the insertSeq
//
// Cons:
// - Can create patches with toggle operations
// - Ambiguity between whether deletes or insertions can occur in the same position
export class Patch1 {
	parts: Array<string | number>;
	constructor(
		parts: Array<string | number>,
	) {
		this.parts = parts;
	}

	static synthesize(
		insertSeq: Subseq1,
		deleteSeq: Subseq1,
		inserted: string,
		deleted?: string,
	): Patch1 {
		const parts: Array<string | number> = [];
		let insertOffset = 0;
		let retainOffset = 0;
		let prevDeleting = false;
		let prevInserting = false;
		deleteSeq
			.expand(insertSeq)
			.align(insertSeq, (length, deleting, inserting) => {
				if (inserting) {
					if (!prevDeleting) {
						parts.push(retainOffset);
					}

					const text = inserted.slice(insertOffset, insertOffset + length);
					parts.push(text);
					insertOffset += length;
				} else {
					if (deleting) {
						parts.push(retainOffset, retainOffset + length);
					}

					retainOffset += length;
				}

				prevDeleting = deleting;
				prevInserting = inserting;
			});

		if (insertOffset !== inserted.length) {
			throw new Error("Length mismatch");
		}

		if (!prevInserting && !prevDeleting) {
			parts.push(retainOffset);
		}

		return new Patch1(parts);
	}

	get operations(): Array<Operation> {
		const result: Array<Operation> = [];
		let insertOffset = 0;
		let retainOffset = 0;
		let retaining = true;
		for (let i = 0; i < this.parts.length; i++) {
			const part = this.parts[i];
			if (typeof part === "number") {
				if (retaining) {
					if (part < retainOffset) {
						throw new Error("Malformed patch");
					} else if (part > retainOffset) {
						result.push({type: "retain", start: retainOffset, end: part});
						insertOffset = part;
						retainOffset = part;
					}

					retaining = false;
				} else {
					if (part <= retainOffset) {
						throw new Error("Malformed patch");
					}

					result.push({type: "delete", start: retainOffset, end: part});
					insertOffset = retainOffset;
					retainOffset = part;
					retaining = true;
				}
			} else if (typeof part === "string") {
				result.push({type: "insert", start: insertOffset, value: part});
				insertOffset = retainOffset;
				retaining = true;
			} else {
				throw new TypeError("Malformed patch");
			}
		}

		return result;
	}
}
