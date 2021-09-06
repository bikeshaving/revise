import type {Child, Context} from '@bikeshaving/crank/crank.js';
import {createElement} from '@bikeshaving/crank/crank.js';
import {renderer} from '@bikeshaving/crank/dom.js';
import {ContentAreaElement} from '@bikeshaving/revise/contentarea.js';
import type {ContentEvent} from '@bikeshaving/revise/contentarea.js';
import {Keyer} from '@bikeshaving/revise/keyer.js';
import './index.css';

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
		const key = keyer.keyOf(cursor);
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

function parse(content: string, keyer: Keyer): Array<Child> {
	const lines = splitLines(Prism.tokenize(content, Prism.languages.typescript));
	return printLines(lines, keyer);
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

function* Editable(this: Context) {
	let content = '\n';
	let el: ContentAreaElement;
	const keyer = new Keyer(content.length);
	const debouncedRepair = debounce(() => el.repair(() => this.refresh()));
	this.addEventListener('contentchange', (ev) => {
		content = (ev.target as ContentAreaElement).value;
		keyer.push(ev.detail.patch);
		debouncedRepair();
	});

	this.addEventListener('contentundo', (ev) => {
		content = (ev.target as ContentAreaElement).value;
		keyer.push(ev.detail.patch);
		this.refresh();
	});

	this.addEventListener('contentredo', (ev) => {
		content = (ev.target as ContentAreaElement).value;
		keyer.push(ev.detail.patch);
		this.refresh();
	});

	let composing = false;
	this.addEventListener('compositionstart', () => {
		composing = true;
	});

	this.addEventListener('compositionend', () => {
		composing = false;
		debouncedRepair();
	});

	for ({} of this) {
		yield (
			<content-area
				undomode="keydown"
				crank-ref={(el1: ContentAreaElement) => (el = el1)}
			>
				<pre
					class="editable language-typescript"
					contenteditable="true"
					crank-static={composing}
					spellcheck="false"
				>
					{parse(content, keyer)}
				</pre>
			</content-area>
		);
	}
}

function App() {
	return (
		<div class="app">
			<p>Using content-area with some custom PrismJS utilities.</p>
			<Editable />
		</div>
	);
}

declare global {
	module Crank {
		interface EventMap {
			contentchange: ContentEvent;
			contentundo: ContentEvent;
			contentredo: ContentEvent;
		}
	}
}

window.customElements.define('content-area', ContentAreaElement);
renderer.render(<App />, document.getElementById('root')!);
