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
}

export interface InsertOperation {
	type: "insert";
	start: number;
	value: string;
}

export type Operation = RetainOperation | DeleteOperation | InsertOperation;

/**
 * An abstract type which represents positions and ranges in a string or
 * sequence.
 *
 * TODO: Does this belong in this file?
 */
export type Cursor = [number, number] | number;

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
	text1: string,
	subseq2: Subseq,
	text2: string,
): string {
	let i1 = 0;
	let i2 = 0;
	let result = "";
	for (const [size, flag1, flag2] of subseq1.align(subseq2)) {
		if (flag1 && flag2) {
			throw new Error("Overlapping subseqs");
		} else if (flag1) {
			result += text1.slice(i1, i1 + size);
			i1 += size;
		} else if (flag2) {
			result += text2.slice(i2, i2 + size);
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
 * @returns the length of the common prefix between two strings.
 */
function commonPrefixLength(text1: string, text2: string) {
	const length = Math.min(text1.length, text2.length);
	for (let i = 0; i < length; i++) {
		if (text1[i] !== text2[i]) {
			return i;
		}
	}
	return length;
}

/**
 * @returns the length of the common suffix between two strings.
 */
function commonSuffixLength(text1: string, text2: string) {
	const length1 = text1.length;
	const length2 = text2.length;
	const length = Math.min(length1, length2);
	for (let i = 0; i < length; i++) {
		if (text1[length1 - i - 1] !== text2[length2 - i - 1]) {
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
	text1: string,
	subseq2: Subseq,
	text2: string,
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
				text1.slice(i1, prevLength),
				text2.slice(i2, size),
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
				if (retainOffset > 0 && !prevDeleting) {
					parts.push(retainOffset);
				}

				const text = inserted.slice(insertOffset, insertOffset + size);
				parts.push(text);
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

	static diff(text1: string, text2: string, hint?: number): Patch {
		let prefix = commonPrefixLength(text1, text2);
		let suffix = commonSuffixLength(text1, text2);
		if (prefix + suffix > Math.min(text1.length, text2.length)) {
			// prefix and suffix overlap when edits are runs of the same character.
			if (hint !== undefined && hint > -1) {
				prefix = Math.min(prefix, hint);
			}

			// TODO: We can probably avoid the commonSuffixLength() call here in
			// favor of arithmetic.
			suffix = commonSuffixLength(text1.slice(prefix), text2.slice(prefix));
		}

		return Patch.build(
			text1,
			text2.slice(prefix, text2.length - suffix),
			prefix,
			text1.length - suffix,
		);
	}

	parts: Array<string | number>;
	deleted?: string;
	constructor(parts: Array<string | number>, deleted?: string) {
		this.parts = parts;
		this.deleted = deleted;
	}

	get inserted(): string {
		return this.factor()[1];
	}

	// This could be a getter but we do not want to incur the cost of retaining
	// the array of operations in memory.
	operations(): Array<Operation> {
		const operations: Array<Operation> = [];
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
						operations.push({type: "retain", start: retainOffset, end: part});
						insertOffset = part;
						retainOffset = part;
					}

					retaining = false;
				} else {
					if (part <= retainOffset) {
						throw new TypeError("Malformed patch");
					}

					operations.push({type: "delete", start: retainOffset, end: part});
					insertOffset = retainOffset;
					retainOffset = part;
					retaining = true;
				}
			} else if (typeof part === "string") {
				operations.push({type: "insert", start: insertOffset, value: part});
				insertOffset = retainOffset;
				retaining = true;
			} else {
				throw new TypeError("Malformed patch");
			}
		}

		return operations;
	}

	apply(text: string): string {
		let text1 = "";
		const operations = this.operations();
		for (let i = 0; i < operations.length; i++) {
			const op = operations[i];
			switch (op.type) {
				case "retain":
					text1 += text.slice(op.start, op.end);
					break;
				case "insert":
					text1 += op.value;
					break;
			}
		}

		return text1;
	}

	factor(): [Subseq, string, Subseq, string | undefined] {
		const insertSizes: Array<number> = [];
		const deleteSizes: Array<number> = [];
		let inserted = "";
		const operations = this.operations();
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

	invert(): Patch {
		if (typeof this.deleted === "undefined") {
			throw new Error("Missing deleted property");
		}

		let [insertSeq, inserted, deleteSeq, deleted] = this.factor();
		deleteSeq = deleteSeq.expand(insertSeq);
		insertSeq = insertSeq.shrink(deleteSeq);
		return Patch.synthesize(deleteSeq, deleted!, insertSeq, inserted);
	}
}
