import {jsx} from "@b9g/crank/standalone";
import {css} from "@emotion/css";

import {ColorSchemeToggle} from "./color-scheme-toggle.js";

const positionFixed = css`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	height: 50px;
	z-index: 999;
	gap: 1em;
`;

const navbarGroupLayout = css`
	display: flex;
	flex-direction: row;
	justify-content: center;
	align-items: center;
	gap: 1em;
`;

export function Navbar({url}: {url: string}) {
	return jsx`
		<nav
			class="
				blur-background
				${positionFixed}
				${css`
					border-bottom: 1px solid var(--border-color);
					overflow-x: auto;
					background-color: inherit;
					a {
						text-decoration: none;
						font-weight: bold;
					}

					@media screen and (min-width: 800px) {
						padding: 0 2em;
					}

					display: flex;
					flex-direction: row;
					justify-content: space-between;
					gap: 1em;
				`}
			"
		>
			<div class=${navbarGroupLayout}>
				<div>
					<a
						aria-current=${url === "/" && "page"}
						href="/"
					>Revise.js</a>
				</div>
				<div>
					<a
						href="/guides/getting-started/"
						aria-current=${url.startsWith("/guides") && "page"}
					>Guides</a>
				</div>
				<div>
					<a
						href="/blog/"
						aria-current=${url.startsWith("/blog") && "page"}
					>Blog</a>
				</div>
			</div>
			<div class=${navbarGroupLayout}>
				<div>
					<a href="https://github.com/bikeshaving/revise">GitHub</a>
				</div>
				<div>
					<a href="https://www.npmjs.com/package/@b9g/revise">NPM</a>
				</div>
				<${ColorSchemeToggle} />
			</div>
		</nav>
	`;
}
