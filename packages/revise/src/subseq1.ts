export function appendSegment(
	lengths: Array<number>,
	length: number,
	flag: boolean,
): void {
	if (length < 0) {
		throw new RangeError("Negative length");
	} else if (length === 0) {
		return;
	} else if (!lengths.length) {
		if (flag) {
			lengths.push(0, length);
		} else {
			lengths.push(length);
		}
	} else {
		const flag1 = lengths.length % 2 === 0;
		if (flag === flag1) {
			lengths[lengths.length - 1] += length;
		} else {
			lengths.push(length);
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
	 * The sum of the lengths of segments of the subsequence.
	 */
	readonly size: number;

	/**
	 * The sum of the lengths of the included segments of the subsequence.
	 */
	readonly includedSize: number;

	/**
	 * The sum of the lengths of the excluded segments of the subsequence.
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
	readonly lengths: Array<number>;

	constructor(lengths: Array<number>) {
		let size = 0;
		let includedSize = 0;
		let excludedSize = 0;
		for (let i = 0; i < lengths.length; i++) {
			const l = lengths[i];
			size += l;
			if (i % 2 === 0) {
				excludedSize += l;
			} else {
				includedSize += l;
			}
		}

		this.lengths = lengths;
		this.size = size;
		this.includedSize = includedSize;
		this.excludedSize = excludedSize;
	}

	toString(): string {
		let result = "Subseq: ";
		for (let i = 0; i < this.lengths.length; i++) {
			if (i % 2 === 0) {
				result += "=".repeat(this.lengths[i]);
			} else {
				result += "+".repeat(this.lengths[i]);
			}
		}

		return result;
	}

	contains(offset: number): boolean {
		if (offset < 0) {
			return false;
		}

		for (let i = 0; i < this.lengths.length; i++) {
			offset -= this.lengths[i];
			if (offset < 0) {
				return i % 2 === 1;
			}
		}

		return false;
	}

	clear(): Subseq1 {
		const lengths: Array<number> = [];
		appendSegment(lengths, this.size, false);
		return new Subseq1(lengths);
	}

	fill(): Subseq1 {
		const lengths: Array<number> = [];
		appendSegment(lengths, this.size, true);
		return new Subseq1(lengths);
	}

	complement(): Subseq1 {
		const lengths: Array<number> = [];
		this.lengths.forEach((l, i) => appendSegment(lengths, l, i % 2 === 0));
		return new Subseq1(lengths);
	}

	align(
		that: Subseq1,
		callback: (l: number, f1: boolean, f2: boolean) => unknown,
	): void {
		if (this.size !== that.size) {
			throw new RangeError("Size mismatch");
		}

		for (
			let i1 = 0, i2 = 0, l1 = 0, l2 = 0, f1 = true, f2 = true;
			i1 < this.lengths.length || i2 < that.lengths.length;

		) {
			if (l1 === 0) {
				if (i1 >= this.lengths.length) {
					throw new RangeError("Size mismatch");
				}

				l1 = this.lengths[i1++];
				f1 = !f1;
			}

			if (l2 === 0) {
				if (i2 >= that.lengths.length) {
					throw new RangeError("Size mismatch");
				}

				l2 = that.lengths[i2++];
				f2 = !f2;
			}

			if (l1 === l2) {
				callback(l1, f1, f2);
				l1 = l2 = 0;
			} else if (l1 < l2) {
				callback(l1, f1, f2);
				l2 = l2 - l1;
				l1 = 0;
			} else {
				callback(l2, f1, f2);
				l1 = l1 - l2;
				l2 = 0;
			}
		}
	}

	union(that: Subseq1): Subseq1 {
		const lengths: Array<number> = [];
		this.align(that, (l, f1, f2) => appendSegment(lengths, l, f1 || f2));
		return new Subseq1(lengths);
	}

	intersection(that: Subseq1): Subseq1 {
		const lengths: Array<number> = [];
		this.align(that, (l, f1, f2) => appendSegment(lengths, l, f1 && f2));
		return new Subseq1(lengths);
	}

	difference(that: Subseq1): Subseq1 {
		const lengths: Array<number> = [];
		this.align(that, (l, f1, f2) => appendSegment(lengths, l, f1 && !f2));
		return new Subseq1(lengths);
	}

	expand(that: Subseq1): Subseq1 {
		if (this.size !== that.excludedSize) {
			throw new RangeError("Size mismatch");
		}

		const lengths: Array<number> = [];
		for (
			let i1 = 0, l1 = 0, i2 = 0, f1 = true, f2 = true;
			i2 < that.lengths.length;
			i2++
		) {
			let l2 = that.lengths[i2];
			f2 = !f2;
			if (f2) {
				appendSegment(lengths, l2, false);
			} else {
				while (l2) {
					if (l1 === 0) {
						if (i1 >= this.lengths.length) {
							throw new RangeError("Size mismatch");
						}

						l1 = this.lengths[i1++];
						f1 = !f1;
					}
					const l = Math.min(l1, l2);
					appendSegment(lengths, l, f1);
					l1 -= l;
					l2 -= l;
				}
			}
		}

		return new Subseq1(lengths);
	}

	shrink(that: Subseq1): Subseq1 {
		if (this.size !== that.size) {
			throw new RangeError("Size mismatch");
		}

		const lengths: Array<number> = [];
		this.align(that, (l, f1, f2) => {
			if (!f2) {
				appendSegment(lengths, l, f1);
			}
		});

		return new Subseq1(lengths);
	}

	interleave(that: Subseq1): [Subseq1, Subseq1] {
		if (this.excludedSize !== that.excludedSize) {
			throw new RangeError("Size mismatch");
		}

		const lengths1: Array<number> = [];
		const lengths2: Array<number> = [];
		for (
			let i1 = 0, i2 = 0, l1 = 0, l2 = 0, f1 = true, f2 = true;
			i1 < this.lengths.length || i2 < that.lengths.length;

		) {
			if (l1 === 0 && i1 < this.lengths.length) {
				l1 = this.lengths[i1++];
				f1 = !f1;
			}

			if (l2 === 0 && i2 < that.lengths.length) {
				l2 = that.lengths[i2++];
				f2 = !f2;
			}

			if (f1 && f2) {
				appendSegment(lengths1, l1, true);
				appendSegment(lengths1, l2, false);
				appendSegment(lengths2, l1, false);
				appendSegment(lengths2, l2, true);
				l1 = l2 = 0;
			} else if (f1) {
				appendSegment(lengths1, l1, true);
				appendSegment(lengths2, l1, false);
				l1 = 0;
			} else if (f2) {
				appendSegment(lengths1, l2, false);
				appendSegment(lengths2, l2, true);
				l2 = 0;
			} else {
				const l = Math.min(l1, l2);
				appendSegment(lengths1, l, false);
				appendSegment(lengths2, l, false);
				l1 -= l;
				l2 -= l;
			}
		}

		return [new Subseq1(lengths1), new Subseq1(lengths2)];
	}
}
