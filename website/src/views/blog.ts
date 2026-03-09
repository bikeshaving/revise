import {jsx} from "@b9g/crank/standalone";
import {css} from "@emotion/css";

import {Root} from "../components/root.js";
import {Main, Sidebar} from "../components/sidebar.js";
import {Marked} from "../components/marked.js";
import {components} from "../components/marked-components.js";

import {collectDocuments} from "../models/document.js";

export default async function Blog({url}: {url: string}) {
	const docsDir = await self.directories.open("docs");
	const blogDir = await docsDir.getDirectoryHandle("blog");
	const docs = await collectDocuments(blogDir, "blog");

	const post = docs.find(
		(doc) => doc.url.replace(/\/$/, "") === url.replace(/\/$/, ""),
	);
	if (!post) {
		return new Response(`<h1>404</h1><p>Blog post not found: ${url}</p>`, {
			status: 404,
			headers: {"Content-Type": "text/html"},
		});
	}

	const {
		attributes: {title, description, author, authorURL, publishDate},
		body,
	} = post;
	const dateStr =
		publishDate &&
		publishDate.toLocaleDateString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	return jsx`
		<${Root} title="Revise.js | ${title}" url=${url} description=${description}>
			<${Sidebar} docs=${docs} url=${url} title="Blog" />
			<${Main}>
				<h1>${title}</h1>
				${(author || dateStr) && jsx`
					<p class=${css`
						color: var(--text-muted-color, #666);
						margin-top: -0.5em;
						font-size: 0.9em;
					`}>
						${author && authorURL
							? jsx`<a href=${authorURL}>${author}</a>`
							: author}${author && dateStr && " · "}${dateStr}
					</p>
				`}
				<${Marked} markdown=${body} components=${components} basePath="blog" />
			<//Main>
		<//Root>
	`;
}
