import {jsx} from "@b9g/crank/standalone";
import {css} from "@emotion/css";

import {Root} from "../components/root.js";

const SIMPLE_INITIAL = "Hello World!\nTry typing here.\nUndo with Cmd+Z.\n";

const RAINBOW_INITIAL = "Hello\nWorld\nRainbow\nText\n";

const SOCIAL_INITIAL = "Check out #revise by @bikeshaving\nIt's at https://revise.js.org\n#javascript #editing @everyone\n";

const CODE_INITIAL = `function greet(name: string): string {
\treturn \`Hello, \${name}!\`;
}

const message = greet("World");
console.log(message);
`;

export default function Home({url}: {url: string}) {
	return jsx`
		<${Root} title="Revise" url=${url} description="A rich text editing primitives library">
			<header class=${css`
				text-align: center;
				padding: 6rem 1rem 2rem;
			`}>
				<h1 class=${css`
					font-size: max(40px, 8vw);
					color: var(--highlight-color);
					margin: 0;
				`}>Revise.js</h1>
				<p class=${css`
					font-size: 1.25rem;
					color: var(--text-muted);
					margin: 0.5em 0 0;
				`}>Rich text editing primitives for the web</p>
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
					<h2 class=${css`
						color: var(--highlight-color);
						font-size: 1.5rem;
						margin: 0 0 0.5em;
					`}>Simple Editable</h2>
					<p class=${css`
						color: var(--text-muted);
						margin: 0 0 1em;
					`}>Plain text with undo/redo. The minimal setup.</p>
					<div
						id="demo-simple"
						data-initial=${SIMPLE_INITIAL}
					/>
				</section>

				<section>
					<h2 class=${css`
						color: var(--highlight-color);
						font-size: 1.5rem;
						margin: 0 0 0.5em;
					`}>Rainbow</h2>
					<p class=${css`
						color: var(--text-muted);
						margin: 0 0 1em;
					`}>Per-character coloring with keyed lines.</p>
					<div
						id="demo-rainbow"
						data-initial=${RAINBOW_INITIAL}
					/>
				</section>

				<section>
					<h2 class=${css`
						color: var(--highlight-color);
						font-size: 1.5rem;
						margin: 0 0 0.5em;
					`}>Social Highlighting</h2>
					<p class=${css`
						color: var(--text-muted);
						margin: 0 0 1em;
					`}><span style="color:#c084fc">#hashtags</span>, <span style="color:#60a5fa">@mentions</span>, and <span style="color:#34d399">https://links</span>.</p>
					<div
						id="demo-social"
						data-initial=${SOCIAL_INITIAL}
					/>
				</section>

				<section>
					<h2 class=${css`
						color: var(--highlight-color);
						font-size: 1.5rem;
						margin: 0 0 0.5em;
					`}>Code Editor</h2>
					<p class=${css`
						color: var(--text-muted);
						margin: 0 0 1em;
					`}>Syntax highlighting with Prism.js.</p>
					<div
						id="demo-code"
						data-initial=${CODE_INITIAL}
					/>
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
