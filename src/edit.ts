import {Subseq} from "./subseq.js";

export interface InsertOperation {
	type: "insert";
	start: number;
	value: string;
}

export interface RetainOperation {
	type: "retain";
	start: number;
	end: number;
}

export interface DeleteOperation {
	type: "delete";
	start: number;
	end: number;
	value: string | undefined;
}

export type Operation = RetainOperation | DeleteOperation | InsertOperation;

/** A data structure which represents edits to strings. */
export class Edit {
	/**
	 * An array of strings and integers representing operations.
	 *
	 * Strings represent insertions, and pairs of integers represent the start
	 * and end indices of retained segments. Deletions are implied by gaps
	 * between the retained segments.
	 *
	 * Examples:
	 *
	 *   [0, 3, 7, 10]
	 *   retain 0-3, delete 3-7, retain 7-10
	 *
	 *   ["hello", 0, 10]
	 *   insert "hello", retain 0-10
	 *
	 *   [0, 5, " ", 6, 10]
	 *   retain 0-5, insert " ", delete 5-6, retain 6-10
	 *
	 * If the edit includes a delete operation at its end, this is signified by
	 * an extra number signifying the length. Therefore, regardless of whether or
	 * not the last character of the string is retained, the last number will
	 * always represent the length of the original string.
	 *
	 *   // retain 0-10, delete 10-11
	 *   [0, 10, 11]
	 *
	 * An edit that is only retains will contain a single number representing the
	 * length of the string.
	 */
	parts: Array<string | number>;

	/**
	 * A string which represents a concatenation of all deletions.
	 *
	 * This property is optional, but necessary if you want to call the invert()
	 * method on an edit.
	 */
	deleted: string | undefined;

	constructor(parts: Array<string | number>, deleted?: string) {
		this.parts = parts;
		this.deleted = deleted;
	}

	/** A string which represents a concatenation of all insertions. */
	get inserted(): string {
		let text = "";
		for (let i = 0; i < this.parts.length; i++) {
			if (typeof this.parts[i] === "string") {
				text += this.parts[i];
			}
		}

		return text;
	}

	/**
	 * Returns an array of operations, which is more readable than the parts
	 * array.
	 *
	 *   new Edit([0, 1, " ", 2], "x").operations();
	 *   [
	 *     {type: "retain", start: 0, end: 1},
	 *     {type: "insert", start: 1, value: " "},
	 *     {type: "delete", start: 1, end: 2, value: "x"},
	 *   ]
	 *
	 * When insertions and deletions happen at the same index, insertions will
	 * always appear before deletions in the operations array.
	 */
	operations(): Array<Operation> {
		const operations: Array<Operation> = [];
		let retaining = false;
		let index = 0;
		let deleteStart = 0;
		for (let i = 0; i < this.parts.length; i++) {
			const part = this.parts[i];
			if (typeof part === "number") {
				if (part < index) {
					throw new TypeError("Malformed edit");
				} else if (part > index) {
					if (retaining) {
						operations.push({type: "retain", start: index, end: part});
					} else {
						const value =
							typeof this.deleted === "undefined"
								? undefined
								: this.deleted.slice(deleteStart, part);
						operations.push({
							type: "delete",
							start: index,
							end: part,
							value,
						});
						deleteStart = part;
					}
				}

				index = part;
				retaining = !retaining;
			} else {
				operations.push({type: "insert", start: index, value: part});
			}
		}

		return operations;
	}

	// TODO: I’m not too happy about the name of this method, insofar as it might
	// imply that this object is callable.
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

	/** Composes two consecutive edits. */
	compose(that: Edit): Edit {
		let [insertSeq1, inserted1, deleteSeq1, deleted1] = factor(this);
		let [insertSeq2, inserted2, deleteSeq2, deleted2] = factor(that);
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

		const insertSeq = insertSeq1.union(insertSeq2);
		const inserted = consolidate(insertSeq1, inserted1, insertSeq2, inserted2);
		const deleteSeq = deleteSeq1.union(deleteSeq2).shrink(insertSeq);
		const deleted =
			deleted1 != null && deleted2 != null
				? consolidate(deleteSeq1, deleted1, deleteSeq2, deleted2)
				: undefined;
		return Edit.synthesize(insertSeq, inserted, deleteSeq, deleted).normalize();
	}

	invert(): Edit {
		if (typeof this.deleted === "undefined") {
			throw new Error("Missing deleted property");
		}

		let [insertSeq, inserted, deleteSeq, deleted] = factor(this);
		deleteSeq = deleteSeq.expand(insertSeq);
		insertSeq = insertSeq.shrink(deleteSeq);
		return Edit.synthesize(deleteSeq, deleted!, insertSeq, inserted);
	}

	normalize(): Edit {
		if (typeof this.deleted === "undefined") {
			throw new Error("Missing deleted property");
		}

		const insertSizes: Array<number> = [];
		const deleteSizes: Array<number> = [];
		let inserted = "";
		let deleted = "";
		let prevInserted: string | undefined;
		const operations = this.operations();
		for (let i = 0; i < operations.length; i++) {
			const op = operations[i];
			switch (op.type) {
				case "insert": {
					prevInserted = op.value;
					break;
				}

				case "retain": {
					if (prevInserted !== undefined) {
						Subseq.pushSegment(insertSizes, prevInserted.length, true);
						inserted += prevInserted;
						prevInserted = undefined;
					}

					Subseq.pushSegment(insertSizes, op.end - op.start, false);
					Subseq.pushSegment(deleteSizes, op.end - op.start, false);
					break;
				}

				case "delete": {
					const length = op.end - op.start;
					let prefix = 0;
					if (prevInserted !== undefined) {
						prefix = commonPrefixLength(prevInserted, op.value!);
						Subseq.pushSegment(insertSizes, prefix, false);
						Subseq.pushSegment(insertSizes, prevInserted.length - prefix, true);
						inserted += prevInserted.slice(prefix);
						prevInserted = undefined;
					}

					deleted += op.value!.slice(prefix);
					Subseq.pushSegment(deleteSizes, prefix, false);
					Subseq.pushSegment(deleteSizes, length - prefix, true);
					Subseq.pushSegment(insertSizes, length - prefix, false);
					break;
				}
			}
		}

		if (prevInserted !== undefined) {
			Subseq.pushSegment(insertSizes, prevInserted.length, true);
			inserted += prevInserted;
		}

		const insertSeq = new Subseq(insertSizes);
		const deleteSeq = new Subseq(deleteSizes);
		return Edit.synthesize(insertSeq, inserted, deleteSeq, deleted);
	}

	static createBuilder(value: string) {
		let index = 0;
		let inserted = "";
		const insertSizes: Array<number> = [];
		let deleted = "";
		const deleteSizes: Array<number> = [];
		return {
			retain(size: number) {
				//console.log("retain:", size);
				size = Math.min(value.length - index, size);
				Subseq.pushSegment(insertSizes, size, false);
				Subseq.pushSegment(deleteSizes, size, false);
				index += size;
				return this;
			},

			delete(size: number) {
				size = Math.min(value.length - index, size);
				Subseq.pushSegment(insertSizes, size, false);
				Subseq.pushSegment(deleteSizes, size, true);
				//console.log("delete:", size, [value.slice(index, index + size)]);
				deleted += value.slice(index, index + size);
				index += size;
				return this;
			},

			insert(value: string) {
				//console.log("insert:", [value]);
				Subseq.pushSegment(insertSizes, value.length, true);
				inserted += value;
				return this;
			},

			build(): Edit {
				if (index < value.length) {
					//console.log("delete:", [value.length - index, value.slice(index)]);
					Subseq.pushSegment(insertSizes, value.length - index, false);
					Subseq.pushSegment(deleteSizes, value.length - index, true);
					deleted += value.slice(index);
				}

				return Edit.synthesize(
					new Subseq(insertSizes),
					inserted,
					new Subseq(deleteSizes),
					deleted,
				);
			},
		};
	}

	static synthesize(
		insertSeq: Subseq,
		inserted: string,
		deleteSeq: Subseq,
		deleted?: string | undefined,
	): Edit {
		if (insertSeq.includedSize !== inserted.length) {
			throw new Error("insertSeq and inserted string do not match in length");
		} else if (
			deleted !== undefined &&
			deleteSeq.includedSize !== deleted.length
		) {
			throw new Error("deleteSeq and deleted string do not match in length");
		} else if (deleteSeq.size !== insertSeq.excludedSize) {
			throw new Error("deleteSeq and insertSeq do not match in length");
		}

		const parts: Array<string | number> = [];
		let insertIndex = 0;
		let retainIndex = 0;
		let needsLength = true;
		for (const [length, deleting, inserting] of deleteSeq
			.expand(insertSeq)
			.align(insertSeq)) {
			if (inserting) {
				parts.push(inserted.slice(insertIndex, insertIndex + length));
				insertIndex += length;
			} else {
				if (!deleting) {
					parts.push(retainIndex, retainIndex + length);
				}

				retainIndex += length;
				needsLength = deleting;
			}
		}

		if (needsLength) {
			parts.push(retainIndex);
		}

		return new Edit(parts, deleted);
	}

	// TODO: DELETE
	static build(
		text: string,
		inserted: string,
		from: number,
		to: number = from,
	): Edit {
		const insertSizes: Array<number> = [];
		Subseq.pushSegment(insertSizes, from, false);
		Subseq.pushSegment(insertSizes, inserted.length, true);
		Subseq.pushSegment(insertSizes, to - from, false);
		Subseq.pushSegment(insertSizes, text.length - to, false);
		const deleteSizes: Array<number> = [];
		Subseq.pushSegment(deleteSizes, from, false);
		Subseq.pushSegment(deleteSizes, to - from, true);
		Subseq.pushSegment(deleteSizes, text.length - to, false);
		const deleted = text.slice(from, to);
		return Edit.synthesize(
			new Subseq(insertSizes),
			inserted,
			new Subseq(deleteSizes),
			deleted,
		);
	}

	/**
	 * Given two strings, this method finds an edit which can be applied to the
	 * first string to result in the second.
	 *
	 * @param hint - An optional hint can be provided to disambiguate edits which
	 * cannot be inferred from the text alone, for example, inserting "a" into
	 * the string "aaaa" could be an insertion at any point in the string which
	 * leads to the same result. The hint is usually inferred from the user
	 * interface.
	 */
	static diff(text1: string, text2: string, hint?: number): Edit {
		let prefix = commonPrefixLength(text1, text2);
		let suffix = commonSuffixLength(text1, text2);
		// prefix and suffix overlap when edits are in runs of the same character.
		if (prefix + suffix > Math.min(text1.length, text2.length)) {
			if (hint != null && hint >= 0) {
				prefix = Math.min(prefix, hint);
			}

			// TODO: We can probably avoid the commonSuffixLength() call here in
			// favor of arithmetic but I’m too dumb to figure it out.
			suffix = commonSuffixLength(text1.slice(prefix), text2.slice(prefix));
		}

		return Edit.createBuilder(text1)
			.retain(prefix)
			.insert(text2.slice(prefix, -suffix))
			.delete(text1.length - prefix - suffix)
			.retain(suffix)
			.build();
	}
}

function factor(edit: Edit): [Subseq, string, Subseq, string | undefined] {
	const insertSizes: Array<number> = [];
	const deleteSizes: Array<number> = [];
	let inserted = "";
	const operations = edit.operations();
	for (let i = 0; i < operations.length; i++) {
		const op = operations[i];
		switch (op.type) {
			case "retain": {
				const length = op.end - op.start;
				Subseq.pushSegment(insertSizes, length, false);
				Subseq.pushSegment(deleteSizes, length, false);
				break;
			}
			case "delete": {
				const length = op.end - op.start;
				Subseq.pushSegment(insertSizes, length, false);
				Subseq.pushSegment(deleteSizes, length, true);
				break;
			}
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
	return [insertSeq, inserted, deleteSeq, edit.deleted];
}

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

/** @returns The length of the common prefix between two strings. */
export function commonPrefixLength(text1: string, text2: string) {
	const length = Math.min(text1.length, text2.length);
	for (let i = 0; i < length; i++) {
		if (text1[i] !== text2[i]) {
			return i;
		}
	}

	return length;
}

/** @returns The length of the common suffix between two strings. */
export function commonSuffixLength(text1: string, text2: string) {
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
