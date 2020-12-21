/**
 * @param sizes {Array.<number>}
 * @param size {number}
 * @param flag {boolean}
 *
 * @returns {undefined}
 */
function pushSegment(sizes, size, flag) {
	if (size < 0) {
		throw new RangeError("Negative size");
	} else if (size === 0) {
		return;
	} else if (!sizes.length) {
		if (flag) {
			sizes.push(0, size);
		} else {
			sizes.push(size);
		}
	} else {
		const flag1 = sizes.length % 2 === 0;
		if (flag === flag1) {
			sizes[sizes.length - 1] += size;
		} else {
			sizes.push(size);
		}
	}
}

/**
 * @param sizes {Array.<number>}
 *
 * @returns {[number, number, number]}
 */
function measure(sizes) {
	let size = 0,
		includedSize = 0,
		excludedSize = 0;
	for (let i = 0; i < sizes.length; i++) {
		const s = sizes[i];
		size += s;
		if (i % 2 === 0) {
			excludedSize += s;
		} else {
			includedSize += s;
		}
	}

	return [size, includedSize, excludedSize];
}

/**
 * A data structure for representing subsequences. Subsequences are parts of
 * other sequences, created by removing zero or more elements from the original
 * sequence without changing the order of remaining elements.
 * The sizes property is an array of numbers, where each number represents the
 * size of a continguous segment from the original sequence. The subsequence
 * “contains” a segment based on its position in this array. Segments alternate
 * between excluded and included, with the first number representing the size
 * of an excluded segment. In other words, the first segment is excluded, the
 * second included, the third excluded and so on.
 *
 * Because the first segment is always an excluded segment, a subsequence
 * array will start with a 0 when the subsequence includes the first
 * element of the sequence. No other segments will be of size 0 in the
 * array.
 *
 * @example Given the sequence "abcdefgh", the following size arrays represent
 * the following subsequences:
 *
 * [0, 4, 4]                = "abcd"
 * [4, 4]                   = "efgh"
 * [0, 2, 2, 2, 2]          = "abef"
 * [2, 2, 2, 2]             = "cdgh"
 * [0, 1, 6, 1]             = "ah"
 * [1, 1, 1, 1, 1, 1, 1, 1] = "bdfh"
 */
export class Subseq {
	static pushSegment = pushSegment;

	/** @param {Array.<number>} sizes */
	constructor(sizes) {
		const [size, includedSize, excludedSize] = measure(sizes);
		/** @type {Array.<number>} */
		this.sizes = sizes;
		this.size = size;
		this.includedSize = includedSize;
		this.excludedSize = excludedSize;
	}

	/** @returns {string} */
	print() {
		let result = "";
		for (let i = 0; i < this.sizes.length; i++) {
			if (i % 2 === 0) {
				result += "=".repeat(this.sizes[i]);
			} else {
				result += "+".repeat(this.sizes[i]);
			}
		}

		return result;
	}

	/**
	 * @param {number} offset
	 *
	 * @returns {boolean}
	 */
	contains(offset) {
		if (offset < 0) {
			return false;
		}

		for (let i = 0; i < this.sizes.length; i++) {
			offset -= this.sizes[i];
			if (offset < 0) {
				return i % 2 === 1;
			}
		}

		return false;
	}

	/** @returns number */
	clear() {
		return new Subseq(this.size ? [this.size] : []);
	}

	/** @returns {Subseq} */
	fill() {
		return new Subseq(this.size ? [0, this.size] : []);
	}

	/** @returns {Subseq} */
	complement() {
		const sizes =
			this.sizes[0] === 0 ? this.sizes.slice(1) : [0, ...this.sizes];
		return new Subseq(sizes);
	}

	/**
	 * @param {Subseq} that
	 *
	 * @returns {Array.<[number, boolean, boolean]>}
	 */
	align(that) {
		if (this.size !== that.size) {
			throw new Error("Size mismatch");
		}

		/** @type {Array.<[number, boolean, boolean]>} */
		const result = [];
		const length1 = this.sizes.length;
		const length2 = that.sizes.length;
		for (
			let i1 = 0, i2 = 0, size1 = 0, size2 = 0, flag1 = true, flag2 = true;
			i1 < length1 || i2 < length2;

		) {
			if (size1 === 0) {
				if (i1 >= length1) {
					throw new Error("Size mismatch");
				}

				size1 = this.sizes[i1++];
				flag1 = !flag1;
			}

			if (size2 === 0) {
				if (i2 >= length2) {
					throw new Error("Size mismatch");
				}

				size2 = that.sizes[i2++];
				flag2 = !flag2;
			}

			if (size1 === size2) {
				result.push([size1, flag1, flag2]);
				size1 = size2 = 0;
			} else if (size1 < size2) {
				result.push([size1, flag1, flag2]);
				size2 = size2 - size1;
				size1 = 0;
			} else {
				result.push([size2, flag1, flag2]);
				size1 = size1 - size2;
				size2 = 0;
			}
		}

		return result;
	}

	/**
	 * @param {Subseq} that
	 *
	 * @returns {Subseq}
	 */
	union(that) {
		/** @type {Array.<number>} */
		const sizes = [];
		for (const [size, flag1, flag2] of this.align(that)) {
			pushSegment(sizes, size, flag1 || flag2);
		}

		return new Subseq(sizes);
	}

	/**
	 * @param {Subseq} that
	 *
	 * @returns {Subseq}
	 */
	intersection(that) {
		/** @type {Array.<number>} */
		const sizes = [];
		for (const [size, flag1, flag2] of this.align(that)) {
			pushSegment(sizes, size, flag1 && flag2);
		}

		return new Subseq(sizes);
	}

	/**
	 * @param {Subseq} that
	 *
	 * @returns {Subseq}
	 */
	difference(that) {
		/** @type {Array.<number>} */
		const sizes = [];
		for (const [size, flag1, flag2] of this.align(that)) {
			pushSegment(sizes, size, flag1 && !flag2);
		}

		return new Subseq(sizes);
	}

	/**
	 * @param {Subseq} that
	 *
	 * @returns {Subseq}
	 */
	shrink(that) {
		if (this.size !== that.size) {
			throw new Error("Size mismatch");
		}

		/** @type {Array.<number>} */
		const sizes = [];
		for (const [size, flag1, flag2] of this.align(that)) {
			if (!flag2) {
				pushSegment(sizes, size, flag1);
			}
		}

		return new Subseq(sizes);
	}

	/**
	 * @param {Subseq} that
	 *
	 * @returns {Subseq}
	 */
	expand(that) {
		if (this.size !== that.excludedSize) {
			throw new Error("Size mismatch");
		}

		/** @type {Array.<number>} */
		const sizes = [];
		const length1 = this.sizes.length;
		const length2 = that.sizes.length;
		for (
			let i1 = 0, i2 = 0, size1 = 0, flag1 = true, flag2 = true;
			i2 < length2;
			i2++
		) {
			let size2 = that.sizes[i2];
			flag2 = !flag2;
			if (flag2) {
				pushSegment(sizes, size2, false);
			} else {
				while (size2) {
					if (size1 === 0) {
						if (i1 >= length1) {
							throw new Error("Size mismatch");
						}

						size1 = this.sizes[i1++];
						flag1 = !flag1;
					}

					const size = Math.min(size1, size2);
					pushSegment(sizes, size, flag1);
					size1 -= size;
					size2 -= size;
				}
			}
		}

		return new Subseq(sizes);
	}

	/**
	 * @param {Subseq} that
	 *
	 * @returns {[Subseq, Subseq]}
	 */
	interleave(that) {
		if (this.excludedSize !== that.excludedSize) {
			throw new Error("Size mismatch");
		}

		/** @type {Array.<number>} */
		const sizes1 = [];
		/** @type {Array.<number>} */
		const sizes2 = [];
		const length1 = this.sizes.length;
		const length2 = that.sizes.length;
		for (
			let i1 = 0, i2 = 0, size1 = 0, size2 = 0, flag1 = true, flag2 = true;
			i1 < length1 || i2 < length2;

		) {
			if (size1 === 0 && i1 < length1) {
				size1 = this.sizes[i1++];
				flag1 = !flag1;
			}

			if (size2 === 0 && i2 < length2) {
				size2 = that.sizes[i2++];
				flag2 = !flag2;
			}

			if (flag1 && flag2) {
				pushSegment(sizes1, size1, true);
				pushSegment(sizes1, size2, false);
				pushSegment(sizes2, size1, false);
				pushSegment(sizes2, size2, true);
				size1 = size2 = 0;
			} else if (flag1) {
				pushSegment(sizes1, size1, true);
				pushSegment(sizes2, size1, false);
				size1 = 0;
			} else if (flag2) {
				pushSegment(sizes1, size2, false);
				pushSegment(sizes2, size2, true);
				size2 = 0;
			} else {
				const size = Math.min(size1, size2);
				pushSegment(sizes1, size, false);
				pushSegment(sizes2, size, false);
				size1 -= size;
				size2 -= size;
			}
		}

		return [new Subseq(sizes1), new Subseq(sizes2)];
	}
}
