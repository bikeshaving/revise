// TODO: use this
import {Subseq} from "./subseq";

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

/**
 * Given two subseqs and strings which are represented by the included segments
 * of the subseqs, this function combines the two strings so that they overlap
 * according to the positions of the included segments of subseqs.
 *
 * The subseqs must have the same size, and the included segments of these
 * subseqs may not overlap.
 */
function consolidate(
	subseq1: Subseq,
	str1: string,
	subseq2: Subseq,
	str2: string,
): string {
	let i1 = 0;
	let i2 = 0;
	let result = "";
	for (const [size, flag1, flag2] of subseq1.align(subseq2)) {
		if (flag1 && flag2) {
			throw new Error("Overlapping subseqs");
		} else if (flag1) {
			result += str1.slice(i1, size);
			i1 += size;
		} else if (flag2) {
			result += str2.slice(i2, size);
			i2 += size;
		}
	}

	return result;
}

/**
 * Given two subseqs as well a string which is represented by the included
 * segments of the first subseq, this function returns the result of removing
 * the included segments of the second subseq from the first subseq.
 *
 * The subseqs must have the same size, and the included segments of the second
 * subseq must overlap with the first subseq’s included segments.
 */
function erase(subseq1: Subseq, str: string, subseq2: Subseq): string {
	let i = 0;
	let result = "";
	for (const [size, flag1, flag2] of subseq1.align(subseq2)) {
		if (flag1) {
			if (!flag2) {
				result += str.slice(i, i + size);
			}

			i += size;
		} else if (flag2) {
			throw new Error("Non-overlapping subseqs");
		}
	}

	return result;
}

/**
 * Returns the length of the common prefix of two strings.
 */
function commonPrefixLength(str1: string, str2: string): number {
	const length = Math.min(str1.length, str2.length);
	for (let i = 0; i < length; i++) {
		if (str1[i] !== str2[i]) {
			return i;
		}
	}

	return length;
}

/**
 * Given two subseqs and two strings which are represented by the included
 * segments of the subseqs, this function finds the overlapping common prefixes
 * of the first and second strings and returns two subseqs which represents
 * these overlapping sequences.
 *
 * The subseqs must have the same size, and may not overlap. These subseqs are
 * typically produced from two interleaved subseqs.
 */
function overlapping(
	subseq1: Subseq,
	str1: string,
	subseq2: Subseq,
	str2: string,
): [Subseq, Subseq] {
	let i1 = 0;
	let i2 = 0;
	let prevLength = 0;
	let prevFlag1 = false;
	const sizes1: Array<number> = [];
	const sizes2: Array<number> = [];
	for (const [size, flag1, flag2] of subseq1.align(subseq2)) {
		if (flag1 && flag2) {
			throw new Error("Overlapping subseqs");
		}
		if (prevFlag1 && flag2) {
			const prefix = commonPrefixLength(
				str1.slice(i1, prevLength),
				str2.slice(i2, size),
			);
			Subseq.pushSegment(sizes1, prefix, true);
			Subseq.pushSegment(sizes1, prevLength - prefix, false);
			Subseq.pushSegment(sizes2, prefix, true);
			Subseq.pushSegment(sizes2, size - prefix, false);
		} else {
			Subseq.pushSegment(sizes1, prevLength, false);
			Subseq.pushSegment(sizes2, size, false);
		}

		if (prevFlag1) {
			i1 += prevLength;
		}

		if (flag2) {
			i2 += size;
		}

		prevLength = size;
		prevFlag1 = flag1;
	}

	Subseq.pushSegment(sizes1, prevLength, false);
	return [new Subseq(sizes1), new Subseq(sizes2)];
}

export class Patch {
	parts: Array<string | number>;
	deleted?: string;
	constructor(parts: Array<string | number>, deleted?: string) {
		this.parts = parts;
		this.deleted = deleted;
	}

	static synthesize(
		insertSeq: Subseq,
		inserted: string,
		deleteSeq: Subseq,
		deleted?: string | undefined,
	): Patch {
		const parts: Array<string | number> = [];
		let insertOffset = 0;
		let retainOffset = 0;
		let prevDeleting = false;
		let prevInserting = false;
		for (const [size, deleting, inserting] of deleteSeq
			.expand(insertSeq)
			.align(insertSeq)) {
			if (inserting) {
				if (!prevDeleting) {
					parts.push(retainOffset);
				}

				const str = inserted.slice(insertOffset, insertOffset + size);
				parts.push(str);
				insertOffset += size;
			} else {
				if (deleting) {
					parts.push(retainOffset, retainOffset + size);
				}

				retainOffset += size;
			}

			prevDeleting = deleting;
			prevInserting = inserting;
		}

		if (insertOffset !== inserted.length) {
			throw new Error("Length mismatch");
		}

		if (!prevInserting && !prevDeleting) {
			parts.push(retainOffset);
		}

		return new Patch(parts, deleted);
	}

	static build(
		text: string,
		inserted: string,
		from: number,
		to: number = from,
	): Patch {
		const insertSizes: Array<number> = [];
		const deleteSizes: Array<number> = [];
		Subseq.pushSegment(insertSizes, from, false);
		Subseq.pushSegment(insertSizes, to - from, false);
		Subseq.pushSegment(insertSizes, inserted.length, true);
		Subseq.pushSegment(insertSizes, text.length - to, false);
		Subseq.pushSegment(deleteSizes, from, false);
		Subseq.pushSegment(deleteSizes, to - from, true);
		Subseq.pushSegment(deleteSizes, text.length - to, false);
		const deleted = text.slice(from, to);
		return Patch.synthesize(
			new Subseq(insertSizes),
			inserted,
			new Subseq(deleteSizes),
			deleted,
		);
	}

	static diff(oldText: string, newText: string): void {
		const minLength = Math.min(oldText.length, newText.length);
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

	factor(): [Subseq, string, Subseq, string | undefined] {
		const operations = this.operations();
		const insertSizes: Array<number> = [];
		const deleteSizes: Array<number> = [];
		let inserted = "";
		for (let i = 0; i < operations.length; i++) {
			const op = operations[i];
			switch (op.type) {
				case "retain":
					Subseq.pushSegment(insertSizes, op.end - op.start, false);
					Subseq.pushSegment(deleteSizes, op.end - op.start, false);
					break;
				case "delete":
					Subseq.pushSegment(insertSizes, op.end - op.start, false);
					Subseq.pushSegment(deleteSizes, op.end - op.start, true);
					break;
				case "insert":
					Subseq.pushSegment(insertSizes, op.value.length, true);
					inserted += op.value;
					break;
				default:
					throw new TypeError("Invalid operation type");
			}
		}

		const insertSeq = new Subseq(insertSizes);
		const deleteSeq = new Subseq(deleteSizes);
		return [insertSeq, inserted, deleteSeq, this.deleted];
	}

	/**
	 * Composes two consecutive patches.
	 */
	compose(that: Patch): Patch {
		let [insertSeq1, inserted1, deleteSeq1, deleted1] = this.factor();
		let [insertSeq2, inserted2, deleteSeq2, deleted2] = that.factor();
		// Expand all subseqs so that they share the same coordinate space.
		deleteSeq1 = deleteSeq1.expand(insertSeq1);
		deleteSeq2 = deleteSeq2.expand(deleteSeq1);
		[deleteSeq1, insertSeq2] = deleteSeq1.interleave(insertSeq2);
		deleteSeq2 = deleteSeq2.expand(insertSeq2);
		insertSeq1 = insertSeq1.expand(insertSeq2);

		// Find insertions which have been deleted and remove them.
		{
			const toggleSeq = insertSeq1.intersection(deleteSeq2);
			if (toggleSeq.includedSize) {
				deleteSeq1 = deleteSeq1.shrink(toggleSeq);
				inserted1 = erase(insertSeq1, inserted1, toggleSeq);
				insertSeq1 = insertSeq1.shrink(toggleSeq);
				deleteSeq2 = deleteSeq2.shrink(toggleSeq);
				insertSeq2 = insertSeq2.shrink(toggleSeq);
			}
		}

		// Find deletions which have been re-inserted and remove them.
		if (deleted1 != null) {
			const [deleteOverlap, insertOverlap] = overlapping(
				deleteSeq1,
				deleted1,
				insertSeq2,
				inserted2,
			);
			if (deleteOverlap.includedSize) {
				deleted1 = erase(deleteSeq1, deleted1, deleteOverlap);
				inserted2 = erase(insertSeq2, inserted2, insertOverlap);
				deleteSeq1 = deleteSeq1.difference(deleteOverlap).shrink(insertOverlap);
				insertSeq1 = insertSeq1.shrink(insertOverlap);
				deleteSeq2 = deleteSeq2.shrink(insertOverlap);
				insertSeq2 = insertSeq2.shrink(insertOverlap);
			}
		}

		const insertSeq = insertSeq1.union(insertSeq2);
		const inserted = consolidate(insertSeq1, inserted1, insertSeq2, inserted2);
		const deleteSeq = deleteSeq1.union(deleteSeq2).shrink(insertSeq);
		const deleted =
			deleted1 != null && deleted2 != null
				? consolidate(deleteSeq1, deleted1, deleteSeq2, deleted2)
				: undefined;
		return Patch.synthesize(insertSeq, inserted, deleteSeq, deleted);
	}
}
