import {
  init_Buffer,
  init_process
} from "./chunk-Z5A3KT4W.js";

// src/clients/code-blocks.ts
init_Buffer();
init_process();
var containers = document.querySelectorAll(".code-block-container");
if (containers.length > 0) {
  (async () => {
    try {
      const [
        { jsx },
        { renderer },
        { ContentAreaElement },
        { InlineCodeBlock },
        { extractData }
      ] = await Promise.all([
        import("./standalone-Z7LOVDWB.js"),
        import("./dom-N6VXVB54.js"),
        import("./contentarea-PORF2HA5.js"),
        import("./inline-code-block-62DUXGDK.js"),
        import("./serialize-javascript-AWJ6WQ64.js")
      ]);
      if (!window.customElements.get("content-area")) {
        window.customElements.define("content-area", ContentAreaElement);
      }
      for (const container of Array.from(containers)) {
        const propsScript = container.querySelector(
          ".props"
        );
        const { code, lang, editable = false, initial, previewId } = extractData(propsScript);
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
          container
        );
      }
    } catch (err) {
      console.error("Failed to initialize code blocks:", err);
    }
  })();
}
