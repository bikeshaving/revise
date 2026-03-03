import {jsx} from "@b9g/crank/standalone";
import type {Context, Element as CrankElement} from "@b9g/crank";
import {css} from "@emotion/css";
import {CrankEditable, EditableState} from "@b9g/crankeditable";
import {Edit} from "@b9g/revise/edit.js";
import type {Token} from "prismjs";
import {tokenize} from "../utils/prism.js";

const IS_CLIENT = typeof document !== "undefined";

const TAB = "  ";

function printTokens(
	tokens: Array<Token | string>,
): Array<CrankElement | string> {
	const result: Array<CrankElement | string> = [];
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

			result.push(jsx`<span class=${className}>${children}</span>`);
		}
	}

	return result;
}

function getPreviousLine(text: string, index: number) {
	index = Math.max(0, index);
	for (let i = index - 1; i >= 0; i--) {
		if (text[i] === "\n" || text[i] === "\r") {
			return text.slice(i + 1, index);
		}
	}

	return text.slice(0, index);
}

const preClass = css`
	flex: 1 1 auto;
	word-break: break-all;
	overflow-wrap: anywhere;
	line-break: anywhere;
	white-space: pre-wrap;
	white-space: break-spaces;
	/* Needs to be min 16px to prevent iOS zoom */
	font-size: 16px;
`;

const lineClass = css`
	border-bottom: 1px dotted #333;
	.color-scheme-light & {
		border-bottom: 1px dotted #ddd;
	}
`;

function renderLines(value: string, language: string, keyer: any) {
	const lineTokens = tokenize(value, language || "javascript");
	let cursor = 0;
	return lineTokens.map((line) => {
		const length =
			line.reduce((length, t) => length + t.length, 0) + "\n".length;
		const key = keyer.keyAt(cursor);
		cursor += length;
		return jsx`
			<div
				key=${key}
				class="prism-line ${lineClass}"
			>
				${line.length ? jsx`<code>${printTokens(line)}</code>` : null}
				<br />
			</div>
		`;
	});
}

export function* CodeEditor(
	this: Context,
	{
		value,
		language,
		editable,
	}: {
		value: string;
		language: string;
		editable?: boolean;
	},
) {
	value = value || "";
	if (!value.match(/(?:\r|\n|\r\n)$/)) {
		value = value + "\n";
	}

	if (!IS_CLIENT) {
		// SSR: render static HTML matching CrankEditable's DOM structure
		const keyer = {
			_nextKey: 0,
			keyAt() {
				return this._nextKey++;
			},
		};
		for ({value, language, editable = true} of this) {
			value = value || "";
			if (!value.match(/(?:\r|\n|\r\n)$/)) {
				value = value + "\n";
			}

			yield jsx`
				<content-area>
					<pre
						autocomplete="off"
						autocorrect="off"
						autocapitalize="none"
						contenteditable=${editable}
						spellcheck="false"
						class="language-${language} ${preClass}"
					>
						${renderLines(value, language, keyer)}
					</pre>
				</content-area>
			`;
		}
		return;
	}

	// Client
	const state = new EditableState({value});

	this.addEventListener("keydown", (ev: any) => {
		if (!editable) return;
		if (ev.key === "Enter") {
			const area = (ev.target as Element).closest("content-area") as any;
			if (!area) return;
			const {selectionStart, selectionEnd} = area;
			if (selectionStart !== selectionEnd) {
				return;
			}

			const prevLine = getPreviousLine(state.value, selectionStart);
			const [, spaceBefore, bracket] = prevLine.match(
				/(\s*).*?(\(|\[|{)?(?:\s*)$/,
			)!;
			let insert = "\n" + (spaceBefore || "");
			if (bracket) {
				insert += TAB;
			}

			ev.preventDefault();
			const cursorPos = selectionStart + insert.length;
			const edit = Edit.builder(state.value)
				.retain(selectionStart)
				.insert(insert)
				.retain(state.value.length - selectionStart)
				.build();
			state.applyEdit(edit);
			this.refresh();
			requestAnimationFrame(() => {
				area.setSelectionRange(cursorPos, cursorPos, "none");
			});
		}
	});

	this.addEventListener("statechange", () => {
		this.dispatchEvent(
			new CustomEvent("contentchange", {
				bubbles: true,
				detail: {value: state.value},
			}),
		);
	});

	for ({language, editable = true} of this) {
		value = state.value;

		yield jsx`
			<${CrankEditable}
				state=${state}
				onstatechange=${() => this.refresh()}
			>
				<pre
					autocomplete="off"
					autocorrect="off"
					autocapitalize="none"
					contenteditable=${editable}
					spellcheck="false"
					class="language-${language} ${preClass}"
				>
					${renderLines(value, language, state.keyer)}
				</pre>
			</${CrankEditable}>
		`;
	}
}
