/*
 * This module provides utility functions for building and operating on
 * “subsequences.” Subsequences are created by taking zero or more elements
 * from a sequence while preserving the order of the remaining elements. While
 * this specific module does not care about what those sequences actually are,
 * for the purposes of this library, sequences are always strings, measured in
 * UTF-16 code units, and subsequences can be used to represent operations over
 * the entire string like insertions and deletions.
 *
 * We define subsequences as arrays of numbers, where each number represents
 * the length of a continguous segment from the original sequence. These number
 * alternate between representing excluded and included segments from the
 * original sequence, with the first number representing the length of an
 * excluded segment. In other words, the first segment represents an excluded
 * segment, the second included, the third excluded, etc.
 *
 * Given the string sequence "abcdefgh", the following subsequence arrays
 * represent the indicated strings.
 *
 *   [0, 4, 4] = "abcd"
 *   [4, 4] = "efgh"
 *   [0, 2, 2, 2, 2] = "ab" "ef"
 *   [2, 2, 2, 2] = "cd" "gh"
 *   [0, 1, 6, 1] = "a" "h"
 *   [1, 1, 1, 1, 1, 1, 1, 1] = "b" "d" "f" "h"
 *
 * Because the first segment is always excluded, a subsequence array will start
 * with a 0 if the subsequence to indicate that the first element of the
 * sequence is included. No other 0s will appear in a well-constructed
 * subsequence array.
 *
 * This module is private to the revise package and separate from "./edit.js"
 * for testing purposes.
 */
export type Subseq = Array<number>;

export function measure(
	subseq: Subseq,
): {length: number; includedLength: number; excludedLength: number} {
	let length = 0,
		includedLength = 0,
		excludedLength = 0;
	for (let i = 0; i < subseq.length; i++) {
		const s = subseq[i];
		length += s;
		if (i % 2 === 0) {
			excludedLength += s;
		} else {
			includedLength += s;
		}
	}

	return {length, includedLength, excludedLength};
}

export function pushSegment(
	subseq: Subseq,
	length: number,
	included: boolean,
): void {
	if (length < 0) {
		throw new RangeError("Negative length");
	} else if (length === 0) {
		return;
	} else if (!subseq.length) {
		if (included) {
			subseq.push(0, length);
		} else {
			subseq.push(length);
		}
	} else {
		const included1 = subseq.length % 2 === 0;
		if (included === included1) {
			subseq[subseq.length - 1] += length;
		} else {
			subseq.push(length);
		}
	}
}

///** A utility method to debug subseqs. */
//function print(subseq: Subseq): string {
//	let result = "";
//	for (let i = 0; i < subseq.length; i++) {
//		if (i % 2 === 0) {
//			result += "=".repeat(subseq[i]);
//		} else {
//			result += "+".repeat(subseq[i]);
//		}
//	}
//
//	return result;
//}

export function contains(subseq: Subseq, index: number): boolean {
	if (index < 0) {
		return false;
	}

	for (let i = 0; i < subseq.length; i++) {
		index -= subseq[i];
		if (index < 0) {
			return i % 2 === 1;
		}
	}

	return false;
}

export function clear(subseq: Subseq): Subseq {
	const {length} = measure(subseq);
	return length ? [length] : [];
}

export function fill(subseq: Subseq): Subseq {
	const {length} = measure(subseq);
	return length ? [0, length] : [];
}

export function complement(subseq: Subseq): Subseq {
	return subseq[0] === 0 ? subseq.slice(1) : [0, ...subseq];
}

export function align(
	subseq1: Subseq,
	subseq2: Subseq,
): Array<[number, boolean, boolean]> {
	if (measure(subseq1).length !== measure(subseq2).length) {
		throw new Error("Length mismatch");
	}

	const result: Array<[number, boolean, boolean]> = [];
	for (
		let i1 = 0,
			i2 = 0,
			length1 = 0,
			length2 = 0,
			included1 = true,
			included2 = true;
		i1 < subseq1.length || i2 < subseq2.length;

	) {
		if (length1 === 0) {
			if (i1 >= subseq1.length) {
				throw new Error("Length mismatch");
			}

			length1 = subseq1[i1++];
			included1 = !included1;
		}

		if (length2 === 0) {
			if (i2 >= subseq2.length) {
				throw new Error("Size mismatch");
			}

			length2 = subseq2[i2++];
			included2 = !included2;
		}

		if (length1 < length2) {
			if (length1) {
				result.push([length1, included1, included2]);
			}

			length2 = length2 - length1;
			length1 = 0;
		} else if (length1 > length2) {
			if (length2) {
				result.push([length2, included1, included2]);
			}

			length1 = length1 - length2;
			length2 = 0;
		} else {
			if (length1) {
				result.push([length1, included1, included2]);
			}

			length1 = length2 = 0;
		}
	}

	return result;
}

export function union(subseq1: Subseq, subseq2: Subseq): Subseq {
	const result: Subseq = [];
	for (const [length, included1, included2] of align(subseq1, subseq2)) {
		pushSegment(result, length, included1 || included2);
	}

	return result;
}

export function intersection(subseq1: Subseq, subseq2: Subseq): Subseq {
	const result: Subseq = [];
	for (const [length, included1, included2] of align(subseq1, subseq2)) {
		pushSegment(result, length, included1 && included2);
	}

	return result;
}

export function difference(subseq1: Subseq, subseq2: Subseq): Subseq {
	const result: Array<number> = [];
	for (const [length, included1, included2] of align(subseq1, subseq2)) {
		pushSegment(result, length, included1 && !included2);
	}

	return result;
}

export function shrink(subseq1: Subseq, subseq2: Subseq): Subseq {
	if (measure(subseq1).length !== measure(subseq2).length) {
		throw new Error("Length mismatch");
	}

	const result: Subseq = [];
	for (const [length, included1, included2] of align(subseq1, subseq2)) {
		if (!included2) {
			pushSegment(result, length, included1);
		}
	}

	return result;
}

export function expand(subseq1: Subseq, subseq2: Subseq): Subseq {
	if (measure(subseq1).length !== measure(subseq2).excludedLength) {
		throw new Error("Length mismatch");
	}

	const result: Array<number> = [];
	for (
		let i1 = 0, i2 = 0, length1 = 0, included1 = true, included2 = true;
		i2 < subseq2.length;
		i2++
	) {
		let length2 = subseq2[i2];
		included2 = !included2;
		if (included2) {
			pushSegment(result, length2, false);
		} else {
			while (length2) {
				if (length1 === 0) {
					length1 = subseq1[i1++];
					included1 = !included1;
				}

				const minLength = Math.min(length1, length2);
				pushSegment(result, minLength, included1);
				length1 -= minLength;
				length2 -= minLength;
			}
		}
	}

	return result;
}

export function interleave(subseq1: Subseq, subseq2: Subseq): [Subseq, Subseq] {
	if (measure(subseq1).excludedLength !== measure(subseq2).excludedLength) {
		throw new Error("Length mismatch");
	}

	const result1: Array<number> = [];
	const result2: Array<number> = [];
	for (
		let i1 = 0,
			i2 = 0,
			length1 = 0,
			length2 = 0,
			included1 = true,
			included2 = true;
		i1 < subseq1.length || i2 < subseq2.length;

	) {
		if (length1 === 0 && i1 < subseq1.length) {
			length1 = subseq1[i1++];
			included1 = !included1;
		}

		if (length2 === 0 && i2 < subseq2.length) {
			length2 = subseq2[i2++];
			included2 = !included2;
		}

		if (included1 && included2) {
			pushSegment(result1, length1, true);
			pushSegment(result1, length2, false);
			pushSegment(result2, length1, false);
			pushSegment(result2, length2, true);
			length1 = length2 = 0;
		} else if (included1) {
			pushSegment(result1, length1, true);
			pushSegment(result2, length1, false);
			length1 = 0;
		} else if (included2) {
			pushSegment(result1, length2, false);
			pushSegment(result2, length2, true);
			length2 = 0;
		} else {
			const minLength = Math.min(length1, length2);
			pushSegment(result1, minLength, false);
			pushSegment(result2, minLength, false);
			length1 -= minLength;
			length2 -= minLength;
		}
	}

	return [result1, result2];
}
