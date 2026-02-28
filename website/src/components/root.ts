import {jsx, Raw} from "@b9g/crank/standalone";
import type {Children, Context} from "@b9g/crank";
import {extractCritical} from "@emotion/server";
import {assets} from "../server.js";

export function* Root(
	this: Context,
	{
		title,
		children,
		url,
		description = "",
	}: {
		title: string;
		children: Children;
		url: string;
		description?: string;
	},
) {
	for ({title, children, url, description = ""} of this) {
		this.schedule(() => this.refresh());
		// First pass: render children to extract critical CSS
		const childrenHTML: string = yield jsx`${children}`;
		const {html, css} = extractCritical(childrenHTML);
		// Second pass: full HTML document with extracted CSS
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
					<meta property="og:site_name" content="Revise" />
				</head>
				<body>
					<${Raw} value=${html} />
					<script type="module" src=${assets.demosScript}></script>
				</body>
			</html>
		`;
	}
}
