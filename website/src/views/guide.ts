import {jsx} from "@b9g/crank/standalone";
import {css} from "@emotion/css";

import {Root} from "../components/root.js";
import {Main, Sidebar} from "../components/sidebar.js";
import {Marked} from "../components/marked.js";
import {components} from "../components/marked-components.js";

import {collectDocuments} from "../models/document.js";

export default async function Guide({url}: {url: string}) {
	const docsDir = await self.directories.open("docs");
	const guidesDir = await docsDir.getDirectoryHandle("guides");
	const docs = await collectDocuments(guidesDir, "guides");

	const post = docs.find(
		(doc) => doc.url.replace(/\/$/, "") === url.replace(/\/$/, ""),
	);
	if (!post) {
		return new Response(`<h1>404</h1><p>Guide not found: ${url}</p>`, {
			status: 404,
			headers: {"Content-Type": "text/html"},
		});
	}

	const {
		attributes: {title, description},
		body,
	} = post;
	return jsx`
		<${Root} title="Revise.js | ${title}" url=${url} description=${description}>
			<${Sidebar} docs=${docs} url=${url} title="Guides" />
			<${Main}>
				<h1>${title}</h1>
				<${Marked} markdown=${body} components=${components} basePath="guides" />
			<//Main>
		<//Root>
	`;
}
