import {createElement} from "@b9g/crank/crank.js";
import type {Context, Element} from "@b9g/crank/crank.js";
import {renderer} from "@b9g/crank/dom.js";
import {CrankEditable, EditableState} from "@b9g/crankeditable";

import {parse as parseEmoji} from "@twemoji/parser";
import type {Token} from "prismjs";
import {tokenize} from "../utils/prism.js";
import "prismjs/components/prism-typescript";

/*** Demo 1: Simple Editable ***/
function* SimpleEditable(
	this: Context<typeof SimpleEditable>,
	{initial}: {initial: string},
) {
	const state = new EditableState({value: initial});
	for ({} of this) {
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
	this: Context<typeof RainbowEditable>,
	{initial}: {initial: string},
) {
	const state = new EditableState({value: initial});
	for ({} of this) {
		let cursor = 0;
		const lines = state.value.split(/\r\n|\r|\n/);
		// Remove trailing empty from final newline
		if (/(?:\r\n|\r|\n)$/.test(state.value)) {
			lines.pop();
		}

		yield (
			<CrankEditable state={state} onstatechange={() => this.refresh()}>
				<div class="editable" contenteditable="true" spellcheck={false} hydrate="!children">
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
	this: Context<typeof CodeEditable>,
	{initial}: {initial: string},
) {
	const state = new EditableState({value: initial});
	for ({} of this) {
		const lines = tokenize(state.value, "typescript");
		let cursor = 0;
		yield (
			<CrankEditable state={state} onstatechange={() => this.refresh()}>
				<pre class="editable" contenteditable="true" spellcheck={false} hydrate="!children">
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
		let href: string;
		if (match[1]) {
			color = "#c084fc";
			href = `https://example.com/tags/${value.slice(1)}`;
		} else if (match[2]) {
			color = "#60a5fa";
			href = `https://example.com/${value.slice(1)}`;
		} else {
			color = "#34d399";
			href = value;
		}

		result.push(
			<a href={href} target="_blank" rel="noopener" style={{color, textDecoration: "underline"}}>{value}</a>,
		);
		lastIndex = index + value.length;
	}

	if (lastIndex < text.length) {
		result.push(text.slice(lastIndex));
	}

	return result;
}

function* SocialEditable(
	this: Context<typeof SocialEditable>,
	{initial}: {initial: string},
) {
	const state = new EditableState({value: initial});
	for ({} of this) {
		const lines = state.value.split(/\r\n|\r|\n/);
		if (/(?:\r\n|\r|\n)$/.test(state.value)) {
			lines.pop();
		}

		let cursor = 0;
		yield (
			<CrankEditable state={state} onstatechange={() => this.refresh()}>
				<div class="editable" contenteditable="true" spellcheck={false} hydrate="!children">
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

/*** Demo 5: Twemoji ***/
function renderTwemoji(text: string): Array<Element | string> {
	const entities = parseEmoji(text);
	if (!entities.length) return [text];

	const result: Array<Element | string> = [];
	let lastIndex = 0;
	for (const entity of entities) {
		const [start, end] = entity.indices;
		if (start > lastIndex) {
			result.push(text.slice(lastIndex, start));
		}

		result.push(
			<img
				data-content={entity.text}
				src={entity.url}
				alt={entity.text}
				draggable={false}
				style={{
					height: "1.2em",
					width: "1.2em",
					verticalAlign: "middle",
					display: "inline-block",
				}}
			/>,
		);
		lastIndex = end;
	}

	if (lastIndex < text.length) {
		result.push(text.slice(lastIndex));
	}

	return result;
}

function* TwemojiEditable(
	this: Context<typeof TwemojiEditable>,
	{initial}: {initial: string},
) {
	const state = new EditableState({value: initial});
	for ({} of this) {
		const lines = state.value.split(/\r\n|\r|\n/);
		if (/(?:\r\n|\r|\n)$/.test(state.value)) {
			lines.pop();
		}

		let cursor = 0;
		yield (
			<CrankEditable state={state} onstatechange={() => this.refresh()}>
				<div class="editable" contenteditable="true" spellcheck={false} hydrate="!children">
					{lines.map((line) => {
						const key = state.keyer.keyAt(cursor);
						cursor += line.length + 1;
						return (
							<div key={key}>
								{line ? renderTwemoji(line) : <br />}
							</div>
						);
					})}
				</div>
			</CrankEditable>
		);
	}
}

/*** Demo 6: Blockquote ***/
function* BlockquoteEditable(
	this: Context<typeof BlockquoteEditable>,
	{initial}: {initial: string},
) {
	const state = new EditableState({value: initial});
	for ({} of this) {
		const lines = state.value.split(/\r\n|\r|\n/);
		if (/(?:\r\n|\r|\n)$/.test(state.value)) {
			lines.pop();
		}

		let cursor = 0;
		yield (
			<CrankEditable state={state} onstatechange={() => this.refresh()}>
				<div class="editable" contenteditable="true" spellcheck={false} hydrate="!children"
					onkeydown={(ev: KeyboardEvent) => {
						if (ev.key === "Enter" && !ev.shiftKey && !ev.ctrlKey && !ev.metaKey) {
							const area = (ev.currentTarget as HTMLElement).closest("content-area") as any;
							if (!area) return;
							const pos = area.selectionStart as number;
							const value = area.value as string;
							const lineStart = value.lastIndexOf("\n", pos - 1) + 1;
							const lineEnd = value.indexOf("\n", pos);
							const line = value.slice(lineStart, lineEnd === -1 ? value.length : lineEnd);
							if (line === "> ") {
								ev.preventDefault();
								state.setValue(
									value.slice(0, lineStart) + value.slice(lineStart + 2),
									"user",
								);
								this.refresh();
							}
						}
					}}
				>
					{lines.map((line) => {
						const key = state.keyer.keyAt(cursor);
						cursor += line.length + 1;
						const match = line.match(/^(> )([\s\S]*)$/);
						if (match) {
							return (
								<div key={key} data-contentbefore="> " style={{
									borderLeft: "3px solid var(--highlight-color)",
									paddingLeft: "0.5em",
									marginLeft: "0.25em",
									color: "var(--text-muted)",
								}}>
									{match[2] || <br />}
								</div>
							);
						}
						return (
							<div key={key}>
								{line || <br />}
							</div>
						);
					})}
				</div>
			</CrankEditable>
		);
	}
}

/*** Demo 7: Todo ***/
function* TodoEditable(
	this: Context<typeof TodoEditable>,
	{initial}: {initial: string},
) {
	const state = new EditableState({value: initial});
	for ({} of this) {
		const lines = state.value.split(/\r\n|\r|\n/);
		if (/(?:\r\n|\r|\n)$/.test(state.value)) {
			lines.pop();
		}

		let cursor = 0;
		yield (
			<CrankEditable state={state} onstatechange={() => this.refresh()}>
				<div class="editable" contenteditable="true" spellcheck={false} hydrate="!children"
					onkeydown={(ev: KeyboardEvent) => {
						if (ev.shiftKey || ev.ctrlKey || ev.metaKey) return;
						const area = (ev.currentTarget as HTMLElement).closest("content-area") as any;
						if (!area) return;
						const pos = area.selectionStart as number;
						const end = area.selectionEnd as number;
						if (pos !== end) return; // has selection, let browser handle
						const value = area.value as string;
						const lineStart = value.lastIndexOf("\n", pos - 1) + 1;
						const lineEnd = value.indexOf("\n", pos);
						const line = value.slice(lineStart, lineEnd === -1 ? value.length : lineEnd);
						const todoMatch = line.match(/^(- \[[ x]\] )([\s\S]*)$/);
						if (!todoMatch) return;
						const prefix = todoMatch[1];
						if ((ev.key === "Enter" && todoMatch[2] === "") ||
							(ev.key === "Backspace" && pos === lineStart + prefix.length)) {
							// Enter on empty todo or Backspace at start of content → remove prefix
							ev.preventDefault();
							state.setValue(
								value.slice(0, lineStart) + value.slice(lineStart + prefix.length),
								"user",
							);
							this.refresh();
						}
					}}
				>
					{lines.map((line) => {
						const lineStart = cursor;
						const key = state.keyer.keyAt(cursor);
						cursor += line.length + 1;
						const match = line.match(/^(- \[[ x]\] )([\s\S]*)$/);
						if (match) {
							const prefix = match[1];
							const checked = prefix === "- [x] ";
							return (
								<div key={key} data-contentbefore={prefix} style={{
									paddingLeft: "1.5em",
								}}>
									<input
										type="checkbox"
										checked={checked}
										data-content=""
										contenteditable="false"
										style={{
											marginLeft: "-1.5em",
											marginRight: "0.25em",
											cursor: "pointer",
										}}
										onclick={(ev: Event) => {
											const input = ev.target as HTMLInputElement;
											input.checked = checked; // revert browser toggle
											const newPrefix = checked ? "- [ ] " : "- [x] ";
											state.setValue(
												state.value.slice(0, lineStart) +
												newPrefix +
												state.value.slice(lineStart + prefix.length),
												"user",
											);
											this.refresh();
										}}
									/>
									<span style={checked ? {textDecoration: "line-through", opacity: "0.5"} : undefined}>
										{match[2] || <br />}
									</span>
								</div>
							);
						}
						return (
							<div key={key}>
								{line || <br />}
							</div>
						);
					})}
				</div>
			</CrankEditable>
		);
	}
}

/*** Demo 8: Typora-light ***/
function* TyporaEditable(
	this: Context<typeof TyporaEditable>,
	{initial}: {initial: string},
) {
	const state = new EditableState({value: initial});
	for ({} of this) {
		const lines = state.value.split(/\r\n|\r|\n/);
		if (/(?:\r\n|\r|\n)$/.test(state.value)) {
			lines.pop();
		}

		const cursorPos = state.selection?.start ?? 0;
		let charCount = 0;
		let cursorLine = 0;
		for (let i = 0; i < lines.length; i++) {
			if (cursorPos <= charCount + lines[i].length) {
				cursorLine = i;
				break;
			}
			charCount += lines[i].length + 1;
		}

		let cursor = 0;
		yield (
			<CrankEditable state={state} onstatechange={() => this.refresh()}>
				<div class="editable" contenteditable="true" spellcheck={false} hydrate="!children">
					{lines.map((line, lineIndex) => {
						const key = state.keyer.keyAt(cursor);
						cursor += line.length + 1;
						const focused = lineIndex === cursorLine;

						// When focused, show raw markdown
						if (focused) {
							return (
								<div key={key}>
									{line || <br />}
								</div>
							);
						}

						// Blockquote
						const bqMatch = line.match(/^(> )([\s\S]*)$/);
						if (bqMatch) {
							return (
								<div key={key} data-contentbefore="> " style={{
									borderLeft: "3px solid var(--highlight-color)",
									paddingLeft: "0.5em",
									marginLeft: "0.25em",
									color: "var(--text-muted)",
									fontStyle: "italic",
								}}>
									{bqMatch[2] || <br />}
								</div>
							);
						}

						// Heading
						const headingMatch = line.match(/^(#{1,3} )([\s\S]*)$/);
						if (headingMatch) {
							const level = headingMatch[1].trim().length;
							const fontSize = level === 1 ? "1.5em" : level === 2 ? "1.25em" : "1.1em";
							return (
								<div key={key} data-contentbefore={headingMatch[1]} style={{
									fontSize,
									fontWeight: "bold",
									color: "var(--highlight-color)",
								}}>
									{headingMatch[2] || <br />}
								</div>
							);
						}

						// Todo
						const todoMatch = line.match(/^(- \[[ x]\] )([\s\S]*)$/);
						if (todoMatch) {
							const checked = todoMatch[1] === "- [x] ";
							return (
								<div key={key} data-contentbefore={todoMatch[1]} style={{
									paddingLeft: "1.5em",
								}}>
									<input
										type="checkbox"
										checked={checked}
										data-content=""
										contenteditable="false"
										style={{
											marginLeft: "-1.5em",
											marginRight: "0.25em",
											pointerEvents: "none",
										}}
									/>
									<span style={checked ? {textDecoration: "line-through", opacity: "0.5"} : undefined}>
										{todoMatch[2] || <br />}
									</span>
								</div>
							);
						}

						return (
							<div key={key}>
								{line || <br />}
							</div>
						);
					})}
				</div>
			</CrankEditable>
		);
	}
}

/*** Hero editables ***/
function* EditableTitle(
	this: Context<typeof EditableTitle>,
	{initial}: {initial: string},
) {
	const state = new EditableState({value: initial});
	for ({} of this) {
		const lines = state.value.split(/\r\n|\r|\n/);
		if (/(?:\r\n|\r|\n)$/.test(state.value)) {
			lines.pop();
		}

		let cursor = 0;
		yield (
			<CrankEditable state={state} onstatechange={() => this.refresh()}>
				<h1
					contenteditable="true"
					spellcheck={false}
					style={{
						fontSize: "max(40px, 8vw)",
						color: "var(--highlight-color)",
						margin: "0",
						outline: "none",
					}}
				>
					{lines.map((line) => {
						const key = state.keyer.keyAt(cursor);
						cursor += line.length + 1;
						return (
							<div key={key}>
								{line || <br />}
							</div>
						);
					})}
				</h1>
			</CrankEditable>
		);
	}
}

function* EditableTagline(
	this: Context<typeof EditableTagline>,
	{initial}: {initial: string},
) {
	const state = new EditableState({value: initial});
	for ({} of this) {
		const lines = state.value.split(/\r\n|\r|\n/);
		if (/(?:\r\n|\r|\n)$/.test(state.value)) {
			lines.pop();
		}

		let cursor = 0;
		yield (
			<CrankEditable state={state} onstatechange={() => this.refresh()}>
				<p
					contenteditable="true"
					spellcheck={false}
					hydrate="!children"
					style={{
						fontSize: "1.25rem",
						color: "var(--text-muted)",
						margin: "0.5em 0 0",
						outline: "none",
					}}
				>
					{lines.map((line) => {
						const key = state.keyer.keyAt(cursor);
						cursor += line.length + 1;
						return (
							<div key={key}>
								{line || <br />}
							</div>
						);
					})}
				</p>
			</CrankEditable>
		);
	}
}

/*** Hydrate demos ***/
function hydrate(id: string, Component: any) {
	const el = document.getElementById(id);
	if (!el) return;
	const initial = el.dataset.initial || "\n";
	renderer.hydrate(
		<Component initial={initial} />,
		el,
	);
}

hydrate("hero-title", EditableTitle);
hydrate("hero-tagline", EditableTagline);
hydrate("demo-simple", SimpleEditable);
hydrate("demo-rainbow", RainbowEditable);
hydrate("demo-code", CodeEditable);
hydrate("demo-social", SocialEditable);
hydrate("demo-twemoji", TwemojiEditable);
hydrate("demo-blockquote", BlockquoteEditable);
hydrate("demo-todo", TodoEditable);
hydrate("demo-typora", TyporaEditable);
