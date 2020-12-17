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


// TODO: better names for arguments?
function consolidate(
	subseq1: Subseq1,
	text1: string,
	subseq2: Subseq1,
	text2: string,
): [Subseq1, string] {
	let i1 = 0;
	let i2 = 0;
	let text = "";
	subseq1.align(subseq2).forEach(([l, f1, f2]) => {
		if (f1 && f2) {
			throw new Error("Overlapping subseqs");
		} else if (f1) {
			text += text1.slice(i1, l);
			i1 += l;
		} else if (f2) {
			text += text2.slice(i2, l);
			i2 += l;
		}
	});

	return [subseq1.union(subseq2), text];
}

function erase(
	subseq1: Subseq1,
	text: string,
	subseq2: Subseq1,
): string {
	let i = 0;
	let text1 = "";
	subseq1.align(subseq2).forEach(([l, f1, f2]) => {
		if (f1) {
			if (!f2) {
				text1 += text.slice(i, i + l);
			}

			i += l;
		}
	});

	return text1;
}

function commonPrefix(text1: string, text2: string): string {
	const length = Math.min(text1.length, text2.length);
	for (let i = 0; i < length; i++) {
		if (text1[i] !== text2[i]) {
			return text1.slice(0, i);
		}
	}

	return text1.slice(0, length);
}

function overlapping(
	subseq1: Subseq1,
	text1: string,
	subseq2: Subseq1,
	text2: string,
): [Subseq1] {
	let i1 = 0;
	let i2 = 0;
	let prevL = 0;
	let prevF1 = false;
	const segments1: Array<number> = [];
	const segments2: Array<number> = [];
	subseq1.align(subseq2).forEach(([l, f1, f2]) => {
		if (prevF1 && f2) {
			const prefix = commonPrefix(text1.slice(i1, prevL), text2.slice(i2, l));
			appendSegment(segments1, prefix.length, true);
			appendSegment(segments1, prevL - prefix.length, false);
			appendSegment(segments2, prefix.length, true);
			appendSegment(segments2, l - prefix.length, false);
		} else {
			appendSegment(segments1, prevL, false);
			appendSegment(segments2, l, false);
		}

		if (prevF1) {
			i1 += prevL;
		}

		if (f2) {
			i2 += l;
		}

		prevL = l;
		prevF1 = f1;
	});

	appendSegment(segments1, prevL, false);
	return [new Subseq1(segments1), new Subseq1(segments2)];
}

// TODO: should the patch class be the FactoredPatch
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

	/**
	 * Composes two consecutive patches.
	 */
	compose(that: Patch1): Patch1 {
		let {
			insertSeq: insertSeq1,
			deleteSeq: deleteSeq1,
			inserted: inserted1,
			deleted: deleted1,
		} = this.factor();
		let {
			insertSeq: insertSeq2,
			deleteSeq: deleteSeq2,
			inserted: inserted2,
			deleted: deleted2,
		} = that.factor();
		deleteSeq1 = deleteSeq1.expand(insertSeq1);
		deleteSeq2 = deleteSeq2.expand(deleteSeq1);
		// handle toggles
		const toggleSeq = insertSeq1.intersection(deleteSeq2);
		if (toggleSeq.includedSize) {
			deleteSeq1 = deleteSeq1.shrink(toggleSeq);
			inserted1 = erase(
				insertSeq1,
				inserted1,
				toggleSeq,
			);
			insertSeq1 = insertSeq1.shrink(toggleSeq);
			deleteSeq2 = deleteSeq2.shrink(toggleSeq);
			insertSeq2 = insertSeq2.shrink(toggleSeq.expand(insertSeq2));
		}

		[deleteSeq1, insertSeq2] = deleteSeq1.interleave(insertSeq2);
		deleteSeq2 = deleteSeq2.expand(insertSeq2);

		// handle overlaps
		if (deleted1 != null) {
			const [deleteOverlap, insertOverlap] = overlapping(
				deleteSeq1,
				deleted1,
				insertSeq2,
				inserted2,
			);
			if (deleteOverlap.includedSize) {
				deleted1 = erase(deleteSeq1, deleted1, deleteOverlap);
				deleteSeq1 = deleteSeq1.difference(deleteOverlap).shrink(insertOverlap);
				inserted2 = erase(insertSeq2, inserted2, insertOverlap);
				insertSeq2 = insertSeq2.shrink(insertOverlap);
				// TODO: is this logic correct?
				deleteSeq2 = deleteSeq2.shrink(deleteOverlap);
			}
		}

		const [insertSeq, inserted] = consolidate(
			insertSeq1.expand(insertSeq2),
			inserted1,
			insertSeq2,
			inserted2,
		);
		let deleteSeq: Subseq1, deleted: string | undefined;
		if (deleted1 == null || deleted2 == null) {
			deleteSeq = deleteSeq1.union(deleteSeq2);
		} else {
			try {
			[deleteSeq, deleted] = consolidate(
				deleteSeq1,
				deleted1,
				deleteSeq2,
				deleted2,
			);
			} catch (err) {
				console.log(deleteSeq1, deleteSeq2);
				throw err;
			}
		}

		deleteSeq = deleteSeq.shrink(insertSeq);
		return Patch1.synthesize({insertSeq, deleteSeq, inserted, deleted});
	}

	transform(that: Patch1): [Patch1, Patch1] {
		throw "TODO";
	}
}
