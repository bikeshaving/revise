// Check early if there's work to do before loading heavy dependencies
const containers = document.querySelectorAll(".code-block-container");

if (containers.length > 0) {
	(async () => {
		try {
			// Load core dependencies. inline-code-block.js transitively loads
			// code-editor.js → utils/prism.js (which sets up Prism core).
			const [
				{jsx},
				{renderer},
				{ContentAreaElement},
				{InlineCodeBlock},
				{extractData},
			] = await Promise.all([
				import("@b9g/crank/standalone"),
				import("@b9g/crank/dom"),
				import("@b9g/revise/contentarea.js"),
				import("../components/inline-code-block.js"),
				import("../components/serialize-javascript.js"),
			]);

			// Prism language components are loaded statically via
			// utils/prism.js (transitively imported by inline-code-block.js).

			if (!window.customElements.get("content-area")) {
				window.customElements.define("content-area", ContentAreaElement);
			}

			// Hydrate code blocks (reuse SSR DOM, attach interactivity)
			for (const container of Array.from(containers)) {
				const propsScript = container.querySelector(
					".props",
				) as HTMLScriptElement;
				const {code, lang, editable = false, initial, previewId} = extractData(propsScript);
				renderer.hydrate(
					jsx`
					<${InlineCodeBlock}
						value=${code}
						lang=${lang}
						editable=${editable}
						initial=${initial}
						previewId=${previewId}
					/>
				`,
					container,
				);
			}
		} catch (err) {
			console.error("Failed to initialize code blocks:", err);
		}
	})();
}
