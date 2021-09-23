import {ContentArea} from '../components/contentarea.js';
import type {Keyer} from '@bikeshaving/revise/keyer.js';
import {createElement} from '@bikeshaving/crank/crank.js';
import type {Context, Element} from '@bikeshaving/crank/crank.js';
import {renderer} from '@bikeshaving/crank/dom.js';

/*** Prism Logic ***/
import Prism from 'prismjs';
import type {Token} from 'prismjs';
import 'prismjs/components/prism-typescript';
import 'prismjs/themes/prism.css';

// @ts-ignore
Prism.manual = true;
function wrapContent(
	content: Array<Token | string> | Token | string,
): Array<Token | string> {
	return Array.isArray(content) ? content : [content];
}

function unwrapContent(
	content: Array<Token | string>,
): Array<Token | string> | string {
	if (content.length === 0) {
		return '';
	} else if (content.length === 1 && typeof content[0] === 'string') {
		return content[0];
	}

	return content;
}

function splitLinesRec(
	tokens: Array<Token | string>,
): Array<Array<Token | string>> {
	let currentLine: Array<Token | string> = [];
	const lines: Array<Array<Token | string>> = [currentLine];
	for (let i = 0; i < tokens.length; i++) {
		const token = tokens[i];
		if (typeof token === 'string') {
			const split = token.split(/\r\n|\r|\n/);
			for (let j = 0; j < split.length; j++) {
				if (j > 0) {
					lines.push((currentLine = []));
				}

				const token1 = split[j];
				if (token1) {
					currentLine.push(token1);
				}
			}
		} else {
			const split = splitLinesRec(wrapContent(token.content));
			if (split.length > 1) {
				for (let j = 0; j < split.length; j++) {
					if (j > 0) {
						lines.push((currentLine = []));
					}

					const line = split[j];
					if (line.length) {
						const token1 = new Prism.Token(
							token.type,
							unwrapContent(line),
							token.alias,
						);
						token1.length = line.reduce((l, t) => l + t.length, 0);
						currentLine.push(token1);
					}
				}
			} else {
				currentLine.push(token);
			}
		}
	}

	return lines;
}

export function splitLines(
	tokens: Array<Token | string>,
): Array<Array<Token | string>> {
	const lines = splitLinesRec(tokens);
	// Dealing with trailing newlines
	if (!lines[lines.length - 1].length) {
		lines.pop();
	}

	return lines;
}

function printTokens(tokens: Array<Token | string>): Array<Element | string> {
	const result: Array<Element | string> = [];
	for (let i = 0; i < tokens.length; i++) {
		const token = tokens[i];
		if (typeof token === 'string') {
			result.push(token);
		} else {
			const children = Array.isArray(token.content)
				? printTokens(token.content)
				: token.content;
			result.push(<span class={'token ' + token.type}>{children}</span>);
		}
	}

	return result;
}

function printLines(
	lines: Array<Array<Token | string>>,
	keyer: Keyer,
): Array<Element> {
	let cursor = 0;
	return lines.map((line) => {
		const key = keyer.keyAt(cursor);
		const length = line.reduce((l, t) => l + t.length, 0);
		cursor += length + 1;
		return (
			<div style="font-family: monospace" crank-key={key}>
				<code>
					<span>{printTokens(line)}</span>
				</code>
				<br />
			</div>
		);
	});
}

const initial = `
	import {Subseq} from "./subseq";

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

export interface InsertOperation {
	type: "insert";
	start: number;
	value: string;
}

export type Operation = RetainOperation | DeleteOperation | InsertOperation;

/**
 * A data structure which represents edits to strings.
 */
export class Edit {
	/**
	 * An array of strings and numbers representing operations.
	 */
	parts: Array<string | number>;

	/**
	 * A string which represents a concatenation of all deletions.
	 *
	 * This property must be provided if you want to invert the edit.
	 */
	deleted: string | undefined;

	constructor(parts: Array<string | number>, deleted?: string) {
		this.parts = parts;
		this.deleted = deleted;
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

	static diff(text1: string, text2: string, hint?: number): Edit {
		let prefix = commonPrefixLength(text1, text2);
		let suffix = commonSuffixLength(text1, text2);
		if (prefix + suffix > Math.min(text1.length, text2.length)) {
			// prefix and suffix overlap when edits are runs of the same character.
			if (hint !== undefined && hint > -1) {
				prefix = Math.min(prefix, hint);
			}

			// TODO: We can probably avoid the commonSuffixLength() call here in
			// favor of arithmetic.
			suffix = commonSuffixLength(text1.slice(prefix), text2.slice(prefix));
		}

		return Edit.build(
			text1,
			text2.slice(prefix, text2.length - suffix),
			prefix,
			text1.length - suffix,
		);
	}

	/**
	 * A string which represents a concatenation of all insertions.
	 */
	get inserted(): string {
		let text = "";
		for (let i = 0; i < this.parts.length; i++) {
			if (typeof this.parts[i] === "string") {
				text += this.parts[i];
			}
		}

		return text;
	}

	get operations(): Array<Operation> {
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

		Object.defineProperty(this, "operations", {
			value: operations,
			writable: false,
			configurable: false,
		});

		return operations;
	}

	apply(text: string): string {
		let text1 = "";
		for (let i = 0; i < this.operations.length; i++) {
			const op = this.operations[i];
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

	factor(): [Subseq, string, Subseq, string | undefined] {
		const insertSizes: Array<number> = [];
		const deleteSizes: Array<number> = [];
		let inserted = "";
		for (let i = 0; i < this.operations.length; i++) {
			const op = this.operations[i];
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
		return [insertSeq, inserted, deleteSeq, this.deleted];
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
		for (let i = 0; i < this.operations.length; i++) {
			const op = this.operations[i];
			switch (op.type) {
				case "insert":
					prevInserted = op.value;
					break;
				case "retain":
					if (prevInserted !== undefined) {
						Subseq.pushSegment(insertSizes, prevInserted.length, true);
						inserted += prevInserted;
						prevInserted = undefined;
					}

					Subseq.pushSegment(insertSizes, op.end - op.start, false);
					Subseq.pushSegment(deleteSizes, op.end - op.start, false);
					break;
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
				default:
					throw new TypeError("Invalid operation type");
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

	/**
	 * Composes two consecutive edits.
	 */
	compose(that: Edit): Edit {
		let [insertSeq1, inserted1, deleteSeq1, deleted1] = this.factor();
		let [insertSeq2, inserted2, deleteSeq2, deleted2] = that.factor();
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

		let [insertSeq, inserted, deleteSeq, deleted] = this.factor();
		deleteSeq = deleteSeq.expand(insertSeq);
		insertSeq = insertSeq.shrink(deleteSeq);
		return Edit.synthesize(deleteSeq, deleted!, insertSeq, inserted);
	}
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

/**
 * @returns The length of the common prefix between two strings.
 */
function commonPrefixLength(text1: string, text2: string) {
	const length = Math.min(text1.length, text2.length);
	for (let i = 0; i < length; i++) {
		if (text1[i] !== text2[i]) {
			return i;
		}
	}
	return length;
}

/**
 * @returns The length of the common suffix between two strings.
 */
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
`.trimLeft();

function CodeBlock(this: Context, {value}: {value: string}) {
	const lines = splitLines(Prism.tokenize(value, Prism.languages.typescript));
	const keyer = this.consume('ContentAreaKeyer');
	return (
		<pre class="editable" contenteditable="true" spellcheck="false">
			{printLines(lines, keyer)}
		</pre>
	);
}

function* App(this: Context) {
	let value = initial;
	this.addEventListener('contentchange', (ev: any) => {
		if (ev.detail.source === 'render') {
			return;
		}

		value = ev.target.value;
		this.refresh();
	});

	for ({} of this) {
		yield (
			<div class="app">
				<p>Using content-area with Prism.js.</p>
				<ContentArea value={value} renderSource="render">
					<CodeBlock value={value} />
				</ContentArea>
			</div>
		);
	}
}

renderer.render(<App />, document.getElementById('root')!);
