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
        import("./inline-code-block-M5MUBPD5.js"),
        import("./serialize-javascript-GRMSCJET.js")
      ]);
      await Promise.all([
        import("./prism-javascript-XRI4HHDT.js"),
        import("./prism-markup-H7GE7BTM.js"),
        import("./prism-diff-Y5CCZA4S.js"),
        import("./prism-bash-6UTDPGQE.js")
      ]);
      await Promise.all([
        import("./prism-jsx-OHIHR7TG.js"),
        import("./prism-typescript-MDBABI5K.js")
      ]);
      await import("./prism-tsx-YCPSAGUR.js");
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
