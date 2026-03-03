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
const LINKIFY_INITIAL = "Check out https://revise.js.org\nAlso see http://example.com\nPlain text stays plain.\n";
const CODE_INITIAL = "function greet(name) {\n  return 'Hello, ' + name;\n}\n\nconst message = greet('World');\nconsole.log(message);\n";

const SIMPLE_CODE = `import type {Context} from "@b9g/crank";
import {renderer} from "@b9g/crank/dom";
import {CrankEditable, EditableState} from "@b9g/crankeditable";
import {ContentAreaElement} from "@b9g/revise/contentarea.js";

if (!customElements.get("content-area")) {
  customElements.define("content-area", ContentAreaElement);
}

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
import {ContentAreaElement} from "@b9g/revise/contentarea.js";

if (!customElements.get("content-area")) {
  customElements.define("content-area", ContentAreaElement);
}

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
import {ContentAreaElement} from "@b9g/revise/contentarea.js";

if (!customElements.get("content-area")) {
  customElements.define("content-area", ContentAreaElement);
}

const PATTERN = /(#\\w+)|(@\\w+)|(https?:\\/\\/[^\\s]+)/g;

function highlightSocial(text: string): (Element | string)[] {
  const result: (Element | string)[] = [];
  let lastIndex = 0;
  for (const match of text.matchAll(PATTERN)) {
    const index = match.index!;
    if (index > lastIndex) result.push(text.slice(lastIndex, index));
    let color = "#34d399";
    if (match[1]) color = "#c084fc";
    else if (match[2]) color = "#60a5fa";
    result.push(<span style={"color: " + color}>{match[0]}</span>);
    lastIndex = index + match[0].length;
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
import {CrankEditable, EditableState} from "@b9g/crankeditable";
import {ContentAreaElement} from "@b9g/revise/contentarea.js";
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
import {ContentAreaElement} from "@b9g/revise/contentarea.js";

if (!customElements.get("content-area")) {
  customElements.define("content-area", ContentAreaElement);
}

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

const LINKIFY_CODE = `import type {Context, Element} from "@b9g/crank";
import {renderer} from "@b9g/crank/dom";
import {CrankEditable, EditableState} from "@b9g/crankeditable";
import {ContentAreaElement} from "@b9g/revise/contentarea.js";

if (!customElements.get("content-area")) {
  customElements.define("content-area", ContentAreaElement);
}

const URL_PATTERN = /(https?:\\/\\/[^\\s]+)/g;

function linkify(text: string): (Element | string)[] {
  const result: (Element | string)[] = [];
  let lastIndex = 0;
  for (const match of text.matchAll(URL_PATTERN)) {
    const index = match.index!;
    if (index > lastIndex) result.push(text.slice(lastIndex, index));
    result.push(
      <a href={match[0]} target="_blank" rel="noopener" style="color: #60a5fa; text-decoration: underline">
        {match[0]}
      </a>
    );
    lastIndex = index + match[0].length;
  }
  if (lastIndex < text.length) result.push(text.slice(lastIndex));
  return result;
}

function* LinkifyEditable(this: Context) {
  const state = new EditableState({
    value: \`Check out https://revise.js.org
Also see http://example.com
Plain text stays plain.
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
            return <div key={key}>{line ? linkify(line) : <br />}</div>;
          })}
        </div>
      </CrankEditable>
    );
  }
}

renderer.render(<LinkifyEditable />, document.body);`;

function renderInitialLines(text: string) {
	const lines = text.split("\n");
	if (lines[lines.length - 1] === "") lines.pop();
	return lines.map((line: string) =>
		jsx`<div>${line || jsx`<br />`}</div>`,
	);
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
		<${Root} title="Revise" url=${url} description="A rich text editing primitives library">
			<header class=${css`
				text-align: center;
				padding: 6rem 1rem 2rem;
			`}>
				<div id="hero-title" data-initial=${"Revise.js\n"}>
					<h1 class=${css`
						font-size: max(40px, 8vw);
						color: var(--highlight-color);
						margin: 0;
					`}>Revise.js</h1>
				</div>
				<div id="hero-tagline" data-initial=${"Rich text editing primitives for the web\n"}>
					<p class=${css`
						font-size: 1.25rem;
						color: var(--text-muted);
						margin: 0.5em 0 0;
					`}>Rich text editing primitives for the web</p>
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
						<pre class="editable" contenteditable="true" spellcheck="false">
							${renderInitialLines(SIMPLE_INITIAL)}
						</pre>
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
						<div class="editable" contenteditable="true" spellcheck="false">
							${renderInitialLines(RAINBOW_INITIAL)}
						</div>
					</div>
					<div class="code-block-container code-block-live">
						<${InlineCodeBlock} value=${RAINBOW_CODE} lang="tsx" editable=${true} previewId="demo-rainbow" />
						<${SerializeScript} class="props" value=${{code: RAINBOW_CODE, lang: "tsx", editable: true, previewId: "demo-rainbow"}} name="inline-code-block-props" />
					</div>
				</section>

				<section>
					<h2 class=${sectionHeading}>Social Highlighting</h2>
					<p class=${sectionDesc}><span style="color:#c084fc">#hashtags</span>, <span style="color:#60a5fa">@mentions</span>, and <span style="color:#34d399">https://links</span>.</p>
					<div id="demo-social" data-initial=${SOCIAL_INITIAL} class=${previewClass}>
						<div class="editable" contenteditable="true" spellcheck="false">
							${renderInitialLines(SOCIAL_INITIAL)}
						</div>
					</div>
					<div class="code-block-container code-block-live">
						<${InlineCodeBlock} value=${SOCIAL_CODE} lang="tsx" editable=${true} previewId="demo-social" />
						<${SerializeScript} class="props" value=${{code: SOCIAL_CODE, lang: "tsx", editable: true, previewId: "demo-social"}} name="inline-code-block-props" />
					</div>
				</section>

				<section>
					<h2 class=${sectionHeading}>Linkify</h2>
					<p class=${sectionDesc}>URLs automatically become clickable <span style="color:#60a5fa">links</span>.</p>
					<div id="demo-linkify" data-initial=${LINKIFY_INITIAL} class=${previewClass}>
						<div class="editable" contenteditable="true" spellcheck="false">
							${renderInitialLines(LINKIFY_INITIAL)}
						</div>
					</div>
					<div class="code-block-container code-block-live">
						<${InlineCodeBlock} value=${LINKIFY_CODE} lang="tsx" editable=${true} previewId="demo-linkify" />
						<${SerializeScript} class="props" value=${{code: LINKIFY_CODE, lang: "tsx", editable: true, previewId: "demo-linkify"}} name="inline-code-block-props" />
					</div>
				</section>

				<section>
					<h2 class=${sectionHeading}>Twemoji</h2>
					<p class=${sectionDesc}>Emoji replaced with SVG using <code>data-content</code>.</p>
					<div id="demo-twemoji" data-initial=${TWEMOJI_INITIAL} class=${previewClass}>
						<div class="editable" contenteditable="true" spellcheck="false">
							${renderInitialLines(TWEMOJI_INITIAL)}
						</div>
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
						<pre class="editable" contenteditable="true" spellcheck="false">
							${renderInitialLines(CODE_INITIAL)}
						</pre>
					</div>
					<div class="code-block-container code-block-live">
						<${InlineCodeBlock} value=${CODE_CODE} lang="tsx" editable=${true} previewId="demo-code" />
						<${SerializeScript} class="props" value=${{code: CODE_CODE, lang: "tsx", editable: true, previewId: "demo-code"}} name="inline-code-block-props" />
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
