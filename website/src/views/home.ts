import {jsx} from "@b9g/crank/standalone";
import {css} from "@emotion/css";
import {InlineCodeBlock} from "../components/inline-code-block.js";
import {SerializeScript} from "../components/serialize-javascript.js";

import {Root} from "../components/root.js";

const modKey = typeof navigator !== "undefined" && /Win|Linux/.test(navigator.platform) ? "Ctrl" : "Cmd";
const SIMPLE_INITIAL = `Hello World!\nTry typing here.\nUndo with ${modKey}+Z.\n`;
const RAINBOW_INITIAL = "Hello\nWorld\nRainbow\nText\n";
const SOCIAL_INITIAL = "Check out #revise by @bikeshaving\nIt's at https://revise.js.org\n#javascript #editing @everyone\n";
const TWEMOJI_INITIAL = "Hello World! \u{1F44B}\nRevise.js is \u{1F525}\u{1F525}\u{1F525}\nType some emoji: \u{1F60E}\u{2764}\u{FE0F}\u{1F680}\n";
const CODE_INITIAL = "function greet(name) {\n  return 'Hello, ' + name;\n}\n\nconst message = greet('World');\nconsole.log(message);\n";
const TODO_INITIAL = "- [x] Build content-area\n- [x] Build Edit data structure\n- [ ] Write documentation\n- [ ] Take over the world\n";
const BLOCKQUOTE_INITIAL = "> To be or not to be,\n> that is the question.\nHamlet, Act 3, Scene 1\n";

const SIMPLE_CODE = `import type {Context} from "@b9g/crank";
import {renderer} from "@b9g/crank/dom";
import {CrankEditable, EditableState} from "@b9g/crankeditable";

function* SimpleEditable(this: Context) {
  const state = new EditableState({
    value: \`Hello World!
Try typing here.
Undo with \${/Win|Linux/.test(navigator.platform) ? "Ctrl" : "Cmd"}+Z.
\`,
  });
  for (const {} of this) {
    const lines = state.value.split("\\n");
    if (lines[lines.length - 1] === "") lines.pop();
    let cursor = 0;
    yield (
      <CrankEditable state={state} onstatechange={() => this.refresh()}>
        <pre class="editable" contenteditable="true" spellcheck="false">
          {lines.map((line) => {
            const key = state.keyer.keyAt(cursor);
            cursor += line.length + 1;
            return <div key={key}>{line || <br />}</div>;
          })}
        </pre>
      </CrankEditable>
    );
  }
}

renderer.render(<SimpleEditable />, document.body);`;

const RAINBOW_CODE = `import type {Context} from "@b9g/crank";
import {renderer} from "@b9g/crank/dom";
import {CrankEditable, EditableState} from "@b9g/crankeditable";

const COLORS = [
  "#FF0000", "#FFA500", "#FFDC00",
  "#008000", "#0000FF", "#4B0082", "#800080",
];

function* RainbowEditable(this: Context) {
  const state = new EditableState({
    value: \`Hello
World
Rainbow
Text
\`,
  });
  for (const {} of this) {
    const lines = state.value.split("\\n");
    if (lines[lines.length - 1] === "") lines.pop();
    let cursor = 0;
    yield (
      <CrankEditable state={state} onstatechange={() => this.refresh()}>
        <div class="editable" contenteditable="true" spellcheck="false">
          {lines.map((line) => {
            const key = state.keyer.keyAt(cursor);
            cursor += line.length + 1;
            const chars = line
              ? [...line].map((char, i) => (
                  <span style={"color: " + COLORS[i % COLORS.length]}>{char}</span>
                ))
              : <br />;
            return <div key={key}>{chars}</div>;
          })}
        </div>
      </CrankEditable>
    );
  }
}

renderer.render(<RainbowEditable />, document.body);`;

const SOCIAL_CODE = `import type {Context, Element} from "@b9g/crank";
import {renderer} from "@b9g/crank/dom";
import {CrankEditable, EditableState} from "@b9g/crankeditable";

const PATTERN = /(#\\w+)|(@\\w+)|(https?:\\/\\/[^\\s]+)/g;

function highlightSocial(text: string): (Element | string)[] {
  const result: (Element | string)[] = [];
  let lastIndex = 0;
  for (const match of text.matchAll(PATTERN)) {
    const index = match.index!;
    if (index > lastIndex) result.push(text.slice(lastIndex, index));
    const value = match[0];
    let color: string, href: string;
    if (match[1]) {
      color = "#c084fc";
      href = "https://example.com/tags/" + value.slice(1);
    } else if (match[2]) {
      color = "#60a5fa";
      href = "https://example.com/" + value.slice(1);
    } else {
      color = "#34d399";
      href = value;
    }
    result.push(
      <a href={href} target="_blank" rel="noopener"
        style={"color: " + color + "; text-decoration: underline"}>{value}</a>
    );
    lastIndex = index + value.length;
  }
  if (lastIndex < text.length) result.push(text.slice(lastIndex));
  return result;
}

function* SocialEditable(this: Context) {
  const state = new EditableState({
    value: \`Check out #revise by @bikeshaving
Visit https://revise.js.org
#javascript #editing @everyone
\`,
  });
  for (const {} of this) {
    const lines = state.value.split("\\n");
    if (lines[lines.length - 1] === "") lines.pop();
    let cursor = 0;
    yield (
      <CrankEditable state={state} onstatechange={() => this.refresh()}>
        <div class="editable" contenteditable="true" spellcheck="false">
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

renderer.render(<SocialEditable />, document.body);`;

const TWEMOJI_CODE = `import type {Context, Element} from "@b9g/crank";
import {renderer} from "@b9g/crank/dom";
import {CrankEditable, EditableState, ContentAreaElement} from "@b9g/crankeditable";
import {parse as parseEmoji} from "@twemoji/parser";

if (!customElements.get("content-area")) {
  customElements.define("content-area", ContentAreaElement);
}

function renderTwemoji(text: string): (Element | string)[] {
  const entities = parseEmoji(text);
  if (!entities.length) return [text];
  const result: (Element | string)[] = [];
  let lastIndex = 0;
  for (const entity of entities) {
    const [start, end] = entity.indices;
    if (start > lastIndex) result.push(text.slice(lastIndex, start));
    result.push(
      <img
        data-content={entity.text}
        src={entity.url}
        alt={entity.text}
        draggable={false}
        style="height:1.2em;width:1.2em;vertical-align:middle;display:inline-block"
      />
    );
    lastIndex = end;
  }
  if (lastIndex < text.length) result.push(text.slice(lastIndex));
  return result;
}

function* TwemojiEditable(this: Context) {
  const state = new EditableState({
    value: \`Hello World! 👋
Revise.js is 🔥🔥🔥
Type some emoji: 😎❤️🚀
\`,
  });
  for (const {} of this) {
    const lines = state.value.split("\\n");
    if (lines[lines.length - 1] === "") lines.pop();
    let cursor = 0;
    yield (
      <CrankEditable state={state} onstatechange={() => this.refresh()}>
        <div class="editable" contenteditable="true" spellcheck="false">
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

renderer.render(<TwemojiEditable />, document.body);`;

const CODE_CODE = `import type {Context, Element} from "@b9g/crank";
import {renderer} from "@b9g/crank/dom";
import {CrankEditable, EditableState} from "@b9g/crankeditable";

const KW = /\\b(function|const|let|var|return|if|else|for|while|class|import|export|from|new|typeof)\\b/g;

function highlight(line: string): (Element | string)[] {
  const result: (Element | string)[] = [];
  let lastIndex = 0;
  for (const match of line.matchAll(KW)) {
    const index = match.index!;
    if (index > lastIndex) result.push(line.slice(lastIndex, index));
    result.push(<span style="color: #c084fc">{match[0]}</span>);
    lastIndex = index + match[0].length;
  }
  if (lastIndex < line.length) result.push(line.slice(lastIndex));
  return result;
}

function* CodeEditable(this: Context) {
  const state = new EditableState({
    value: \`function greet(name) {
  return 'Hello, ' + name;
}

const message = greet('World');
console.log(message);
\`,
  });
  for (const {} of this) {
    const lines = state.value.split("\\n");
    if (lines[lines.length - 1] === "") lines.pop();
    let cursor = 0;
    yield (
      <CrankEditable state={state} onstatechange={() => this.refresh()}>
        <pre class="editable" contenteditable="true" spellcheck="false">
          {lines.map((line) => {
            const key = state.keyer.keyAt(cursor);
            cursor += line.length + 1;
            return (
              <div key={key}>
                <code>{line ? highlight(line) : null}</code>
                <br />
              </div>
            );
          })}
        </pre>
      </CrankEditable>
    );
  }
}

renderer.render(<CodeEditable />, document.body);`;

const TODO_CODE = `import type {Context} from "@b9g/crank";
import {renderer} from "@b9g/crank/dom";
import {CrankEditable, EditableState} from "@b9g/crankeditable";

function* TodoEditable(this: Context) {
  const state = new EditableState({
    value: \`- [x] Build content-area
- [x] Build Edit data structure
- [ ] Write documentation
- [ ] Take over the world
\`,
  });
  for (const {} of this) {
    const lines = state.value.split("\\n");
    if (lines[lines.length - 1] === "") lines.pop();
    let cursor = 0;
    yield (
      <CrankEditable state={state} onstatechange={() => this.refresh()}>
        <div class="editable" contenteditable="true" spellcheck="false">
          {lines.map((line) => {
            const lineStart = cursor;
            const key = state.keyer.keyAt(cursor);
            cursor += line.length + 1;
            const match = line.match(/^(- \\[[ x]\\] )([\\s\\S]*)$/);
            if (match) {
              const prefix = match[1];
              const checked = prefix === "- [x] ";
              return (
                <div key={key} data-contentbefore={prefix}>
                  <input
                    type="checkbox"
                    checked={checked}
                    data-content=""
                    contenteditable="false"
                    onclick={() => {
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
                  <span style={checked
                    ? {textDecoration: "line-through", opacity: "0.5"}
                    : undefined}>
                    {match[2] || <br />}
                  </span>
                </div>
              );
            }
            return <div key={key}>{line || <br />}</div>;
          })}
        </div>
      </CrankEditable>
    );
  }
}

renderer.render(<TodoEditable />, document.body);`;

const BLOCKQUOTE_CODE = `import type {Context} from "@b9g/crank";
import {renderer} from "@b9g/crank/dom";
import {CrankEditable, EditableState} from "@b9g/crankeditable";

function* BlockquoteEditable(this: Context) {
  const state = new EditableState({
    value: \`> To be or not to be,
> that is the question.
Hamlet, Act 3, Scene 1
\`,
  });
  for (const {} of this) {
    const lines = state.value.split("\\n");
    if (lines[lines.length - 1] === "") lines.pop();
    let cursor = 0;
    yield (
      <CrankEditable state={state} onstatechange={() => this.refresh()}>
        <div class="editable" contenteditable="true" spellcheck="false">
          {lines.map((line) => {
            const key = state.keyer.keyAt(cursor);
            cursor += line.length + 1;
            const match = line.match(/^(> )([\\s\\S]*)$/);
            if (match) {
              return (
                <div key={key} data-contentbefore="> " style={{
                  borderLeft: "3px solid currentColor",
                  paddingLeft: "0.5em",
                  opacity: 0.7,
                }}>
                  {match[2] || <br />}
                </div>
              );
            }
            return <div key={key}>{line || <br />}</div>;
          })}
        </div>
      </CrankEditable>
    );
  }
}

renderer.render(<BlockquoteEditable />, document.body);`;

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

export default function Home({url}: {url: string}) {
	return jsx`
		<${Root} title="Revise" url=${url} description="A rich text editing foundations library">
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
					<div id="demo-simple" data-initial=${SIMPLE_INITIAL} class=${previewClass}>
						<content-area>
							<pre class="editable" contenteditable="true" spellcheck="false">
								${renderInitialLines(SIMPLE_INITIAL)}
							</pre>
						</content-area>
					</div>
					<div class="code-block-container code-block-live">
						<${InlineCodeBlock} value=${SIMPLE_CODE} lang="tsx" editable=${true} previewId="demo-simple" />
						<${SerializeScript} class="props" value=${{code: SIMPLE_CODE, lang: "tsx", editable: true, previewId: "demo-simple"}} name="inline-code-block-props" />
					</div>
				</section>

				<section>
					<h2 class=${sectionHeading}>Rainbow</h2>
					<p class=${sectionDesc}>Per-character coloring with keyed lines.</p>
					<div id="demo-rainbow" data-initial=${RAINBOW_INITIAL} class=${previewClass}>
						<content-area>
							<div class="editable" contenteditable="true" spellcheck="false">
								${renderInitialLines(RAINBOW_INITIAL)}
							</div>
						</content-area>
					</div>
					<div class="code-block-container code-block-live">
						<${InlineCodeBlock} value=${RAINBOW_CODE} lang="tsx" editable=${true} previewId="demo-rainbow" />
						<${SerializeScript} class="props" value=${{code: RAINBOW_CODE, lang: "tsx", editable: true, previewId: "demo-rainbow"}} name="inline-code-block-props" />
					</div>
				</section>

				<section>
					<h2 class=${sectionHeading}>Social Highlighting</h2>
					<p class=${sectionDesc}>Clickable <span style="color:#c084fc">#hashtags</span>, <span style="color:#60a5fa">@mentions</span>, and <span style="color:#34d399">links</span>.</p>
					<div id="demo-social" data-initial=${SOCIAL_INITIAL} class=${previewClass}>
						<content-area>
							<div class="editable" contenteditable="true" spellcheck="false">
								${renderInitialLines(SOCIAL_INITIAL)}
							</div>
						</content-area>
					</div>
					<div class="code-block-container code-block-live">
						<${InlineCodeBlock} value=${SOCIAL_CODE} lang="tsx" editable=${true} previewId="demo-social" />
						<${SerializeScript} class="props" value=${{code: SOCIAL_CODE, lang: "tsx", editable: true, previewId: "demo-social"}} name="inline-code-block-props" />
					</div>
				</section>

				<section>
					<h2 class=${sectionHeading}>Twemoji</h2>
					<p class=${sectionDesc}>Emoji replaced with SVG using <code>data-content</code>.</p>
					<div id="demo-twemoji" data-initial=${TWEMOJI_INITIAL} class=${previewClass}>
						<content-area>
							<div class="editable" contenteditable="true" spellcheck="false">
								${renderInitialLines(TWEMOJI_INITIAL)}
							</div>
						</content-area>
					</div>
					<div class="code-block-container code-block-live">
						<${InlineCodeBlock} value=${TWEMOJI_CODE} lang="tsx" editable=${true} previewId="demo-twemoji" />
						<${SerializeScript} class="props" value=${{code: TWEMOJI_CODE, lang: "tsx", editable: true, previewId: "demo-twemoji"}} name="inline-code-block-props" />
					</div>
				</section>

				<section>
					<h2 class=${sectionHeading}>Code Editor</h2>
					<p class=${sectionDesc}>Keyword highlighting with a simple regex tokenizer.</p>
					<div id="demo-code" data-initial=${CODE_INITIAL} class=${previewClass}>
						<content-area>
							<pre class="editable" contenteditable="true" spellcheck="false">
								${renderInitialLines(CODE_INITIAL)}
							</pre>
						</content-area>
					</div>
					<div class="code-block-container code-block-live">
						<${InlineCodeBlock} value=${CODE_CODE} lang="tsx" editable=${true} previewId="demo-code" />
						<${SerializeScript} class="props" value=${{code: CODE_CODE, lang: "tsx", editable: true, previewId: "demo-code"}} name="inline-code-block-props" />
					</div>
				</section>

				<section>
					<h2 class=${sectionHeading}>Blockquote</h2>
					<p class=${sectionDesc}>Styled prefixes with <code>data-contentbefore</code>.</p>
					<div id="demo-blockquote" data-initial=${BLOCKQUOTE_INITIAL} class=${previewClass}>
						<content-area>
							<div class="editable" contenteditable="true" spellcheck="false">
								${renderBlockquoteLines(BLOCKQUOTE_INITIAL)}
							</div>
						</content-area>
					</div>
					<div class="code-block-container code-block-live">
						<${InlineCodeBlock} value=${BLOCKQUOTE_CODE} lang="tsx" editable=${true} previewId="demo-blockquote" />
						<${SerializeScript} class="props" value=${{code: BLOCKQUOTE_CODE, lang: "tsx", editable: true, previewId: "demo-blockquote"}} name="inline-code-block-props" />
					</div>
				</section>

				<section>
					<h2 class=${sectionHeading}>Todo List</h2>
					<p class=${sectionDesc}>Checkbox prefixes with <code>data-contentbefore</code>.</p>
					<div id="demo-todo" data-initial=${TODO_INITIAL} class=${previewClass}>
						<content-area>
							<div class="editable" contenteditable="true" spellcheck="false">
								${renderTodoLines(TODO_INITIAL)}
							</div>
						</content-area>
					</div>
					<div class="code-block-container code-block-live">
						<${InlineCodeBlock} value=${TODO_CODE} lang="tsx" editable=${true} previewId="demo-todo" />
						<${SerializeScript} class="props" value=${{code: TODO_CODE, lang: "tsx", editable: true, previewId: "demo-todo"}} name="inline-code-block-props" />
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
