// TODO: use this
import {appendSegment, Subseq1} from "./subseq1";

export interface RetainOperation {
	type: "retain";
	start: number;
	end: number;
}

export interface DeleteOperation {
	type: "delete";
	start: number;
	end: number;
	value?: string | undefined;
}

export interface InsertOperation {
	type: "insert";
	start: number;
	value: string;
}

export type Operation = RetainOperation | DeleteOperation | InsertOperation;

export interface FactoredPatch {
	insertSeq: Subseq1;
	deleteSeq: Subseq1;
	inserted: string;
	deleted?: string;
}

export class Patch1 {
	parts: Array<string | number>;
	deleted?: string;
	constructor(parts: Array<string | number>, deleted?: string) {
		this.parts = parts;
		this.deleted = deleted;
	}

	static synthesize(
		factored: FactoredPatch,
	): Patch1 {
		const {insertSeq, deleteSeq, inserted, deleted} = factored;
		const parts: Array<string | number> = [];
		let insertOffset = 0;
		let retainOffset = 0;
		let prevDeleting = false;
		let prevInserting = false;
		deleteSeq
			.expand(insertSeq)
			.align(insertSeq).forEach(([length, deleting, inserting]) => {
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

		return new Patch1(parts, deleted);
	}

	factor(): FactoredPatch {
		const operations = this.operations();
		const insertSegments: Array<number> = [];
		const deleteSegments: Array<number> = [];
		let inserted = "";
		for (let i = 0; i < operations.length; i++) {
			const op = operations[i];
			switch (op.type) {
				case "retain":
					appendSegment(insertSegments, op.end - op.start, false);
					appendSegment(deleteSegments, op.end - op.start, false);
					break;
				case "delete":
					appendSegment(insertSegments, op.end - op.start, false);
					appendSegment(deleteSegments, op.end - op.start, true);
					break;
				case "insert":
					appendSegment(insertSegments, op.value.length, true);
					inserted += op.value;
					break;
				default:
					throw new TypeError("Invalid operation type");
			}
		}

		const insertSeq = new Subseq1(insertSegments);
		const deleteSeq = new Subseq1(deleteSegments);
		return {insertSeq, deleteSeq, inserted, deleted: this.deleted};
	}

	operations(): Array<Operation> {
		const result: Array<Operation> = [];
		let insertOffset = 0;
		let retainOffset = 0;
		let retaining = true;
		for (let i = 0; i < this.parts.length; i++) {
			const part = this.parts[i];
			if (typeof part === "number") {
				if (retaining) {
					if (part < retainOffset) {
						throw new TypeError("Malformed patch");
					} else if (part > retainOffset) {
						result.push({type: "retain", start: retainOffset, end: part});
						insertOffset = part;
						retainOffset = part;
					}

					retaining = false;
				} else {
					if (part <= retainOffset) {
						throw new TypeError("Malformed patch");
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

	compose(that: Patch1): Patch1 {
		throw "TODO";
	}

	transform(that: Patch1): [Patch1, Patch1] {
		throw "TODO";
	}
}
