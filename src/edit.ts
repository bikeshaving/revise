import {
	align,
	expand,
	interleave,
	intersection,
	measure,
	pushSegment,
	shrink,
	union,
} from "./subseq";
import type {Subseq} from "./subseq.js";

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

	build(): Edit;

	// TODO: add concat
}

/** A data structure which represents edits to strings. */
export class Edit {
	// TODO: hide parts and deleted from the public interface
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

	// TODO: Is this the constructor signature we want to use?
	constructor(parts: Array<string | number>, deleted?: string) {
		this.parts = parts;
		this.deleted = deleted;
	}

	// TODO: Not sure this is a good name or if this should be exposed
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
		deleteSeq1 = expand(deleteSeq1, insertSeq1);
		deleteSeq2 = expand(deleteSeq2, deleteSeq1);
		[deleteSeq1, insertSeq2] = interleave(deleteSeq1, insertSeq2);
		deleteSeq2 = expand(deleteSeq2, insertSeq2);
		insertSeq1 = expand(insertSeq1, insertSeq2);

		// Find insertions which have been deleted and remove them.
		// TODO: Is this necessary???
		{
			const toggleSeq = intersection(insertSeq1, deleteSeq2);
			if (measure(toggleSeq).includedLength) {
				deleteSeq1 = shrink(deleteSeq1, toggleSeq);
				inserted1 = erase(insertSeq1, inserted1, toggleSeq);
				insertSeq1 = shrink(insertSeq1, toggleSeq);
				deleteSeq2 = shrink(deleteSeq2, toggleSeq);
				insertSeq2 = shrink(insertSeq2, toggleSeq);
			}
		}

		const insertSeq = union(insertSeq1, insertSeq2);
		const inserted = consolidate(insertSeq1, inserted1, insertSeq2, inserted2);
		const deleteSeq = shrink(union(deleteSeq1, deleteSeq2), insertSeq);
		const deleted =
			deleted1 != null && deleted2 != null
				? consolidate(deleteSeq1, deleted1, deleteSeq2, deleted2)
				: undefined;
		return Edit.synthesize(insertSeq, inserted, deleteSeq, deleted).normalize();
	}

	invert(): Edit {
		if (typeof this.deleted === "undefined") {
			throw new Error("Edit is not invertible");
		}

		let [insertSeq, inserted, deleteSeq, deleted] = factor(this);
		deleteSeq = expand(deleteSeq, insertSeq);
		insertSeq = shrink(insertSeq, deleteSeq);
		return Edit.synthesize(deleteSeq, deleted!, insertSeq, inserted);
	}

	normalize(): Edit {
		if (typeof this.deleted === "undefined") {
			throw new Error("Missing deleted property");
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
						pushSegment(insertSeq, insertion.length, true);
						inserted += insertion;
						insertion = undefined;
					}

					pushSegment(insertSeq, op.end - op.start, false);
					pushSegment(deleteSeq, op.end - op.start, false);
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

						pushSegment(insertSeq, prefix, false);
						pushSegment(insertSeq, insertion.length - prefix - suffix, true);
						inserted += insertion.slice(prefix, insertion.length - suffix);
					}

					deleted += deletion.slice(prefix, deletion.length - suffix);
					pushSegment(deleteSeq, prefix, false);
					pushSegment(deleteSeq, length - prefix - suffix, true);
					pushSegment(deleteSeq, suffix, false);

					pushSegment(insertSeq, length - prefix - suffix, false);
					pushSegment(insertSeq, suffix, false);
					insertion = undefined;
					break;
				}
			}
		}

		if (insertion !== undefined) {
			pushSegment(insertSeq, insertion.length, true);
			inserted += insertion;
		}

		return Edit.synthesize(insertSeq, inserted, deleteSeq, deleted);
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

	static createBuilder(value: string): EditBuilder {
		let index = 0;
		let inserted = "";
		const insertSeq: Array<number> = [];
		let deleted = "";
		const deleteSeq: Array<number> = [];
		return {
			retain(length: number) {
				length = Math.min(value.length - index, length);
				pushSegment(insertSeq, length, false);
				pushSegment(deleteSeq, length, false);
				index += length;
				return this;
			},

			delete(length: number) {
				length = Math.min(value.length - index, length);
				pushSegment(insertSeq, length, false);
				pushSegment(deleteSeq, length, true);
				deleted += value.slice(index, index + length);
				index += length;
				return this;
			},

			insert(value: string) {
				pushSegment(insertSeq, value.length, true);
				inserted += value;
				return this;
			},

			build(): Edit {
				if (index < value.length) {
					pushSegment(insertSeq, value.length - index, false);
					pushSegment(deleteSeq, value.length - index, true);
					deleted += value.slice(index);
				}

				return Edit.synthesize(insertSeq, inserted, deleteSeq, deleted);
			},
		};
	}

	// TODO: Make this private
	static synthesize(
		insertSeq: Subseq,
		inserted: string,
		deleteSeq: Subseq,
		deleted?: string | undefined,
	): Edit {
		if (measure(insertSeq).includedLength !== inserted.length) {
			throw new Error("insertSeq and inserted string do not match in length");
		} else if (
			deleted !== undefined &&
			measure(deleteSeq).includedLength !== deleted.length
		) {
			throw new Error("deleteSeq and deleted string do not match in length");
		} else if (
			measure(deleteSeq).length !== measure(insertSeq).excludedLength
		) {
			throw new Error("deleteSeq and insertSeq do not match in length");
		}

		const parts: Array<string | number> = [];
		let insertIndex = 0;
		let retainIndex = 0;
		let needsLength = true;
		for (const [length, deleting, inserting] of align(
			expand(deleteSeq, insertSeq),
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

	// TODO: DELETE
	static build(
		text: string,
		inserted: string,
		from: number,
		to: number = from,
	): Edit {
		const insertSeq: Array<number> = [];
		pushSegment(insertSeq, from, false);
		pushSegment(insertSeq, inserted.length, true);
		pushSegment(insertSeq, to - from, false);
		pushSegment(insertSeq, text.length - to, false);
		const deleteSeq: Array<number> = [];
		pushSegment(deleteSeq, from, false);
		pushSegment(deleteSeq, to - from, true);
		pushSegment(deleteSeq, text.length - to, false);
		const deleted = text.slice(from, to);
		return Edit.synthesize(insertSeq, inserted, deleteSeq, deleted);
	}

	/**
	 * Given two strings, this method finds an edit which can be applied to the
	 * first string to result in the second.
	 *
	 * @param hint - An optional hint can be provided to disambiguate edits which
	 * cannot be inferred from the text alone, for example, inserting "a" into
	 * the string "aaaa" to make it "aaaaa" could be an insertion at any index in
	 * the string. The hint is usually inferred from the user interface.
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
	const insertSeq: Array<number> = [];
	const deleteSeq: Array<number> = [];
	let inserted = "";
	const operations = edit.operations();
	for (let i = 0; i < operations.length; i++) {
		const op = operations[i];
		switch (op.type) {
			case "retain": {
				const length = op.end - op.start;
				pushSegment(insertSeq, length, false);
				pushSegment(deleteSeq, length, false);
				break;
			}
			case "delete": {
				const length = op.end - op.start;
				pushSegment(insertSeq, length, false);
				pushSegment(deleteSeq, length, true);
				break;
			}
			case "insert":
				pushSegment(insertSeq, op.value.length, true);
				inserted += op.value;
				break;
			default:
				throw new TypeError("Invalid operation type");
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
	for (const [length, included1, included2] of align(subseq1, subseq2)) {
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
	for (const [length, included1, included2] of align(subseq1, subseq2)) {
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
