import {jsx, Raw} from "@b9g/crank/standalone";
import type {Children, Context} from "@b9g/crank";
import {extractCritical} from "@emotion/server";
import {Navbar} from "./navbar.js";
import {Footer} from "./footer.js";
import {getColorSchemeScript} from "../utils/color-scheme.js";
import {assets, staticURLs} from "../server.js";
import {SerializeScript} from "./serialize-javascript.js";

function ColorSchemeScript() {
	const scriptText = `(() => { ${getColorSchemeScript()} })()`;
	return jsx`
		<script>
			<${Raw} value=${scriptText} />
		</script>
	`;
}

export function* Root(
	this: Context<typeof Root>,
	{
		title,
		children,
		url,
		description = "",
		noFooter = false,
	}: {
		title: string;
		children: Children;
		url: string;
		description?: string;
		noFooter?: boolean;
	},
) {
	for ({title, children, url, description = "", noFooter = false} of this) {
		this.schedule(() => this.refresh());
		const childrenHTML: string = yield jsx`
			<div id="navbar-root">
				<${Navbar} url=${url} />
			</div>
			${children}
			${!noFooter && jsx`<${Footer} />`}
		`;
		const {html, css} = extractCritical(childrenHTML);
		yield jsx`
			<${Raw} value="<!DOCTYPE html>" />
			<html lang="en">
				<head>
					<meta charset="UTF-8" />
					<meta name="viewport" content="width=device-width" />
					<title>${title}</title>
					<style><${Raw} value=${css} /></style>
					<link rel="stylesheet" type="text/css" href=${assets.clientCSS} />
					<meta name="description" content=${description} />
					<meta property="og:title" content=${title} />
					<meta property="og:description" content=${description} />
					<meta property="og:type" content="website" />
					<meta property="og:site_name" content="Revise.js" />
				</head>
				<body>
					<${ColorSchemeScript} />
					<${SerializeScript} id="static-urls" value=${staticURLs} />
					<${Raw} value=${html} />
					<script type="module" src=${assets.demosScript}></script>
					<script type="module" src=${assets.navbarScript}></script>
					<script type="module" src=${assets.codeBlocksScript}></script>
				</body>
			</html>
		`;
	}
}
