/**
 * This type is used to represent subsequences. Subsequences are derived from
 * other sequences by removing zero or more elements from the original sequence
 * without changing the order of remaining elements.
 *
 * Subsequences are arrays of numbers, where each number represents the length
 * of a continguous, adjacent segment from the original sequence. The subsequence
 * “contains” a segment based on the index of that segment within the array.
 * Segments alternate between being excluded and included, with the first number
 * representing an excluded segment. In other words, the first segment is
 * excluded, the second included, the third excluded and so on. A subsequence
 * array will start with a 0 when the subsequence includes the first element of
 * the sequence. However, no segments will be of length zero elsewhere in the
 * array.
 *
 * @example
 * Given the following string sequence: "abcdefgh"
 * The following subsequence arrays represent the following subsequences:
 *
 * [0, 4, 4]                = "abcd"
 * [4, 4]                   = "efgh"
 * [0, 2, 2, 2, 2]          = "abef"
 * [2, 2, 2, 2]             = "cdgh"
 * [0, 1, 6, 1]             = "ah"
 * [1, 1, 1, 1, 1, 1, 1, 1] = "bdfh"
 */
export type Subseq = Array<number>;

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

// TODO: implement and use a generic Seq type which covers arrays and strings

// [length: number, flags: ...boolean[]]
export type Segment = [number, ...boolean[]];

// TODO: is it possible to make this function variadic so we don’t need zip?
export function* segments(subseq: Subseq): IterableIterator<Segment> {
	let flag = false;
	for (const length of subseq) {
		if (length > 0) {
			yield [length, flag];
		}
		flag = !flag;
	}
}

export function print(subseq: Subseq): string {
	let result = "";
	for (const [length, flag] of segments(subseq)) {
		result += flag ? "+".repeat(length) : "=".repeat(length);
	}
	return result;
}

// WeakMap<Subseq, [falseCount: number, trueCount: number]>
const counts = new WeakMap<Subseq, [number, number]>();

export function count(subseq: Subseq, test?: boolean): number {
	let falseCount = 0;
	let trueCount = 0;
	if (counts.has(subseq)) {
		[falseCount, trueCount] = counts.get(subseq)!;
	} else {
		for (const [length, flag] of segments(subseq)) {
			if (flag) {
				trueCount += length;
			} else {
				falseCount += length;
			}
		}
		counts.set(subseq, [falseCount, trueCount]);
	}
	return test == null ? trueCount + falseCount : test ? trueCount : falseCount;
}

export function push(subseq: Subseq, length: number, flag: boolean): number {
	if (length < 0) {
		throw new RangeError("Negative length");
	} else if (length === 0) {
		return subseq.length;
	} else if (!subseq.length) {
		if (flag) {
			subseq.push(0, length);
		} else {
			subseq.push(length);
		}
	} else {
		const flag1 = subseq.length % 2 === 0;
		if (flag === flag1) {
			subseq[subseq.length - 1] += length;
		} else {
			subseq.push(length);
		}
	}
	if (counts.has(subseq)) {
		let [falseCount, trueCount] = counts.get(subseq)!;
		if (flag) {
			trueCount += length;
		} else {
			falseCount += length;
		}
		counts.set(subseq, [falseCount, trueCount]);
	} else {
		count(subseq);
	}
	return subseq.length;
}

export function clear(length: number | Subseq): Subseq {
	if (typeof length !== "number") {
		length = count(length);
	}
	const result: Subseq = [];
	push(result, length, false);
	return result;
}

export function fill(length: number | Subseq): Subseq {
	if (typeof length !== "number") {
		length = count(length);
	}
	const result: Subseq = [];
	push(result, length, true);
	return result;
}

export function complement(subseq: Subseq): Subseq {
	let result: Subseq;
	if (!subseq.length) {
		return subseq;
	} else if (subseq[0] === 0) {
		result = subseq.slice(1);
	} else {
		result = [0].concat(subseq);
	}
	if (counts.has(subseq)) {
		const [falseCount, trueCount] = counts.get(subseq)!;
		counts.set(result, [trueCount, falseCount]);
	} else {
		count(result);
	}
	return result;
}

// TODO: zip more than two subseqs
export function* zip(
	subseq1: Subseq,
	subseq2: Subseq,
): IterableIterator<Segment> {
	const segs1 = segments(subseq1);
	const segs2 = segments(subseq2);
	let it1 = segs1.next();
	let it2 = segs2.next();
	while (!it1.done || !it2.done) {
		const [length1, flag1] = it1.value;
		const [length2, flag2] = it2.value;
		const length = Math.min(length1, length2);
		if (length1 - length > 0) {
			it1.value[0] -= length;
		} else {
			it1 = segs1.next();
		}
		if (length2 - length > 0) {
			it2.value[0] -= length;
		} else {
			it2 = segs2.next();
		}
		yield [length, flag1, flag2];
	}
	if (!it1.done || !it2.done) {
		throw new Error("Length mismatch");
	}
}

export function join(
	segs: Iterable<Segment>,
	fn: (...flags: boolean[]) => boolean,
): Subseq {
	const result: Subseq = [];
	for (const [length, ...flags] of segs) {
		push(result, length, fn(...flags));
	}
	return result;
}

export function union(subseq1: Subseq, subseq2: Subseq): Subseq {
	if (count(subseq1) !== count(subseq2)) {
		throw new Error("Length mismatch");
	}
	return join(zip(subseq1, subseq2), (flag1, flag2) => flag1 || flag2);
}

export function intersection(subseq1: Subseq, subseq2: Subseq): Subseq {
	if (count(subseq1) !== count(subseq2)) {
		throw new Error("Length mismatch");
	}

	return join(zip(subseq1, subseq2), (flag1, flag2) => flag1 && flag2);
}

export function difference(subseq1: Subseq, subseq2: Subseq): Subseq {
	if (count(subseq1) !== count(subseq2)) {
		throw new Error("Length mismatch");
	}
	return join(zip(subseq1, subseq2), (flag1, flag2) => flag1 && !flag2);
}

export function expand(
	subseq1: Subseq,
	subseq2: Subseq,
	options: {union?: boolean} = {},
): Subseq {
	if (count(subseq1) !== count(subseq2, false)) {
		throw new Error("Length mismatch");
	}
	const result: Subseq = [];
	let length1: number | undefined;
	let flag1: boolean;
	const iter = segments(subseq1);
	for (let [length2, flag2] of segments(subseq2)) {
		if (flag2) {
			push(result, length2, !!options.union);
		} else {
			while (length2 > 0) {
				if (length1 == null || length1 === 0) {
					const it = iter.next();
					if (it.done) {
						throw new Error("Length mismatch");
					}
					[length1, flag1] = it.value;
				}
				const length = Math.min(length1, length2);
				push(result, length, flag1!);
				length1 -= length;
				length2 -= length;
			}
		}
	}
	if (!iter.next().done || (length1 != null && length1 > 0)) {
		throw new Error("Length mismatch");
	}
	return result;
}

export function shrink(subseq1: Subseq, subseq2: Subseq): Subseq {
	if (count(subseq1) !== count(subseq2)) {
		throw new Error("Length mismatch");
	}
	const result: Subseq = [];
	for (const [length, flag1, flag2] of zip(subseq1, subseq2)) {
		if (!flag2) {
			push(result, length, flag1);
		}
	}
	return result;
}

export function interleave(subseq1: Subseq, subseq2: Subseq): [Subseq, Subseq] {
	if (count(subseq1, false) !== count(subseq2, false)) {
		throw new Error("Length mismatch");
	}

	const segs1 = segments(subseq1);
	const segs2 = segments(subseq2);
	let it1 = segs1.next();
	let it2 = segs2.next();
	const result1: Subseq = [];
	const result2: Subseq = [];
	while (!it1.done && !it2.done) {
		const [length1, flag1] = it1.value;
		const [length2, flag2] = it2.value;
		if (flag1 && flag2) {
			push(result1, length1, true);
			push(result1, length2, false);
			push(result2, length1, false);
			push(result2, length2, true);
			it1 = segs1.next();
			it2 = segs2.next();
		} else if (flag1) {
			push(result1, length1, true);
			push(result2, length1, false);
			it1 = segs1.next();
		} else if (flag2) {
			push(result1, length2, false);
			push(result2, length2, true);
			it2 = segs2.next();
		} else {
			const length = Math.min(length1, length2);
			push(result1, length, false);
			push(result2, length, false);
			if (length1 - length > 0) {
				it1.value[0] -= length;
			} else {
				it1 = segs1.next();
			}
			if (length2 - length > 0) {
				it2.value[0] -= length;
			} else {
				it2 = segs2.next();
			}
		}
	}
	if (!it1.done) {
		const [length1, flag1] = it1.value;
		if (!flag1 || !segs1.next().done) {
			throw new Error("Length mismatch");
		}
		push(result1, length1, true);
		push(result2, length1, false);
	} else if (!it2.done) {
		const [length2, flag2] = it2.value;
		if (!flag2 || !segs2.next().done) {
			throw new Error("Length mismatch");
		}
		push(result1, length2, false);
		push(result2, length2, true);
	}
	return [result1, result2];
}

export function split(text: string, subseq: Subseq): [string, string] {
	if (text.length !== count(subseq)) {
		throw new Error("Length mismatch");
	}
	let consumed = 0;
	let textFalse = text.slice(0, 0);
	let textTrue = text.slice(0, 0);
	for (const [length, flag] of segments(subseq)) {
		if (flag) {
			textTrue += text.slice(consumed, consumed + length);
		} else {
			textFalse += text.slice(consumed, consumed + length);
		}
		consumed += length;
	}
	return [textFalse, textTrue];
}

export function merge(
	textFalse: string,
	textTrue: string,
	subseq: Subseq,
): string {
	if (textFalse.length !== count(subseq, false)) {
		throw new Error("Length mismatch");
	} else if (textTrue.length !== count(subseq, true)) {
		throw new Error("Length mismatch");
	}
	let text = textFalse.slice(0, 0);
	let consumedFalse = 0;
	let consumedTrue = 0;
	for (const [length, flag] of segments(subseq)) {
		if (flag) {
			text += textTrue.slice(consumedTrue, consumedTrue + length);
			consumedTrue += length;
		} else {
			text += textFalse.slice(consumedFalse, consumedFalse + length);
			consumedFalse += length;
		}
	}
	return text;
}

export function shuffle(
	text1: string,
	text2: string,
	subseq1: Subseq,
	subseq2: Subseq,
): [string, string] {
	return split(merge(text1, text2, subseq1), subseq2);
}

// TODO: it would be nice if we could figure out a way to reuse union and shrink for consolidate/erase
export function consolidate(
	text1: string,
	text2: string,
	subseq1: Subseq,
	subseq2: Subseq,
): [string, Subseq] {
	let text = "";
	const subseq: Subseq = [];
	let consumed1 = 0;
	let consumed2 = 0;
	for (const [length, flag1, flag2] of zip(subseq1, subseq2)) {
		if (flag1 && flag2) {
			throw new Error("cannot consolidate overlapping subseqs");
		} else if (flag1) {
			text += text1.slice(consumed1, consumed1 + length);
			consumed1 += length;
		} else if (flag2) {
			text += text2.slice(consumed2, consumed2 + length);
			consumed2 += length;
		}
		push(subseq, length, flag1 || flag2);
	}
	return [text, subseq];
}

export function erase(
	text: string,
	subseq1: Subseq,
	subseq2: Subseq,
): [string, Subseq] {
	let text1 = "";
	const subseq: Subseq = [];
	let consumed = 0;
	for (const [length, flag1, flag2] of zip(subseq1, subseq2)) {
		if (flag1) {
			if (!flag2) {
				text1 += text.slice(consumed, consumed + length);
			}
			consumed += length;
		}
		if (!flag2) {
			push(subseq, length, flag1);
		}
	}
	return [text1, subseq];
}

export function contains(subseq: Subseq, i: number): boolean {
	if (i < 0) {
		throw new RangeError("index out of range");
	}
	for (const [length, flag] of segments(subseq)) {
		i -= length;
		if (i < 0) {
			return flag;
		}
	}
	return false;
}

export function advance(i: number, subseq: Subseq): number {
	if (i < 0) {
		throw new RangeError("index out of range");
	}
	let consumed = 0;
	for (const [length, flag] of segments(subseq)) {
		if (consumed <= i) {
			if (flag) {
				i += length;
			}
		} else {
			break;
		}
		consumed += length;
	}
	return i;
}

export function retreat(i: number, subseq: Subseq): number {
	if (i < 0) {
		throw new RangeError("index out of range");
	}
	let consumed = 0;
	for (const [length, flag] of segments(subseq)) {
		if (consumed <= i) {
			if (flag) {
				i = Math.max(consumed, i - length);
			} else {
				consumed += length;
			}
		} else {
			break;
		}
	}
	return i;
}
