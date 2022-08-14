import * as S from "./_subseq.js";
import type {Subseq} from "./_subseq.js";

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

export interface EditBuilder {
	retain(length: number): EditBuilder;

	delete(length: number): EditBuilder;

	insert(value: string): EditBuilder;

	concat(edit: Edit): EditBuilder;

	build(): Edit;
}

/** A compact data structure for representing changes to strings. */
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
	declare parts: Array<string | number>;

	/**
	 * A string which represents a concatenation of all deletions.
	 *
	 * This property is optional, but required if you want to invert the edit.
	 */
	declare deleted: string | undefined;

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
		deleteSeq1 = S.expand(deleteSeq1, insertSeq1);
		deleteSeq2 = S.expand(deleteSeq2, deleteSeq1);
		[deleteSeq1, insertSeq2] = S.interleave(deleteSeq1, insertSeq2);
		deleteSeq2 = S.expand(deleteSeq2, insertSeq2);
		insertSeq1 = S.expand(insertSeq1, insertSeq2);

		{
			// Find insertions which have been deleted and remove them.
			const toggleSeq = S.intersection(insertSeq1, deleteSeq2);
			if (S.measure(toggleSeq).includedLength) {
				deleteSeq1 = S.shrink(deleteSeq1, toggleSeq);
				inserted1 = erase(insertSeq1, inserted1, toggleSeq);
				insertSeq1 = S.shrink(insertSeq1, toggleSeq);
				deleteSeq2 = S.shrink(deleteSeq2, toggleSeq);
				insertSeq2 = S.shrink(insertSeq2, toggleSeq);
			}
		}

		const insertSeq = S.union(insertSeq1, insertSeq2);
		const inserted = consolidate(insertSeq1, inserted1, insertSeq2, inserted2);
		const deleteSeq = S.shrink(S.union(deleteSeq1, deleteSeq2), insertSeq);
		const deleted =
			deleted1 != null && deleted2 != null
				? consolidate(deleteSeq1, deleted1, deleteSeq2, deleted2)
				: undefined;
		return synthesize(insertSeq, inserted, deleteSeq, deleted).normalize();
	}

	invert(): Edit {
		if (typeof this.deleted === "undefined") {
			throw new Error("Edit is not invertible");
		}

		let [insertSeq, inserted, deleteSeq, deleted] = factor(this);
		deleteSeq = S.expand(deleteSeq, insertSeq);
		insertSeq = S.shrink(insertSeq, deleteSeq);
		return synthesize(deleteSeq, deleted!, insertSeq, inserted);
	}

	normalize(): Edit {
		if (typeof this.deleted === "undefined") {
			throw new Error("Edit is not normalizable");
		}

		const insertSeq: Array<number> = [];
		const deleteSeq: Array<number> = [];
		let inserted = "";
		let deleted = "";
		let insertion: string | undefined;
		const operations = this.operations();
		for (let i = 0; i < operations.length; i++) {
			const op = operations[i];
			switch (op.type) {
				case "insert": {
					insertion = op.value;
					break;
				}

				case "retain": {
					if (insertion !== undefined) {
						S.pushSegment(insertSeq, insertion.length, true);
						inserted += insertion;
						insertion = undefined;
					}

					S.pushSegment(insertSeq, op.end - op.start, false);
					S.pushSegment(deleteSeq, op.end - op.start, false);
					break;
				}

				case "delete": {
					const length = op.end - op.start;
					const deletion = op.value!;
					let prefix = 0;
					let suffix = 0;
					if (insertion !== undefined) {
						if (insertion === deletion) {
							prefix = deletion.length;
						} else {
							prefix = commonPrefixLength(insertion, deletion);
							suffix = commonSuffixLength(
								insertion.slice(prefix),
								deletion.slice(prefix),
							);
						}

						S.pushSegment(insertSeq, prefix, false);
						S.pushSegment(insertSeq, insertion.length - prefix - suffix, true);
						inserted += insertion.slice(prefix, insertion.length - suffix);
					}

					deleted += deletion.slice(prefix, deletion.length - suffix);
					S.pushSegment(deleteSeq, prefix, false);
					S.pushSegment(deleteSeq, length - prefix - suffix, true);
					S.pushSegment(deleteSeq, suffix, false);

					S.pushSegment(insertSeq, length - prefix - suffix, false);
					S.pushSegment(insertSeq, suffix, false);
					insertion = undefined;
					break;
				}
			}
		}

		if (insertion !== undefined) {
			S.pushSegment(insertSeq, insertion.length, true);
			inserted += insertion;
		}

		return synthesize(insertSeq, inserted, deleteSeq, deleted);
	}

	hasChangesBetween(start: number, end: number): boolean {
		const ops = this.operations();
		for (const op of ops) {
			switch (op.type) {
				case "delete": {
					if (
						(start <= op.start && op.start <= end) ||
						(start <= op.end && op.end <= end)
					) {
						return true;
					}

					break;
				}
				case "insert": {
					if (start <= op.start && op.start <= end) {
						return true;
					}

					break;
				}
			}
		}

		return false;
	}

	static builder(value?: string | undefined): EditBuilder {
		let index = 0;
		let inserted = "";
		let deleted: string | undefined = undefined;
		const insertSeq: Subseq = [];
		const deleteSeq: Subseq = [];

		return {
			retain(length: number) {
				if (value != null) {
					length = Math.min(value.length - index, length);
				}

				index += length;
				S.pushSegment(insertSeq, length, false);
				S.pushSegment(deleteSeq, length, false);
				return this;
			},

			delete(length: number) {
				if (value != null) {
					length = Math.min(value.length - index, length);
					deleted = (deleted || "") + value.slice(index, index + length);
				}

				index += length;
				S.pushSegment(insertSeq, length, false);
				S.pushSegment(deleteSeq, length, true);
				return this;
			},

			insert(value: string) {
				S.pushSegment(insertSeq, value.length, true);
				inserted += value;
				return this;
			},

			concat(edit: Edit) {
				const ops = edit.operations();
				for (const op of ops) {
					switch (op.type) {
						case "delete":
							this.delete(op.end - op.start);
							break;
						case "insert":
							this.insert(op.value);
							break;
						case "retain":
							this.retain(op.end - op.start);
							break;
					}
				}

				if (value != null && index > value.length) {
					throw new RangeError("Edit is longer than original value");
				}

				return this;
			},

			build(): Edit {
				if (value != null) {
					deleted = deleted || "";
					if (index < value.length) {
						S.pushSegment(insertSeq, value.length - index, false);
						S.pushSegment(deleteSeq, value.length - index, false);
					}
				}

				return synthesize(insertSeq, inserted, deleteSeq, deleted);
			},
		};
	}

	/**
	 * Given two strings, this method finds an edit which can be applied to the
	 * first string to result in the second.
	 *
	 * @param startHint - An optional hint can be provided to disambiguate edits
	 * which cannot be inferred by comparing the text alone. For example,
	 * inserting "a" into the string "aaaa" to make it "aaaaa" could be an
	 * insertion at any index in the string. This value should be the smaller of
	 * the start indices of the selection from before and after the edit.
	 */
	static diff(text1: string, text2: string, startHint?: number): Edit {
		let prefix = commonPrefixLength(text1, text2);
		let suffix = commonSuffixLength(text1, text2);
		// prefix and suffix overlap when edits are in runs of the same character.
		if (prefix + suffix > Math.min(text1.length, text2.length)) {
			if (startHint != null && startHint >= 0) {
				prefix = Math.min(prefix, startHint);
			}

			// TODO: We can probably avoid the commonSuffixLength() call here in
			// favor of arithmetic but I’m too dumb to figure it out.
			suffix = commonSuffixLength(text1.slice(prefix), text2.slice(prefix));
		}

		return Edit.builder(text1)
			.retain(prefix)
			.insert(text2.slice(prefix, text2.length - suffix))
			.delete(text1.length - prefix - suffix)
			.retain(suffix)
			.build();
	}
}

function synthesize(
	insertSeq: Subseq,
	inserted: string,
	deleteSeq: Subseq,
	deleted?: string | undefined,
): Edit {
	if (S.measure(insertSeq).includedLength !== inserted.length) {
		throw new Error("insertSeq and inserted string do not match in length");
	} else if (
		deleted !== undefined &&
		S.measure(deleteSeq).includedLength !== deleted.length
	) {
		throw new Error("deleteSeq and deleted string do not match in length");
	}

	const parts: Array<string | number> = [];
	let insertIndex = 0;
	let retainIndex = 0;
	let needsLength = true;
	for (const [length, deleting, inserting] of S.align(
		S.expand(deleteSeq, insertSeq),
		insertSeq,
	)) {
		if (inserting) {
			const insertion = inserted.slice(insertIndex, insertIndex + length);
			if (parts.length && typeof parts[parts.length - 1] === "string") {
				parts[parts.length - 1] += insertion;
			} else {
				parts.push(insertion);
			}

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

function factor(edit: Edit): [Subseq, string, Subseq, string | undefined] {
	const insertSeq: Array<number> = [];
	const deleteSeq: Array<number> = [];
	let inserted = "";
	const operations = edit.operations();
	for (let i = 0; i < operations.length; i++) {
		const op = operations[i];
		switch (op.type) {
			case "retain": {
				const length = op.end - op.start;
				S.pushSegment(insertSeq, length, false);
				S.pushSegment(deleteSeq, length, false);
				break;
			}
			case "delete": {
				const length = op.end - op.start;
				S.pushSegment(insertSeq, length, false);
				S.pushSegment(deleteSeq, length, true);
				break;
			}
			case "insert":
				S.pushSegment(insertSeq, op.value.length, true);
				inserted += op.value;
				break;
		}
	}

	return [insertSeq, inserted, deleteSeq, edit.deleted];
}

/**
 * Given two subseqs and strings which are represented by the included segments
 * of the subseqs, this function combines the two strings so that they overlap
 * according to the positions of the included segments of subseqs.
 *
 * The subseqs must have the same length, and the included segments of these
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
	for (const [length, included1, included2] of S.align(subseq1, subseq2)) {
		if (included1 && included2) {
			throw new Error("Overlapping subseqs");
		} else if (included1) {
			result += text1.slice(i1, i1 + length);
			i1 += length;
		} else if (included2) {
			result += text2.slice(i2, i2 + length);
			i2 += length;
		}
	}

	return result;
}

/**
 * Given two subseqs as well a string which is represented by the included
 * segments of the first subseq, this function returns the result of removing
 * the included segments of the second subseq from the first subseq.
 *
 * The subseqs must have the same length, and the included segments of the second
 * subseq must overlap with the first subseq’s included segments.
 */
function erase(subseq1: Subseq, str: string, subseq2: Subseq): string {
	let i = 0;
	let result = "";
	for (const [length, included1, included2] of S.align(subseq1, subseq2)) {
		if (included1) {
			if (!included2) {
				result += str.slice(i, i + length);
			}

			i += length;
		} else if (included2) {
			throw new Error("Non-overlapping subseqs");
		}
	}

	return result;
}

/** @returns The length of the common prefix between two strings. */
function commonPrefixLength(text1: string, text2: string) {
	const length = Math.min(text1.length, text2.length);
	for (let i = 0; i < length; i++) {
		if (text1[i] !== text2[i]) {
			return i;
		}
	}

	return length;
}

/** @returns The length of the common suffix between two strings. */
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
