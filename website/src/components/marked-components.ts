import {jsx} from "@b9g/crank/standalone";
import {InlineCodeBlock} from "./inline-code-block.js";
import {SerializeScript} from "./serialize-javascript.js";

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

let liveCounter = 0;

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

	code({token}: any) {
		const {text: code, lang} = token;
		const isLive = lang && lang.endsWith(" live");
		const language = lang ? lang.replace(/ live$/, "") : "";
		if (isLive) {
			const previewId = `live-preview-${liveCounter++}`;
			return jsx`
				<div style="margin: 30px 0; max-width: 800px;">
					<div id=${previewId} style="padding: 1em; border: 1px dashed var(--border-color); border-radius: 4px; margin-bottom: 1em;"></div>
					<div class="code-block-container code-block-live">
						<${InlineCodeBlock} value=${code} lang=${language} editable=${true} previewId=${previewId} />
						<${SerializeScript} class="props" value=${{code, lang: language, editable: true, previewId}} name="inline-code-block-props" />
					</div>
				</div>
			`;
		}

		return jsx`
			<div style="margin: 30px 0;" class="code-block-container">
				<${InlineCodeBlock} value=${code} lang=${language} editable=${false} />
				<${SerializeScript} class="props" value=${{code, lang: language, editable: false}} name="inline-code-block-props" />
			</div>
		`;
	},
};
