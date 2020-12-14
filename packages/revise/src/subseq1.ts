export function appendSegment(
	segments: Array<number>,
	length: number,
	flag: boolean,
): void {
	if (length < 0) {
		throw new RangeError("Negative length");
	} else if (length === 0) {
		return;
	} else if (!segments.length) {
		if (flag) {
			segments.push(0, length);
		} else {
			segments.push(length);
		}
	} else {
		const flag1 = segments.length % 2 === 0;
		if (flag === flag1) {
			segments[segments.length - 1] += length;
		} else {
			segments.push(length);
		}
	}
}

/**
 * A data structure for representing subsequences. Subsequences are parts of
 * other sequences, created by removing zero or more elements from the original
 * sequence without changing the order of remaining elements.
 */
export class Subseq1 {
	/**
	 * The sum of the segments of segments of the subsequence.
	 */
	readonly size: number;

	/**
	 * The sum of the segments of the included segments of the subsequence.
	 */
	readonly includedSize: number;

	/**
	 * The sum of the segments of the excluded segments of the subsequence.
	 */
	readonly excludedSize: number;

	/**
	 * An array of numbers, where each number represents the length of a
	 * continguous, adjacent segment from the original sequence. The subsequence
	 * “contains” a segment based on the index of that segment within the array.
	 * Segments alternate between being excluded and included, with the first
	 * number representing an excluded segment. In other words, the first segment
	 * is excluded, the second included, the third excluded and so on.
	 *
	 * Because the first segment is always an excluded segment, a subsequence
	 * array will start with a 0 when the subsequence includes the first element
	 * of the sequence. However, no segments will be of length zero elsewhere in
	 * the array.
	 *
	 * @example
	 * Given the following string sequence: "abcdefgh"
	 * The following segment arrays represent the following subsequences:
	 *
	 * [0, 4, 4]                = "abcd"
	 * [4, 4]                   = "efgh"
	 * [0, 2, 2, 2, 2]          = "abef"
	 * [2, 2, 2, 2]             = "cdgh"
	 * [0, 1, 6, 1]             = "ah"
	 * [1, 1, 1, 1, 1, 1, 1, 1] = "bdfh"
	 */
	readonly segments: Array<number>;

	constructor(segments: Array<number>) {
		let size = 0;
		let includedSize = 0;
		let excludedSize = 0;
		for (let i = 0; i < segments.length; i++) {
			const s = segments[i];
			size += s;
			if (i % 2 === 0) {
				excludedSize += s;
			} else {
				includedSize += s;
			}
		}

		this.segments = segments;
		this.size = size;
		this.includedSize = includedSize;
		this.excludedSize = excludedSize;
	}

	toString(): string {
		let result = "Subseq: ";
		for (let i = 0; i < this.segments.length; i++) {
			if (i % 2 === 0) {
				result += "=".repeat(this.segments[i]);
			} else {
				result += "+".repeat(this.segments[i]);
			}
		}

		return result;
	}

	contains(offset: number): boolean {
		if (offset < 0) {
			return false;
		}

		for (let i = 0; i < this.segments.length; i++) {
			offset -= this.segments[i];
			if (offset < 0) {
				return i % 2 === 1;
			}
		}

		return false;
	}

	clear(): Subseq1 {
		const segments: Array<number> = [];
		appendSegment(segments, this.size, false);
		return new Subseq1(segments);
	}

	fill(): Subseq1 {
		const segments: Array<number> = [];
		appendSegment(segments, this.size, true);
		return new Subseq1(segments);
	}

	complement(): Subseq1 {
		const segments: Array<number> = [];
		this.segments.forEach((l, i) => appendSegment(segments, l, i % 2 === 0));
		return new Subseq1(segments);
	}

	align(that: Subseq1): Array<[number, boolean, boolean]> {
		if (this.size !== that.size) {
			throw new RangeError("Size mismatch");
		}

		const result: Array<[number, boolean, boolean]> = [];
		for (
			let i1 = 0, i2 = 0, l1 = 0, l2 = 0, f1 = true, f2 = true;
			i1 < this.segments.length || i2 < that.segments.length;
		) {
			if (l1 === 0) {
				if (i1 >= this.segments.length) {
					throw new RangeError("Size mismatch");
				}

				l1 = this.segments[i1++];
				f1 = !f1;
			}

			if (l2 === 0) {
				if (i2 >= that.segments.length) {
					throw new RangeError("Size mismatch");
				}

				l2 = that.segments[i2++];
				f2 = !f2;
			}

			if (l1 === l2) {
				result.push([l1, f1, f2]);
				l1 = l2 = 0;
			} else if (l1 < l2) {
				result.push([l1, f1, f2]);
				l2 = l2 - l1;
				l1 = 0;
			} else {
				result.push([l2, f1, f2]);
				l1 = l1 - l2;
				l2 = 0;
			}
		}

		return result;
	}

	union(that: Subseq1): Subseq1 {
		const segments: Array<number> = [];
		this.align(that).forEach(
			([l, f1, f2]) => appendSegment(segments, l, f1 || f2),
		);
		return new Subseq1(segments);
	}

	intersection(that: Subseq1): Subseq1 {
		const segments: Array<number> = [];
		this.align(that).forEach(
			([l, f1, f2]) => appendSegment(segments, l, f1 && f2),
		);
		return new Subseq1(segments);
	}

	difference(that: Subseq1): Subseq1 {
		const segments: Array<number> = [];
		this.align(that).forEach(
			([l, f1, f2]) => appendSegment(segments, l, f1 && !f2),
		);
		return new Subseq1(segments);
	}

	shrink(that: Subseq1): Subseq1 {
		if (this.size !== that.size) {
			throw new RangeError("Size mismatch");
		}

		const segments: Array<number> = [];
		this.align(that).forEach(([l, f1, f2]) => {
			if (!f2) {
				appendSegment(segments, l, f1);
			}
		});

		return new Subseq1(segments);
	}

	expand(that: Subseq1): Subseq1 {
		if (this.size !== that.excludedSize) {
			throw new RangeError("Size mismatch");
		}

		const segments: Array<number> = [];
		for (
			let i1 = 0, i2 = 0, l1 = 0, f1 = true, f2 = true;
			i2 < that.segments.length;
			i2++
		) {
			let l2 = that.segments[i2];
			f2 = !f2;
			if (f2) {
				appendSegment(segments, l2, false);
			} else {
				while (l2) {
					if (l1 === 0) {
						if (i1 >= this.segments.length) {
							throw new RangeError("Size mismatch");
						}

						l1 = this.segments[i1++];
						f1 = !f1;
					}

					const l = Math.min(l1, l2);
					appendSegment(segments, l, f1);
					l1 -= l;
					l2 -= l;
				}
			}
		}

		return new Subseq1(segments);
	}

	interleave(that: Subseq1): [Subseq1, Subseq1] {
		if (this.excludedSize !== that.excludedSize) {
			throw new RangeError("Size mismatch");
		}

		const segments1: Array<number> = [];
		const segments2: Array<number> = [];
		for (
			let i1 = 0, i2 = 0, l1 = 0, l2 = 0, f1 = true, f2 = true;
			i1 < this.segments.length || i2 < that.segments.length;
		) {
			if (l1 === 0 && i1 < this.segments.length) {
				l1 = this.segments[i1++];
				f1 = !f1;
			}

			if (l2 === 0 && i2 < that.segments.length) {
				l2 = that.segments[i2++];
				f2 = !f2;
			}

			if (f1 && f2) {
				appendSegment(segments1, l1, true);
				appendSegment(segments1, l2, false);
				appendSegment(segments2, l1, false);
				appendSegment(segments2, l2, true);
				l1 = l2 = 0;
			} else if (f1) {
				appendSegment(segments1, l1, true);
				appendSegment(segments2, l1, false);
				l1 = 0;
			} else if (f2) {
				appendSegment(segments1, l2, false);
				appendSegment(segments2, l2, true);
				l2 = 0;
			} else {
				const l = Math.min(l1, l2);
				appendSegment(segments1, l, false);
				appendSegment(segments2, l, false);
				l1 -= l;
				l2 -= l;
			}
		}

		return [new Subseq1(segments1), new Subseq1(segments2)];
	}

	/**
	 * Erases all the included segments of this which fall between the included
	 * segments of that.
	 *
	 * Not implemented.
	 */
	erase(that: Subseq1): Subseq1 {
		if (this.excludedSize !== that.size) {
			throw new RangeError("Size mismatch");
		}

		throw "TODO";
	}
}
