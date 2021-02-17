import type { Child, Children, Context } from '@bikeshaving/crank/crank.js';
import { Copy, createElement, Fragment, Raw } from '@bikeshaving/crank/crank.js';
import { renderer } from '@bikeshaving/crank/dom.js';
import Prism from 'prismjs';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-latex';
import type { Token } from 'prismjs';
// @ts-ignore
Prism.manual = true;
import { splitLines } from './prism-utils';
import 'prismjs/themes/prism-tomorrow.css';
import './index.css';
import type {Patch} from '@bikeshaving/revise/patch.js';
import {ContentAreaElement, ContentChangeEvent} from '@bikeshaving/revise/contentarea.js';
window.customElements.define("content-area", ContentAreaElement);

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
	let i = 0;
	return lines.map((line) => {
		const key = keyer.keyFromIndex(i);
		const length = line.reduce((l, t) => l + t.length, 0);
		i += length + 1;
		return (
			<div style="font-family: monospace;" crank-key={key}>
				{line.length ? <code>{printTokens(line)}</code> : <br />}
			</div>
		);
	});
}

function parse(content: string, keyer: Keyer): Array<Child> {
	const lines = splitLines(Prism.tokenize(content, Prism.languages.typescript));
	return printLines(lines, keyer);
}

// TODO: Pass in old lines and mutate that array rather than creating a new one.
function print(content: string, keyer: Keyer): Array<Child> {
	const lines = content.split(/\r\n|\r|\n/);
	if (/\r\n|\r|\n$/.test(content)) {
		lines.pop();
	}

	//return content;
	// We’re using these return values to test different rendering strategies.
	//return lines.flatMap((line) => [line, <br />]);
	//return lines.flatMap((line) => line ? [<span>{line}</span>, <br />] : <br />);
	//return lines.flatMap((line) => line ? [Array.from(line).map((char) => <span>{char}</span>), <br />] : <br />);
	// This is the most well-behaved way to divide lines.
	let i = 0;
	return lines.map((line) => {
		const key = keyer.keyFromIndex(i);
		i += line.length + 1;
		return (
			<div crank-key={key}>{line || <br />}</div>
		);
	});
	//return lines.map((line) => <div>{line || "\n"}</div>);
	//return lines.map((line) => <div>{line}<br /></div>);
	//return lines.map((line) => <div>{line}{"\n"}</div>);
}

class Keyer {
	_key: number;
	_keys: Array<number>;

	constructor(length: number = 0) {
		this._key = 0;
		this._keys = new Array(length);
	}

	keyFromIndex(i: number): number {
		// TODO: maybe we can use `in`
		if (typeof this._keys[i] === "undefined") {
			this._keys[i] = this._key++;
		}

		return this._keys[i];
	}

	ingest(patch: Patch): void {
		const operations = patch.operations();
		for (let i = operations.length - 1; i >= 0; i--) {
			const op = operations[i];
			// TODO: Is this correct?
			switch (op.type) {
				case "delete":
					this._keys.splice(op.start + 1, op.end - op.start);
					break;
				case "insert":
					// We use slice and concat rather than splice(op.start, 0, ...new
					// Array(op.value.length) because the latter seems to fill in added
					// indices with undefined rather than leaving the array sparse.
					this._keys.length = Math.max(this._keys.length, op.start + 1);
					this._keys = this._keys
						.slice(0, op.start + 1)
						.concat(new Array(op.value.length))
						.concat(this._keys.slice(op.start + 1));
					break;
			}
		}
	}
}

declare global {
	module Crank {
		interface EventMap {
			"contentchange": ContentChangeEvent;
		}
	}
}

function debounce(fn: Function, delay: number = 50): any {
	let handle: any;
	return function(this: any) {
		let context = this, args = arguments;
		const wrapped = function() {
			handle = undefined;
			return fn.apply(context, args);
		};

		if (handle != null) {
			clearTimeout(handle);
		}

		handle = setTimeout(wrapped, delay);
	};
}

function* Editable(this: Context, { children }: any) {
	let content = "\n";
	let el: any;
	const keyer = new Keyer(content.length);
	const debouncedRefresh = debounce(() => el.repair(() => this.refresh()));
	this.addEventListener("contentchange", (ev) => {
		content = (ev.target as ContentAreaElement).value;
		keyer.ingest(ev.detail.patch);
		debouncedRefresh();
	});

	let initial = true;
	//let html = "";
	//this.schedule(() => {
	//	html = el.innerHTML;
	//	this.refresh();
	//});
	for ({} of this) {
		//this.schedule(() => {
		//	if (html !== el.innerHTML) {
		//		html = el.innerHTML;
		//		this.refresh();
		//	}
		//});
		yield (
			<div class="editor">
				{/*
				{
					initial || true ? (
						<content-area
							spellcheck={false}
							crank-ref={(el1: Node) => (el = el1)}
						>
							<div contenteditable="true" class="block">
								{print(content, keyer)}
							</div>
						</content-area>
					) : <Copy />
				}
				*/}
				{
					initial || true ? (
						<content-area
							spellcheck={false}
							crank-ref={(el1: Node) => (el = el1)}
						>
							<pre
								class="block"
								crank-ref={(el1: Node) => (el = el1)}
								contenteditable="true"
								spellcheck={false}
							>
								{parse(content, keyer)}
							</pre>
						</content-area>
					) : <Copy />
				}
				{/*
				<div class="block">Content: <pre style="white-space: pre-wrap">{JSON.stringify(content)}</pre></div>
				<div class="block">HTML: <pre style="white-space: pre-wrap">{html}</pre></div>
				<div class="block">Cursor: <pre>{JSON.stringify(cursor)}</pre></div>
				<div class="block">Operations: <pre>{operations}</pre></div>
				*/}
			</div>
		);
		initial = false;
	}
}

function App() {
	return (
		<div class="app">
			<Editable />
		</div>
	);
}

renderer.render(<App />, document.getElementById('root')!);
