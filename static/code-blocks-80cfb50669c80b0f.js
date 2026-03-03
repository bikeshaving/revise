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
        import("./standalone-LE4PK7N4.js"),
        import("./dom-2KCSDALJ.js"),
        import("./contentarea-BARUYYLG.js"),
        import("./inline-code-block-4Q2NST5M.js"),
        import("./serialize-javascript-GRMSCJET.js")
      ]);
      await Promise.all([
        import("./prism-javascript-OKHMDSIJ.js"),
        import("./prism-markup-NBMLY44R.js"),
        import("./prism-diff-6RLALL5R.js"),
        import("./prism-bash-PBFJQVBJ.js")
      ]);
      await Promise.all([
        import("./prism-jsx-6QFYC4O6.js"),
        import("./prism-typescript-YE3LYPYN.js")
      ]);
      await import("./prism-tsx-54YULGN7.js");
      if (!window.customElements.get("content-area")) {
        window.customElements.define("content-area", ContentAreaElement);
      }
      for (const container of Array.from(containers)) {
        const propsScript = container.querySelector(
          ".props"
        );
        const { code, lang, editable = false } = extractData(propsScript);
        renderer.render(
          jsx`
					<${InlineCodeBlock}
						value=${code}
						lang=${lang}
						editable=${editable}
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
