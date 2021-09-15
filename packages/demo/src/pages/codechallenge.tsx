import type {Child, Context} from '@bikeshaving/crank/crank.js';
import {createElement, Fragment} from '@bikeshaving/crank/crank.js';
import {renderer} from '@bikeshaving/crank/dom.js';
import {ContentAreaElement} from '@bikeshaving/revise/contentarea.js';
import type {ContentEvent} from '@bikeshaving/revise/contentarea.js';
import {Keyer} from '@bikeshaving/revise/keyer.js';
import {EditHistory} from '@bikeshaving/revise/history.js';

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
function printTokens(tokens: Array<Token | string>): Array<Child> {
	const result: Array<Child> = [];
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
): Array<Child> {
	let cursor = 0;
	return lines.map((line) => {
		const key = keyer.keyAt(cursor);
		const length = line.reduce((l, t) => l + t.length, 0);
		cursor += length + 1;
		return (
			<div crank-key={key}>
				<code>
					<span>{printTokens(line)}</span>
				</code>
				<br />
			</div>
		);
	});
}

interface ParseResult {
	before: Array<Token | string>;
	beforeMarker: string;
	editable: Array<Token | string>;
	after: Array<Token | string>;
	afterMarker: string;
}

function parseMarkers(content: string): ParseResult {
	const markerRe = /=====+\n/g;
	const beforeMatch = markerRe.exec(content);
	const afterMatch = markerRe.exec(content);
	let before = '';
	let beforeMarker = '';
	let after = '';
	let afterMarker = '';
	if (beforeMatch) {
		before = content.slice(0, beforeMatch.index);
		beforeMarker = beforeMatch[0];
	}

	if (afterMatch) {
		after = content.slice(afterMatch.index + afterMatch[0].length);
		afterMarker = afterMatch[0];
	}

	const editable = content.slice(
		before.length + beforeMarker.length,
		-(after.length + afterMarker.length),
	);

	return {
		before: Prism.tokenize(before, Prism.languages.typescript),
		beforeMarker,
		editable: Prism.tokenize(editable, Prism.languages.typescript),
		after: Prism.tokenize(after, Prism.languages.typescript),
		afterMarker,
	};
}

function parse(content: string, keyer: Keyer): any {
	const {before, beforeMarker, editable, afterMarker, after} = parseMarkers(content);
	return (
		<Fragment>
			{printLines(splitLines(before), keyer)}
			<div data-content={beforeMarker} />
			<div style="border: 1px dotted black" contenteditable="true">
				{
					editable.length <= 1 && editable[0] === "\n"
					? <br />
					: printLines(splitLines(editable), keyer)
				}
			</div>
			<div data-content={afterMarker} />
			{printLines(splitLines(after), keyer)}
		</Fragment>
	);
}

function debounce(fn: Function, ms = 50): any {
	let handle: any;
	return function (this: any) {
		let context = this,
			args = arguments;
		const wrapped = function () {
			handle = undefined;
			return fn.apply(context, args);
		};

		if (handle != null) {
			clearTimeout(handle);
		}

		handle = setTimeout(wrapped, ms);
	};
}

const challenge = `
// write a function which concatenates these two strings with a space in between
function concatenate(str1, str2) {
=====
  // TODO:
=====
}

const hello = "hello";
const world = "world";
console.log(concatenate(hello, world)); // => "hello world"
`.trimStart();

function* CodeChallenge(this: Context) {
	let content = challenge;
	let contentArea: ContentAreaElement;
	const keyer = new Keyer();
	const history = new EditHistory();
	let historyInitiated = false;
	this.addEventListener('contentchange', (ev) => {
		content = contentArea.value;
		keyer.transform(ev.detail.edit);
		if (!historyInitiated) {
			history.append(ev.detail.edit);
		}

		const {selectionStart, selectionEnd, selectionDirection} = contentArea;
		const p = this.refresh();
		if (typeof p.then !== 'undefined') {
			throw new Error('Editable children must be synchronous');
		}

		contentArea.setSelectionRange(
			selectionStart,
			selectionEnd,
			selectionDirection,
		);
	});

	// TODO: bring back the old logic where we checkpoint history based on when the cursor moves + time.
	setInterval(() => {
		history.checkpoint();
	}, 5000);

	// TODO: add a validate function
	this.addEventListener('beforeinput', (ev: any) => {
		// TODO: set selection to the selection before the edit
		if (ev.inputType === 'historyUndo') {
			const edit = history.undo();
			if (edit) {
				historyInitiated = true;
				ev.preventDefault();
				content = edit.apply(content);
				this.refresh();
				contentArea.value;
				historyInitiated = false;
			}
		} else if (ev.inputType === 'historyRedo') {
			const edit = history.redo();
			if (edit) {
				historyInitiated = true;
				ev.preventDefault();
				content = edit.apply(content);
				this.refresh();
				contentArea.value;
				historyInitiated = false;
			}
		}
	});

	let composing = false;
	this.addEventListener('compositionstart', () => {
		composing = true;
	});

	this.addEventListener('compositionend', () => {
		composing = false;
	});

	const onSubmit = () => {
		// You would run actual example checking here.
		console.log(content.replace(/=====+\n/g, ""));
	};

	for ({} of this) {
		yield (
			<Fragment>
				<content-area
					crank-ref={(el: ContentAreaElement) => (contentArea = el)}
					crank-static={composing}
				>
					<div class="editable">
						{parse(content, keyer)}
					</div>
				</content-area>
				<div>
					<button onclick={onSubmit}>Submit</button>
				</div>
			</Fragment>
		);
	}
}

function App() {
	return (
		<div class="app">
			<p class="">Using content-area to implement Odyssey Code Challenges.</p>
			<CodeChallenge />
		</div>
	);
}

declare global {
	module Crank {
		interface EventMap {
			contentchange: ContentEvent;
		}
	}
}

window.customElements.define('content-area', ContentAreaElement);
renderer.render(<App />, document.getElementById('root')!);
