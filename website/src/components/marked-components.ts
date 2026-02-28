import {jsx} from "@b9g/crank/standalone";

function resolveMarkdownHref(href: string, basePath: string): string {
	const baseParts = basePath.split("/").filter(Boolean);
	for (const part of href.split("/")) {
		if (part === "..") {
			baseParts.pop();
		} else if (part !== ".") {
			baseParts.push(part);
		}
	}

	return (
		"/" +
		baseParts
			.join("/")
			.replace(/\.md$/, "")
			.replace(/([0-9]+-)+/, "")
	);
}

export const components = {
	link({token, rootProps, children}: any) {
		const {href, title} = token;
		const resolvedHref =
			href && href.endsWith(".md") && rootProps.basePath
				? resolveMarkdownHref(href, rootProps.basePath)
				: href;
		return jsx`<a href=${resolvedHref} title=${title}>${children}</a>`;
	},

	codespan({token}: any) {
		return jsx`<code class="inline">${token.text}</code>`;
	},
};
