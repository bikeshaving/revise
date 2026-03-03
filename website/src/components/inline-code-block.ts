import {jsx} from "@b9g/crank/standalone";
import type {Context} from "@b9g/crank";
import {css} from "@emotion/css";
import {CodeEditor} from "./code-editor.js";
import {debounce} from "../utils/fns.js";
import {transform} from "../plugins/acorn.js";
import {resolveSpecifiers} from "./code-preview.js";
import {extractData} from "./serialize-javascript.js";

const buttonClass = css`
	height: 24px;
	padding: 0 8px;
	border-radius: 4px;
	border: 1px solid var(--text-color);
	background: transparent;
	color: var(--text-color);
	font-size: 10px;
	font-family: monospace;
	cursor: pointer;
	opacity: 0.85;
	transition: opacity 0.2s;
	&:hover {
		opacity: 1;
	}
`;

export function* InlineCodeBlock(
	this: Context<typeof InlineCodeBlock>,
	{
		value,
		lang,
		editable,
		previewId,
	}: {
		value: string;
		lang: string;
		editable: boolean;
		previewId?: string;
	},
): any {
	let copied = false;
	let showSource = false;

	let staticURLs: Record<string, any> | undefined;
	let prevScript: HTMLScriptElement | null = null;
	let executePreview: (() => void) | undefined;

	if (typeof window !== "undefined" && previewId) {
		staticURLs = extractData(
			document.getElementById("static-urls") as HTMLScriptElement,
		) as Record<string, any>;

		const runPreview = () => {
			const container = document.getElementById(previewId!);
			if (!container) return;

			let code: string;
			try {
				code = transform(value).code;
			} catch (err) {
				console.error("Transform error:", err);
				return;
			}

			code = resolveSpecifiers(code, staticURLs!);
			code = code.replaceAll(
				"document.body",
				`document.getElementById("${previewId}")`,
			);
			code = `document.getElementById("${previewId}").innerHTML = "";\n${code}`;

			if (prevScript) {
				prevScript.remove();
			}

			prevScript = document.createElement("script");
			prevScript.type = "module";
			prevScript.textContent = code;
			document.head.appendChild(prevScript);
		};

		executePreview = debounce(runPreview, 1500) as () => void;

		this.cleanup(() => {
			if (prevScript) {
				prevScript.remove();
				prevScript = null;
			}
		});
	}

	this.addEventListener("contentchange", (ev: any) => {
		if (ev.detail?.value == null) return;
		value = ev.detail.value;
		if (executePreview) {
			executePreview();
		}
	});

	for ({lang, editable, previewId} of this) {
		if (editable) {
			yield jsx`
				<div hydrate="!class" class=${css`
					max-width: min(100%, 1000px);
					margin: 0 auto;
				`}>
					<div hydrate="!class" class=${css`
						display: flex;
						align-items: center;
						gap: 8px;
						padding: 0.5em 0;
					`}>
						<button
							hydrate
							tabindex="0"
							onclick=${() => {
								this.refresh(() => {
									showSource = !showSource;
								});
							}}
							class=${buttonClass}
						>
							${showSource ? "Hide Source" : "View Source"}
						</button>
						<button
							hydrate
							tabindex="0"
							onclick=${async () => {
								if (typeof navigator !== "undefined" && navigator.clipboard) {
									await navigator.clipboard.writeText(value);
									this.refresh(() => (copied = true));
									setTimeout(
										() => this.refresh(() => (copied = false)),
										2000,
									);
								}
							}}
							class=${buttonClass}
						>
							${copied ? "Copied!" : "Copy Source"}
						</button>
					</div>
					<div hydrate="!class" class=${css`
						${!showSource ? "display: none;" : ""}
						border: 1px solid var(--text-color);
						border-radius: 4px;
						overflow: hidden;
						max-width: max(100%, 90ch);
					`}>
						<div hydrate="!class" class=${css`
							overflow-x: auto;
						`}>
							<${CodeEditor}
								value=${value}
								language=${lang}
								editable=${editable}
							/>
						</div>
					</div>
				</div>
			`;
		} else {
			yield jsx`
				<div class=${css`
					max-width: min(100%, 1000px);
				`}>
					<div hydrate="!class" class=${css`
						position: relative;
						border: 1px solid var(--text-color);
						border-radius: 4px;
						overflow: hidden;
					`}>
						<div hydrate="!class" class=${css`
							position: absolute;
							top: 0.5em;
							right: 0.5em;
							z-index: 10;
							display: flex;
							align-items: center;
							gap: 8px;
						`}>
							<button
								hydrate
								tabindex="0"
								onclick=${async () => {
									if (typeof navigator !== "undefined" && navigator.clipboard) {
										await navigator.clipboard.writeText(value);
										this.refresh(() => (copied = true));
										setTimeout(
											() => this.refresh(() => (copied = false)),
											2000,
										);
									}
								}}
								class=${buttonClass}
							>
								${copied ? "Copied!" : "Copy"}
							</button>
						</div>
						<div hydrate="!class" class=${css`
							overflow-x: auto;
						`}>
							<${CodeEditor}
								value=${value}
								language=${lang}
								editable=${editable}
							/>
						</div>
					</div>
				</div>
			`;
		}
	}
}
