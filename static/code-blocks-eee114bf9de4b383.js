import{h as o,i as r}from"./chunk-35WII2W6.js";r();o();var n=document.querySelectorAll(".code-block-container");n.length>0&&(async()=>{try{let[{jsx:e},{renderer:i},{ContentAreaElement:a},{InlineCodeBlock:c},{extractData:l}]=await Promise.all([import("./standalone-YG7WUDOA.js"),import("./dom-AQNT4FFG.js"),import("./contentarea-MNLGUDDM.js"),import("./inline-code-block-GIYVWOU4.js"),import("./serialize-javascript-M5TP3ADM.js")]);window.customElements.get("content-area")||window.customElements.define("content-area",a);for(let t of Array.from(n)){let s=t.querySelector(".props"),{code:d,lang:m,editable:p=!1,initial:f,previewId:w}=l(s);i.hydrate(e`
					<${c}
						value=${d}
						lang=${m}
						editable=${p}
						initial=${f}
						previewId=${w}
					/>
				`,t)}}catch(e){console.error("Failed to initialize code blocks:",e)}})();
