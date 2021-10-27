import type {Keyer} from '@b9g/revise/keyer.js';
import {createElement} from '@b9g/crank/crank.js';
import type {Context, Element} from '@b9g/crank/crank.js';
import {renderer} from '@b9g/crank/dom.js';

import Prism from 'prismjs';
import type {Token} from 'prismjs';
import 'prismjs/components/prism-typescript';
import 'prismjs/themes/prism.css';

import {ContentArea} from '../components/contentarea';

/*** Prism Logic ***/
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
			let className = 'token ' + token.type;
			if (Array.isArray(token.alias)) {
				className += ' ' + token.alias.join(' ');
			} else if (typeof token.alias === 'string') {
				className += ' ' + token.alias;
			}

			result.push(<span class={className}>{children}</span>);
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
	let value = '\n';
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
