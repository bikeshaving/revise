import * as S from "./_subseq.js";
import type {Subseq} from "./_subseq.js";

// For now, keep the flexible type but add helper functions for type-safe access
type EditParts = Array<string | number>;

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
	value: string;
}

export type Operation = RetainOperation | DeleteOperation | InsertOperation;

export interface EditBuilder {
	insert(value: string): EditBuilder;

	retain(length: number): EditBuilder;

	delete(length: number): EditBuilder;

	concat(edit: Edit): EditBuilder;

	build(): Edit;
}

/** A compact data structure for representing changes to strings. */
export class Edit {
	/**
	 * An array of strings and numbers in string pairs format.
	 *
	 * Format: [position, deleted_string, inserted_string, position, deleted_string, inserted_string, ..., final_position]
	 *
	 * Each triplet represents operations at a specific position:
	 * - position: where in the original text this operation occurs
	 * - deleted_string: text to delete (empty string if no deletion)
	 * - inserted_string: text to insert (empty string if no insertion)
	 * - final_position: the length of the original text
	 *
	 * Retains are implicit between positions.
	 *
	 * Examples:
	 *
	 *   [1, "ello", "i", 11]
	 *   Retain from 0 to 1
	 *   At position 1: delete "ello", insert "i"
	 *   Retain from 5 (1 + len("ello")) to 11
	 *
	 *   [5, "", "oo", 11]
	 *   Retain from 0 to 5
	 *   At position 5: insert "oo"
	 *   Retain from 5 to 11
	 */
	declare parts: EditParts;

	constructor(parts: Array<string | number>) {
		validateEditParts(parts);
		this.parts = parts;
	}

	/** A string which represents a concatenation of all insertions. */
	get inserted(): string {
		let text = "";
		for (let i = 2; i < this.parts.length; i += 3) {
			const inserted = this.parts[i] as string;
			text += inserted;
		}
		return text;
	}

	/** A string which represents a concatenation of all deletions. */
	get deleted(): string {
		let text = "";
		for (let i = 1; i < this.parts.length; i += 3) {
			const deleted = this.parts[i] as string;
			text += deleted;
		}
		return text;
	}

	/**
	 * Returns an array of operations, which is more readable than the parts
	 * array.
	 *
	 *   new Edit([0, "old", "new", 3, "", "", 6]).operations();
	 *   [
	 *     {type: "delete", start: 0, end: 3, value: "old"},
	 *     {type: "insert", start: 0, value: "new"},
	 *     {type: "retain", start: 3, end: 6},
	 *   ]
	 *
	 * When insertions and deletions happen at the same index, deletions will
	 * always appear before insertions in the operations array (deletion-first format).
	 */
	operations(): Array<Operation> {
		const operations: Array<Operation> = [];
		let currentPos = 0;

		// Handle empty edit (just final position)
		if (this.parts.length === 1) {
			const finalPos = this.parts[0] as number;
			if (finalPos > 0) {
				operations.push({
					type: "retain",
					start: 0,
					end: finalPos,
				});
			}
			return operations;
		}

		// Process triplets
		for (let i = 0; i < this.parts.length - 1; i += 3) {
			const position = this.parts[i] as number;
			const deleted = this.parts[i + 1] as string;
			const inserted = this.parts[i + 2] as string;

			// Add retain operation for gap if needed
			if (position > currentPos) {
				operations.push({
					type: "retain",
					start: currentPos,
					end: position,
				});
			}

			// Add operations at this position (deletion-first format)
			if (deleted) {
				operations.push({
					type: "delete",
					start: position,
					end: position + deleted.length,
					value: deleted,
				});
			}
			if (inserted) {
				operations.push({
					type: "insert",
					start: position,
					value: inserted,
				});
			}

			// Move current position past the deletion
			currentPos = position + deleted.length;
		}

		// Handle final retain if needed
		const finalPos = this.parts[this.parts.length - 1] as number;
		if (finalPos > currentPos) {
			operations.push({
				type: "retain",
				start: currentPos,
				end: finalPos,
			});
		}

		return operations;
	}

	apply(text: string): string {
		let result = "";
		let sourcePos = 0;
		const operations = this.operations();

		for (let i = 0; i < operations.length; i++) {
			const op = operations[i];
			switch (op.type) {
				case "retain":
					result += text.slice(sourcePos, sourcePos + (op.end - op.start));
					sourcePos += op.end - op.start;
					break;
				case "delete":
					sourcePos += op.end - op.start;
					break;
				case "insert":
					result += op.value;
					break;
			}
		}

		return result;
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
				deleted2 = erase(deleteSeq2, deleted2, toggleSeq);
				deleteSeq2 = S.shrink(deleteSeq2, toggleSeq);
				insertSeq2 = S.shrink(insertSeq2, toggleSeq);
			}
		}

		const insertSeq = S.union(insertSeq1, insertSeq2);
		const inserted = consolidate(insertSeq1, inserted1, insertSeq2, inserted2);
		const deleteSeq = S.shrink(S.union(deleteSeq1, deleteSeq2), insertSeq);
		const deleted = consolidate(deleteSeq1, deleted1, deleteSeq2, deleted2);
		return synthesize(insertSeq, inserted, deleteSeq, deleted).normalize();
	}

	invert(): Edit {
		let [insertSeq, inserted, deleteSeq, deleted] = factor(this);
		deleteSeq = S.expand(deleteSeq, insertSeq);
		insertSeq = S.shrink(insertSeq, deleteSeq);
		return synthesize(deleteSeq, deleted, insertSeq, inserted);
	}

	/**
	 * Transforms two concurrent edits against the same base document.
	 *
	 * Given edits A and B both applicable to the same document s0, returns
	 * [A', B'] such that:
	 *   B'.apply(A.apply(s0)) === A'.apply(B.apply(s0))
	 *
	 * A' is A adjusted to apply after B has been applied.
	 * B' is B adjusted to apply after A has been applied.
	 *
	 * When both edits insert at the same position, `this` (A) gets left
	 * priority (its insertion appears first in the converged result).
	 */
	transform(that: Edit): [Edit, Edit] {
		const [insertSeqA, insertedA, deleteSeqA, deletedA] = factor(this);
		const [insertSeqB, insertedB, deleteSeqB, deletedB] = factor(that);

		// Both insertSeqs have excludedLength == base length.
		// Interleave to establish a combined coordinate space
		// (base + insA + insB) and resolve insertion ordering.
		const [insertSeqAI, insertSeqBI] = S.interleave(
			insertSeqA,
			insertSeqB,
		);

		// Lift deleteSeqs from base into the combined space.
		// unionI.excludedLength == base length, matching deleteSeq lengths.
		const unionI = S.union(insertSeqAI, insertSeqBI);
		const deleteSeqAI = S.expand(deleteSeqA, unionI);
		const deleteSeqBI = S.expand(deleteSeqB, unionI);

		// Overlapping deletions: text both edits delete from s0.
		// A' only deletes what B hasn't already deleted, and vice versa.
		const deleteOnlyAI = S.difference(deleteSeqAI, deleteSeqBI);
		const deleteOnlyBI = S.difference(deleteSeqBI, deleteSeqAI);

		// Build deleted strings by erasing overlap in base coordinates.
		const deleteOverlap = S.intersection(deleteSeqA, deleteSeqB);
		const deletedAPrime = erase(deleteSeqA, deletedA, deleteOverlap);
		const deletedBPrime = erase(deleteSeqB, deletedB, deleteOverlap);

		// Build A' (operates on B's output = base + insB - delB).
		// From combined space, shrink by deleteSeqBI to reach
		// "base + insA + insB - delB" = "B_output + insA".
		const insertSeqAPrime = S.shrink(insertSeqAI, deleteSeqBI);
		const deleteOnlyAShifted = S.shrink(deleteOnlyAI, deleteSeqBI);
		// Then shrink deleteSeq by insertSeqA' to get to "B_output" space.
		const deleteSeqAPrime = S.shrink(deleteOnlyAShifted, insertSeqAPrime);

		// Build B' (operates on A's output = base + insA - delA). Symmetric.
		const insertSeqBPrime = S.shrink(insertSeqBI, deleteSeqAI);
		const deleteOnlyBShifted = S.shrink(deleteOnlyBI, deleteSeqAI);
		const deleteSeqBPrime = S.shrink(deleteOnlyBShifted, insertSeqBPrime);

		return [
			synthesize(insertSeqAPrime, insertedA, deleteSeqAPrime, deletedAPrime).normalize(),
			synthesize(insertSeqBPrime, insertedB, deleteSeqBPrime, deletedBPrime).normalize(),
		];
	}

	normalize(): Edit {
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
					const deletion = op.value;
					let prefix = 0;
					let suffix = 0;
					if (insertion !== undefined) {
						if (insertion === deletion) {
							prefix = deletion.length;
						} else {
							prefix = commonPrefixLength(insertion, deletion);
							const insertionRemainder = insertion.slice(prefix);
							const deletionRemainder = deletion.slice(prefix);
							suffix = commonSuffixLength(
								insertionRemainder,
								deletionRemainder,
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

		const result = synthesize(insertSeq, inserted, deleteSeq, deleted);

		if (result.parts.length <= 1) {
			return result;
		}

		// Apply edit-level compaction for adjacent operations
		const compactedParts: Array<string | number> = [];

		for (let i = 0; i < result.parts.length - 1; i += 3) {
			const position = result.parts[i] as number;
			const deleted = result.parts[i + 1] as string;
			const inserted = result.parts[i + 2] as string;

			// Apply prefix/suffix optimization between deleted and inserted
			if (deleted && inserted) {
				const prefixLen = commonPrefixLength(deleted, inserted);

				const deletedRemainder = deleted.slice(prefixLen);
				const insertedRemainder = inserted.slice(prefixLen);
				const suffixLen = commonSuffixLength(
					deletedRemainder,
					insertedRemainder,
				);

				// Only include the differing parts
				if (prefixLen > 0 || suffixLen > 0) {
					const optimizedDeleted = deleted.slice(
						prefixLen,
						deleted.length - suffixLen,
					);
					const optimizedInserted = inserted.slice(
						prefixLen,
						inserted.length - suffixLen,
					);
					const optimizedPosition = position + prefixLen;

					// Only add if there's actually a change
					if (optimizedDeleted || optimizedInserted) {
						compactedParts.push(
							optimizedPosition,
							optimizedDeleted,
							optimizedInserted,
						);
					}
				} else {
					// No optimization possible, keep as-is
					compactedParts.push(position, deleted, inserted);
				}
			} else {
				// No optimization needed for operations with only delete or only insert
				compactedParts.push(position, deleted, inserted);
			}
		}

		// Always add final position
		compactedParts.push(result.parts[result.parts.length - 1]);

		return new Edit(compactedParts);
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

	static builder(value: string = ""): EditBuilder {
		let index = 0;
		let inserted = "";
		let deleted = "";
		const insertSeq: Subseq = [];
		const deleteSeq: Subseq = [];

		return {
			retain(length: number) {
				if (value != null && value !== "") {
					length = Math.min(value.length - index, length);
				}

				if (length > 0) {
					index += length;
					S.pushSegment(insertSeq, length, false);
					S.pushSegment(deleteSeq, length, false);
				}
				return this;
			},

			delete(length: number) {
				if (value != null && value !== "") {
					length = Math.min(value.length - index, length);
					deleted += value.slice(index, index + length);
				}
				// When no text is provided, deletion is tracked as empty string

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
				if (value != null && index < value.length) {
					S.pushSegment(insertSeq, value.length - index, false);
					S.pushSegment(deleteSeq, value.length - index, false);
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

			// Recalculate suffix for the sliced strings
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
	deleted: string,
): Edit {
	if (S.measure(insertSeq).includedLength !== inserted.length) {
		throw new Error("insertSeq and inserted string do not match in length");
	} else if (S.measure(deleteSeq).includedLength !== deleted.length) {
		throw new Error("deleteSeq and deleted string do not match in length");
	}

	const parts: Array<string | number> = [];
	let insertIndex = 0;
	let deleteIndex = 0;
	let position = 0; // Position in original text

	// Track pending operations to merge adjacent ones
	let pendingPos = -1;
	let pendingDeleted = "";
	let pendingInserted = "";

	function flushPending() {
		if (pendingPos >= 0 && (pendingDeleted || pendingInserted)) {
			parts.push(pendingPos, pendingDeleted, pendingInserted);
			pendingPos = -1;
			pendingDeleted = "";
			pendingInserted = "";
		}
	}

	// Expand deleteSeq to align with insertSeq
	const expandedDeleteSeq = S.expand(deleteSeq, insertSeq);

	// Align both sequences
	for (const [length, deleting, inserting] of S.align(
		expandedDeleteSeq,
		insertSeq,
	)) {
		if (deleting || inserting) {
			// We have an operation at this position
			const deletedText = deleting
				? deleted.slice(deleteIndex, deleteIndex + length)
				: "";
			const insertedText = inserting
				? inserted.slice(insertIndex, insertIndex + length)
				: "";

			// Check if we can merge with pending operation
			if (pendingPos >= 0 && position === pendingPos + pendingDeleted.length) {
				// Adjacent operation - merge it
				pendingDeleted += deletedText;
				pendingInserted += insertedText;
			} else {
				// New operation position - flush pending and start new
				flushPending();
				pendingPos = position;
				pendingDeleted = deletedText;
				pendingInserted = insertedText;
			}

			if (deleting) {
				deleteIndex += length;
			}
			if (inserting) {
				insertIndex += length;
			}
		}

		// Update position - only advance for non-inserted segments
		if (!inserting || deleting) {
			position += length;
		}
	}

	// Flush any remaining pending operation
	flushPending();

	// Always add final position
	const totalLength = S.measure(deleteSeq).length;
	parts.push(totalLength);

	return new Edit(parts);
}

/** @returns The length of the common prefix between two strings. */
function commonPrefixLength(text1: string, text2: string): number {
	let min = 0;
	let max = Math.min(text1.length, text2.length);
	let mid = max;
	while (min < mid) {
		if (text1.slice(min, mid) === text2.slice(min, mid)) {
			min = mid;
		} else {
			max = mid;
		}
		mid = Math.floor((max - min) / 2 + min);
	}
	return mid;
}

/** @returns The length of the common suffix between two strings. */
function commonSuffixLength(text1: string, text2: string): number {
	let min = 0;
	let max = Math.min(text1.length, text2.length);
	let mid = max;
	while (min < mid) {
		if (
			text1.slice(text1.length - mid, text1.length - min) ===
			text2.slice(text2.length - mid, text2.length - min)
		) {
			min = mid;
		} else {
			max = mid;
		}
		mid = Math.floor((max - min) / 2 + min);
	}
	return mid;
}

function factor(edit: Edit): [Subseq, string, Subseq, string] {
	const insertSeq: Array<number> = [];
	const deleteSeq: Array<number> = [];
	let inserted = "";
	let deleted = "";
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
				deleted += op.value;
				break;
			}
			case "insert":
				S.pushSegment(insertSeq, op.value.length, true);
				inserted += op.value;
				break;
		}
	}

	return [insertSeq, inserted, deleteSeq, deleted];
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

function validateEditParts(parts: Array<string | number>): void {
	// Check minimum length (must be at least final position)
	if (parts.length === 0) {
		throw new Error("Edit parts cannot be empty");
	}

	// Check length follows triplet pattern: operations * 3 + final position
	if (parts.length !== 1 && (parts.length - 1) % 3 !== 0) {
		throw new Error(
			`Edit parts length ${parts.length} is invalid - must be 1 or (operations * 3 + 1)`,
		);
	}

	// For empty edit (just final position)
	if (parts.length === 1) {
		if (typeof parts[0] !== "number") {
			throw new Error("Single-element edit must be a number (final position)");
		}
		if (parts[0] < 0) {
			throw new Error("Final position cannot be negative");
		}
		return;
	}

	// Validate triplet structure and ordering
	const finalPos = parts[parts.length - 1];
	if (typeof finalPos !== "number") {
		throw new Error("Final position must be a number");
	}
	if (finalPos < 0) {
		throw new Error("Final position cannot be negative");
	}

	let previousPos = -1;
	for (let i = 0; i < parts.length - 1; i += 3) {
		const position = parts[i];
		const deleted = parts[i + 1];
		const inserted = parts[i + 2];

		// Validate types
		if (typeof position !== "number") {
			throw new Error(
				`Position at index ${i} must be a number, got ${typeof position}`,
			);
		}
		if (typeof deleted !== "string") {
			throw new Error(
				`Deleted at index ${i + 1} must be a string, got ${typeof deleted}`,
			);
		}
		if (typeof inserted !== "string") {
			throw new Error(
				`Inserted at index ${i + 2} must be a string, got ${typeof inserted}`,
			);
		}

		// Validate position ordering
		if (position < 0) {
			throw new Error(`Position ${position} at index ${i} cannot be negative`);
		}
		if (position <= previousPos) {
			throw new Error(
				`Position ${position} at index ${i} must be > previous end position ${previousPos}`,
			);
		}

		// Validate deletion doesn't exceed next position or final position
		const deletionEnd = position + deleted.length;
		const nextIndex = i + 3;
		if (nextIndex < parts.length - 1) {
			// There's a next operation
			const nextPos = parts[nextIndex] as number;
			if (deletionEnd > nextPos) {
				throw new Error(
					`Deletion at position ${position} extends to ${deletionEnd}, exceeding next position ${nextPos}`,
				);
			}
		} else {
			// This is the last operation, check against final position
			if (deletionEnd > finalPos) {
				throw new Error(
					`Deletion at position ${position} extends to ${deletionEnd}, exceeding final position ${finalPos}`,
				);
			}
		}

		previousPos = deletionEnd;
	}

	// Validate final position is reachable
	if (previousPos > finalPos) {
		throw new Error(
			`Operations extend to position ${previousPos}, exceeding final position ${finalPos}`,
		);
	}
}
