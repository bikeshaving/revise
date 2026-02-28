import {createElement} from "@b9g/crank/crank.js";
import type {Context, Element} from "@b9g/crank/crank.js";
import {renderer} from "@b9g/crank/dom.js";
import {ContentAreaElement} from "@b9g/revise/contentarea.js";
import {EditableState} from "@b9g/revise/state.js";

import {CrankEditable} from "../components/crank-editable.js";

import Prism from "prismjs";
import type {Token} from "prismjs";
import "prismjs/components/prism-typescript";

// @ts-ignore
Prism.manual = true;

// Register custom element
if (!customElements.get("content-area")) {
	customElements.define("content-area", ContentAreaElement);
}

/*** Demo 1: Simple Editable ***/
function* SimpleEditable(
	this: Context,
	{initial}: {initial: string},
) {
	const state = new EditableState({value: initial});
	for (const {} of this) {
		const lines = state.value.split(/\r\n|\r|\n/);
		if (/(?:\r\n|\r|\n)$/.test(state.value)) {
			lines.pop();
		}

		let cursor = 0;
		yield (
			<CrankEditable state={state} onstatechange={() => this.refresh()}>
				<pre class="editable" contenteditable="true" spellcheck={false}>
					{lines.map((line) => {
						const key = state.keyer.keyAt(cursor);
						cursor += line.length + 1;
						return (
							<div key={key}>
								{line || <br />}
							</div>
						);
					})}
				</pre>
			</CrankEditable>
		);
	}
}

/*** Demo 2: Rainbow ***/
const COLORS = [
	"#FF0000",
	"#FFA500",
	"#FFDC00",
	"#008000",
	"#0000FF",
	"#4B0082",
	"#800080",
];

function* RainbowEditable(
	this: Context,
	{initial}: {initial: string},
) {
	const state = new EditableState({value: initial});
	for (const {} of this) {
		let cursor = 0;
		const lines = state.value.split(/\r\n|\r|\n/);
		// Remove trailing empty from final newline
		if (/(?:\r\n|\r|\n)$/.test(state.value)) {
			lines.pop();
		}

		yield (
			<CrankEditable state={state} onstatechange={() => this.refresh()}>
				<div class="editable" contenteditable="true" spellcheck={false}>
					{lines.map((line) => {
						const key = state.keyer.keyAt(cursor);
						cursor += line.length + 1;
						const chars = line ? (
							[...line].map((char, i) => (
								<span style={{color: COLORS[i % COLORS.length]}}>{char}</span>
							))
						) : (
							<br />
						);
						return (
							<div key={key}>
								{chars}
							</div>
						);
					})}
				</div>
			</CrankEditable>
		);
	}
}

/*** Demo 3: Code Editor ***/
// Prism line-splitting utilities
function wrapContent(
	content: Array<Token | string> | Token | string,
): Array<Token | string> {
	return Array.isArray(content) ? content : [content];
}

function unwrapContent(
	content: Array<Token | string>,
): Array<Token | string> | string {
	if (content.length === 0) {
		return "";
	} else if (content.length === 1 && typeof content[0] === "string") {
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
		if (typeof token === "string") {
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

function splitLines(
	tokens: Array<Token | string>,
): Array<Array<Token | string>> {
	const lines = splitLinesRec(tokens);
	if (!lines[lines.length - 1].length) {
		lines.pop();
	}

	return lines;
}

function printTokens(tokens: Array<Token | string>): Array<Element | string> {
	const result: Array<Element | string> = [];
	for (let i = 0; i < tokens.length; i++) {
		const token = tokens[i];
		if (typeof token === "string") {
			result.push(token);
		} else {
			const children = Array.isArray(token.content)
				? printTokens(token.content)
				: token.content;
			let className = "token " + token.type;
			if (Array.isArray(token.alias)) {
				className += " " + token.alias.join(" ");
			} else if (typeof token.alias === "string") {
				className += " " + token.alias;
			}

			result.push(<span class={className}>{children}</span>);
		}
	}

	return result;
}

function* CodeEditable(
	this: Context,
	{initial}: {initial: string},
) {
	const state = new EditableState({value: initial});
	for (const {} of this) {
		const lines = splitLines(
			Prism.tokenize(state.value, Prism.languages.typescript),
		);
		let cursor = 0;
		yield (
			<CrankEditable state={state} onstatechange={() => this.refresh()}>
				<pre class="editable" contenteditable="true" spellcheck={false}>
					{lines.map((line) => {
						const key = state.keyer.keyAt(cursor);
						const length = line.reduce((l, t) => l + t.length, 0);
						cursor += length + 1;
						return (
							<div key={key}>
								<code>{printTokens(line)}</code>
								<br />
							</div>
						);
					})}
				</pre>
			</CrankEditable>
		);
	}
}

/*** Demo 4: Social Highlighting ***/
const SOCIAL_PATTERN =
	/(#\w+)|(@\w+)|(https?:\/\/[^\s]+)/g;

function highlightSocial(text: string): Array<Element | string> {
	const result: Array<Element | string> = [];
	let lastIndex = 0;
	for (const match of text.matchAll(SOCIAL_PATTERN)) {
		const index = match.index!;
		if (index > lastIndex) {
			result.push(text.slice(lastIndex, index));
		}

		const value = match[0];
		let color: string;
		if (match[1]) {
			color = "#c084fc"; // purple for hashtags
		} else if (match[2]) {
			color = "#60a5fa"; // blue for mentions
		} else {
			color = "#34d399"; // green for links
		}

		result.push(<span style={{color}}>{value}</span>);
		lastIndex = index + value.length;
	}

	if (lastIndex < text.length) {
		result.push(text.slice(lastIndex));
	}

	return result;
}

function* SocialEditable(
	this: Context,
	{initial}: {initial: string},
) {
	const state = new EditableState({value: initial});
	for (const {} of this) {
		const lines = state.value.split(/\r\n|\r|\n/);
		if (/(?:\r\n|\r|\n)$/.test(state.value)) {
			lines.pop();
		}

		let cursor = 0;
		yield (
			<CrankEditable state={state} onstatechange={() => this.refresh()}>
				<div class="editable" contenteditable="true" spellcheck={false}>
					{lines.map((line) => {
						const key = state.keyer.keyAt(cursor);
						cursor += line.length + 1;
						return (
							<div key={key}>
								{line ? highlightSocial(line) : <br />}
							</div>
						);
					})}
				</div>
			</CrankEditable>
		);
	}
}

/*** Hydrate demos ***/
function hydrate(id: string, Component: any) {
	const el = document.getElementById(id);
	if (!el) return;
	const initial = el.dataset.initial || "\n";
	renderer.render(
		<Component initial={initial} />,
		el,
	);
}

hydrate("demo-simple", SimpleEditable);
hydrate("demo-rainbow", RainbowEditable);
hydrate("demo-code", CodeEditable);
hydrate("demo-social", SocialEditable);
