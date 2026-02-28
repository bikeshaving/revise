import {jsx, Raw} from "@b9g/crank/standalone";
import type {Children, Component, Element} from "@b9g/crank";
import {marked} from "marked";

export interface Checkmark {
	type: "checkmark";
	raw: string;
	checked: boolean;
}

export interface TokenProps {
	token: marked.Token;
	rootProps: MarkedProps;
	children: Children;
	[key: string]: unknown;
}

function slugify(text: string): string {
	return text
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/(^-|-$)/g, "");
}

export const defaultComponents: Record<string, Component<TokenProps>> = {
	space: () => null,

	code({token}) {
		const {text, lang} = token as marked.Tokens.Code;
		const langClassName = lang ? `language-${lang}` : null;
		return jsx`
			<pre class=${langClassName}>
				<code class=${langClassName}>${text}</code>
			</pre>
		`;
	},

	heading({token, children}) {
		const {depth, text} = token as marked.Tokens.Heading;
		const tag = `h${depth}`;
		const id = slugify(text);
		return jsx`<${tag} id=${id}>${children} <a class="heading-anchor" href="#${id}">#</a><//>`;
	},

	table({token, rootProps}) {
		const {align, header, rows} = token as marked.Tokens.Table;
		return jsx`
			<table>
				<thead>
					<tr>
						${header.map(
							(cell, index) => jsx`
							<th style=${align[index] ? `text-align: ${align[index]}` : undefined}>
								${build(cell.tokens, rootProps)}
							</th>
						`,
						)}
					</tr>
				</thead>
				<tbody>
					${rows.map(
						(row) => jsx`
						<tr>
							${row.map(
								(cell, cellIndex) => jsx`
								<td style=${align[cellIndex] ? `text-align: ${align[cellIndex]}` : undefined}>
									${build(cell.tokens, rootProps)}
								</td>
							`,
							)}
						</tr>
					`,
					)}
				</tbody>
			</table>
		`;
	},

	hr: () => jsx`<hr />`,

	blockquote({children}) {
		return jsx`<blockquote>${children}</blockquote>`;
	},

	list({token, children}) {
		const {ordered, start} = token as marked.Tokens.List;
		const tag = ordered ? "ol" : "ul";

		return jsx`
			<${tag} start=${start && start !== 1 ? start : null}>${children}<//>
		`;
	},

	list_item({children}) {
		return jsx`<li>${children}</li>`;
	},

	checkmark({token}) {
		const {checked} = token as unknown as Checkmark;
		return jsx`<input checked=${checked} disabled="" type="checkbox" />`;
	},

	paragraph({children}) {
		return jsx`<p>${children}</p>`;
	},

	link({token, children}) {
		const {href, title} = token as marked.Tokens.Link;
		return jsx`
			<a href=${href} title=${title}>
				${children}
			</a>
		`;
	},

	image({token}) {
		const {href, title, text} = token as marked.Tokens.Image;
		return jsx`<img src=${href} title=${title} alt=${text} />`;
	},

	strong({children}) {
		return jsx`<strong>${children}</strong>`;
	},

	em({children}) {
		return jsx`<em>${children}</em>`;
	},

	codespan({token}) {
		const {text} = token as marked.Tokens.Codespan;
		return jsx`<code>${text}</code>`;
	},

	br: () => jsx`<br />`,
};

interface BuildProps {
	components?: Record<string, Component<TokenProps>> | undefined;
	[key: string]: unknown;
}

function decodeHTMLEntities(text: string): string {
	const entities: Record<string, string> = {
		"&amp;": "&",
		"&lt;": "<",
		"&gt;": ">",
		"&quot;": '"',
		"&#39;": "'",
		"&apos;": "'",
	};

	return text.replace(
		/&(?:amp|lt|gt|quot|#39|apos);/g,
		(match) => entities[match] || match,
	);
}

function build(
	tokens: Array<marked.Token>,
	rootProps: BuildProps,
	blockLevel = false,
): Array<Element | string> {
	const result: Array<Element | string> = [];
	let jsxStack: Array<JSXStackFrame> = [];

	function emit(...elements: Array<Element | string>) {
		const target =
			jsxStack.length > 0 ? jsxStack[jsxStack.length - 1].children : result;
		target.push(...elements);
	}

	for (let i = 0; i < tokens.length; i++) {
		let token = tokens[i];
		let children: Array<Element | string> | undefined;
		switch (token.type) {
			case "escape": {
				emit(decodeHTMLEntities(token.text));
				continue;
			}

			case "text": {
				const tokens1 = (token as marked.Tokens.Text).tokens;
				if (tokens1 && tokens1.length) {
					if (blockLevel) {
						for (; tokens[i + 1] && tokens[i + 1].type === "text"; i++) {
							tokens1.push(tokens[i + 1]);
						}

						token = {
							type: "paragraph",
							raw: "",
							text: "",
							tokens: tokens1,
						};
						children = build(tokens1, rootProps);
					} else {
						emit(...build(tokens1, rootProps));
						continue;
					}
				} else {
					emit(decodeHTMLEntities(token.text));
					continue;
				}

				break;
			}

			case "html": {
				let elements: Array<Element | string>;
				[elements, jsxStack] = parseJSX(token.raw, jsxStack, rootProps);
				emit(...elements);
				continue;
			}

			case "table": {
				break;
			}

			case "list": {
				const items = token.items.map((item) => ({
					...item,
					loose: (token as marked.Tokens.List).loose,
				}));
				children = build(items, rootProps, token.loose);
				break;
			}

			case "list_item": {
				if (token.task) {
					const checkmark: Checkmark = {
						type: "checkmark",
						raw: "",
						checked: !!token.checked,
					};

					if (
						token.tokens[0] &&
						(token.tokens[0] as any).tokens &&
						(token.tokens[0] as any).tokens.length
					) {
						(token.tokens[0] as any).tokens.unshift(checkmark);
					} else {
						tokens.unshift(checkmark as unknown as marked.Token);
					}
				}

				children = build(token.tokens, rootProps, token.loose);
				break;
			}

			case "codespan": {
				let text = token.raw.replace(/^`+/, "").replace(/`+$/, "");
				const hasNonSpaceChars = /[^ ]/.test(text);
				const hasSpaceCharsOnBothEnds = /^ /.test(text) && / $/.test(text);
				if (hasNonSpaceChars && hasSpaceCharsOnBothEnds) {
					text = text.substring(1, text.length - 1);
				}

				token.text = text;
				break;
			}

			default: {
				if ("tokens" in token && token.tokens.length) {
					children = build(token.tokens, rootProps);
				}
			}
		}

		const Tag = rootProps.components![token.type];
		if (Tag == null) {
			throw new Error(`Unknown tag "${token.type}"`);
		}

		emit(jsx`
			<${Tag} token=${token} rootProps=${rootProps}>
				${children}
			<//Tag>
		`);
	}

	return result;
}

interface JSXStackFrame {
	tagName: string;
	props: Record<string, any>;
	children: Array<Element | string>;
}

function isComponentTag(name: string): boolean {
	return /^[A-Z]/.test(name);
}

function parseProps(attrs: string): Record<string, string | true> {
	const props: Record<string, string | true> = {};
	const re = /([\w-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'))?/g;
	let m;
	while ((m = re.exec(attrs))) {
		props[m[1]] = m[2] ?? m[3] ?? true;
	}

	return props;
}

function parseJSX(
	html: string,
	stack: Array<JSXStackFrame>,
	rootProps: BuildProps,
): [Array<Element | string>, Array<JSXStackFrame>] {
	const results: Array<Element | string> = [];
	let m: RegExpMatchArray | null;

	// Self-closing tag: <Foo /> or <Foo prop="val" />
	m = html.match(
		/^\s*<(\w+)((?:\s+[\w-]+(?:\s*=\s*(?:"[^"]*"|'[^']*'))?)*)\s*\/>\s*$/s,
	);
	if (m) {
		const [, tagName, attrs] = m;
		if (isComponentTag(tagName) && rootProps.components?.[tagName]) {
			const Tag = rootProps.components[tagName];
			const token = {type: tagName, raw: html, ...parseProps(attrs || "")};
			results.push(jsx`<${Tag} token=${token} rootProps=${rootProps} />`);
			return [results, stack];
		}

		return [[jsx`<${Raw} value=${html} />`], stack];
	}

	// Opening tag: <Foo> or <Foo prop="val">
	m = html.match(
		/^\s*<(\w+)((?:\s+[\w-]+(?:\s*=\s*(?:"[^"]*"|'[^']*'))?)*)\s*>\s*$/s,
	);
	if (m) {
		const [, tagName, attrs] = m;
		if (isComponentTag(tagName) && rootProps.components?.[tagName]) {
			return [
				results,
				[...stack, {tagName, props: parseProps(attrs || ""), children: []}],
			];
		}

		return [[jsx`<${Raw} value=${html} />`], stack];
	}

	// Closing tag: </Foo>
	m = html.match(/^\s*<\/(\w+)\s*>\s*$/s);
	if (m) {
		const tagName = m[1];
		if (stack.length > 0 && stack[stack.length - 1].tagName === tagName) {
			const frame = stack[stack.length - 1];
			stack = stack.slice(0, -1);
			const Tag = rootProps.components![tagName]!;
			const token = {type: tagName, raw: html, ...frame.props};
			results.push(
				jsx`<${Tag} token=${token} rootProps=${rootProps}>${frame.children}<//Tag>`,
			);
			return [results, stack];
		}

		return [[jsx`<${Raw} value=${html} />`], stack];
	}

	// Fallback: pass through as raw HTML.
	return [[jsx`<${Raw} value=${html} />`], stack];
}

export interface MarkedProps {
	markdown: string;
	components?: Record<string, Component<TokenProps>> | undefined;
	[key: string]: unknown;
}

export function Marked({markdown, ...props}: MarkedProps) {
	const tokens = marked.Lexer.lex(markdown, {
		gfm: true,
		breaks: false,
		pedantic: false,
		sanitize: false,
		smartypants: false,
	});
	props = {
		...props,
		components: {...defaultComponents, ...props.components},
	};

	return build(tokens, props, true);
}
