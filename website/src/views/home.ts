import {jsx} from "@b9g/crank/standalone";
import {css} from "@emotion/css";
import {InlineCodeBlock} from "../components/inline-code-block.js";
import {SerializeScript} from "../components/serialize-javascript.js";

import {Root} from "../components/root.js";

async function readExample(name: string): Promise<string> {
	const dir = await self.directories.open("examples");
	const handle = await dir.getFileHandle(name);
	const file = await handle.getFile();
	return file.text();
}

function extractInitialValue(source: string): string {
	const match = source.match(/value: `([\s\S]*?)`/);
	if (!match) throw new Error("Could not extract initial value from source");
	// Unescape template literal escapes
	return match[1].replace(/\\\$/g, "$");
}

function renderBlockquoteLines(text: string) {
	const lines = text.split("\n");
	if (lines[lines.length - 1] === "") lines.pop();
	return lines.map((line: string) => {
		const match = line.match(/^(> )([\s\S]*)$/);
		if (match) {
			return jsx`<div data-contentbefore="> " style=${"border-left:3px solid var(--highlight-color);padding-left:0.5em;margin-left:0.25em;color:var(--text-muted)"}>${match[2] || jsx`<br />`}</div>`;
		}
		return jsx`<div>${line || jsx`<br />`}</div>`;
	});
}

function renderInitialLines(text: string) {
	const lines = text.split("\n");
	if (lines[lines.length - 1] === "") lines.pop();
	return lines.map((line: string) =>
		jsx`<div>${line || jsx`<br />`}</div>`,
	);
}

function renderTodoLines(text: string) {
	const lines = text.split("\n");
	if (lines[lines.length - 1] === "") lines.pop();
	return lines.map((line: string) => {
		const match = line.match(/^(- \[[ x]\] )([\s\S]*)$/);
		if (match) {
			const checked = match[1] === "- [x] ";
			return jsx`<div data-contentbefore=${match[1]} style=${"padding-left:1.5em"}>
				<input type="checkbox" checked=${checked} data-content="" contenteditable="false" style=${"margin-left:-1.5em;margin-right:0.25em;cursor:pointer"} />
				<span style=${checked ? "text-decoration:line-through;opacity:0.5" : undefined}>${match[2] || jsx`<br />`}</span>
			</div>`;
		}
		return jsx`<div>${line || jsx`<br />`}</div>`;
	});
}

const sectionHeading = css`
	color: var(--highlight-color);
	font-size: 1.5rem;
	margin: 0 0 0.5em;
`;

const sectionDesc = css`
	color: var(--text-muted);
	margin: 0 0 1em;
`;

const previewClass = css`
	padding: 1em;
	border: 1px dashed var(--border-color);
	border-radius: 4px;
`;

export default async function Home({url}: {url: string}) {
	const [
		simpleCode,
		rainbowCode,
		socialCode,
		twemojiCode,
		codeCode,
		blockquoteCode,
		todoCode,
	] = await Promise.all([
		readExample("simple.tsx"),
		readExample("rainbow.tsx"),
		readExample("social.tsx"),
		readExample("twemoji.tsx"),
		readExample("code.tsx"),
		readExample("blockquote.tsx"),
		readExample("todo.tsx"),
	]);

	const simpleInitial = extractInitialValue(simpleCode);
	const rainbowInitial = extractInitialValue(rainbowCode);
	const socialInitial = extractInitialValue(socialCode);
	const twemojiInitial = extractInitialValue(twemojiCode);
	const codeInitial = extractInitialValue(codeCode);
	const blockquoteInitial = extractInitialValue(blockquoteCode);
	const todoInitial = extractInitialValue(todoCode);

	return jsx`
		<${Root} title="Revise" url=${url} description="A foundational library for building contenteditable-based web text editors.">
			<header class=${css`
				text-align: center;
				padding: 6rem 1rem 2rem;
			`}>
				<div id="hero-title" data-initial=${"Revise.js\n"}>
					<content-area>
						<h1 contenteditable="true" spellcheck="false" style=${"font-size: max(40px, 8vw); color: var(--highlight-color); margin: 0; outline: none;"}>
							<div>Revise.js</div>
						</h1>
					</content-area>
				</div>
				<div id="hero-tagline" data-initial=${"Rich text editing foundations for the web\n"}>
					<content-area>
						<p contenteditable="true" spellcheck="false" style=${"font-size: 1.25rem; color: var(--text-muted); margin: 0.5em 0 0; outline: none;"}>
							<div>Rich text editing foundations for the web</div>
						</p>
					</content-area>
				</div>
			</header>

			<main class=${css`
				max-width: 800px;
				margin: 0 auto;
				padding: 0 1rem 4rem;
				display: flex;
				flex-direction: column;
				gap: 3rem;
			`}>
				<section>
					<h2 class=${sectionHeading}>Simple Editable</h2>
					<p class=${sectionDesc}>Plain text with undo/redo. The minimal setup.</p>
					<div id="demo-simple" data-initial=${simpleInitial} class=${previewClass}>
						<content-area>
							<pre class="editable" contenteditable="true" spellcheck="false">
								${renderInitialLines(simpleInitial)}
							</pre>
						</content-area>
					</div>
					<div class="code-block-container code-block-live">
						<${InlineCodeBlock} value=${simpleCode} lang="tsx" editable=${true} previewId="demo-simple" />
						<${SerializeScript} class="props" value=${{code: simpleCode, lang: "tsx", editable: true, previewId: "demo-simple"}} name="inline-code-block-props" />
					</div>
				</section>

				<section>
					<h2 class=${sectionHeading}>Rainbow</h2>
					<p class=${sectionDesc}>Per-character coloring with keyed lines.</p>
					<div id="demo-rainbow" data-initial=${rainbowInitial} class=${previewClass}>
						<content-area>
							<div class="editable" contenteditable="true" spellcheck="false">
								${renderInitialLines(rainbowInitial)}
							</div>
						</content-area>
					</div>
					<div class="code-block-container code-block-live">
						<${InlineCodeBlock} value=${rainbowCode} lang="tsx" editable=${true} previewId="demo-rainbow" />
						<${SerializeScript} class="props" value=${{code: rainbowCode, lang: "tsx", editable: true, previewId: "demo-rainbow"}} name="inline-code-block-props" />
					</div>
				</section>

				<section>
					<h2 class=${sectionHeading}>Social Highlighting</h2>
					<p class=${sectionDesc}>Clickable <span style="color:#c084fc">#hashtags</span>, <span style="color:#60a5fa">@mentions</span>, and <span style="color:#34d399">links</span>.</p>
					<div id="demo-social" data-initial=${socialInitial} class=${previewClass}>
						<content-area>
							<div class="editable" contenteditable="true" spellcheck="false">
								${renderInitialLines(socialInitial)}
							</div>
						</content-area>
					</div>
					<div class="code-block-container code-block-live">
						<${InlineCodeBlock} value=${socialCode} lang="tsx" editable=${true} previewId="demo-social" />
						<${SerializeScript} class="props" value=${{code: socialCode, lang: "tsx", editable: true, previewId: "demo-social"}} name="inline-code-block-props" />
					</div>
				</section>

				<section>
					<h2 class=${sectionHeading}>Twemoji</h2>
					<p class=${sectionDesc}>Emoji replaced with SVG using <code>data-content</code>.</p>
					<div id="demo-twemoji" data-initial=${twemojiInitial} class=${previewClass}>
						<content-area>
							<div class="editable" contenteditable="true" spellcheck="false">
								${renderInitialLines(twemojiInitial)}
							</div>
						</content-area>
					</div>
					<div class="code-block-container code-block-live">
						<${InlineCodeBlock} value=${twemojiCode} lang="tsx" editable=${true} previewId="demo-twemoji" />
						<${SerializeScript} class="props" value=${{code: twemojiCode, lang: "tsx", editable: true, previewId: "demo-twemoji"}} name="inline-code-block-props" />
					</div>
				</section>

				<section>
					<h2 class=${sectionHeading}>Code Editor</h2>
					<p class=${sectionDesc}>Keyword highlighting with a simple regex tokenizer.</p>
					<div id="demo-code" data-initial=${codeInitial} class=${previewClass}>
						<content-area>
							<pre class="editable" contenteditable="true" spellcheck="false">
								${renderInitialLines(codeInitial)}
							</pre>
						</content-area>
					</div>
					<div class="code-block-container code-block-live">
						<${InlineCodeBlock} value=${codeCode} lang="tsx" editable=${true} previewId="demo-code" />
						<${SerializeScript} class="props" value=${{code: codeCode, lang: "tsx", editable: true, previewId: "demo-code"}} name="inline-code-block-props" />
					</div>
				</section>

				<section>
					<h2 class=${sectionHeading}>Blockquote</h2>
					<p class=${sectionDesc}>Styled prefixes with <code>data-contentbefore</code>. Lines starting with <code>${"> "}</code> become quotes.</p>
					<div id="demo-blockquote" data-initial=${blockquoteInitial} class=${previewClass}>
						<content-area>
							<div class="editable" contenteditable="true" spellcheck="false">
								${renderBlockquoteLines(blockquoteInitial)}
							</div>
						</content-area>
					</div>
					<div class="code-block-container code-block-live">
						<${InlineCodeBlock} value=${blockquoteCode} lang="tsx" editable=${true} previewId="demo-blockquote" />
						<${SerializeScript} class="props" value=${{code: blockquoteCode, lang: "tsx", editable: true, previewId: "demo-blockquote"}} name="inline-code-block-props" />
					</div>
				</section>

				<section>
					<h2 class=${sectionHeading}>Todo List</h2>
					<p class=${sectionDesc}>Checkbox prefixes with <code>data-contentbefore</code>. Lines starting with <code>${"- [ ] "}</code> or <code>${"- [x] "}</code> become todos.</p>
					<div id="demo-todo" data-initial=${todoInitial} class=${previewClass}>
						<content-area>
							<div class="editable" contenteditable="true" spellcheck="false">
								${renderTodoLines(todoInitial)}
							</div>
						</content-area>
					</div>
					<div class="code-block-container code-block-live">
						<${InlineCodeBlock} value=${todoCode} lang="tsx" editable=${true} previewId="demo-todo" />
						<${SerializeScript} class="props" value=${{code: todoCode, lang: "tsx", editable: true, previewId: "demo-todo"}} name="inline-code-block-props" />
					</div>
				</section>
			</main>

			<footer class=${css`
				text-align: center;
				padding: 2rem;
				color: var(--text-muted);
				border-top: 1px solid var(--border-color);
			`}>
				<a href="https://github.com/bikeshaving/revise">GitHub</a>
			</footer>
		<//Root>
	`;
}
