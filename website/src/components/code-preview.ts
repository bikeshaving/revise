import {jsx} from "@b9g/crank/standalone";
import type {Context} from "@b9g/crank";
import {css} from "@emotion/css";
import {debounce} from "../utils/fns.js";
import {transform} from "../plugins/acorn.js";
import {extractData} from "./serialize-javascript.js";
import {getColorSchemeScript} from "../utils/color-scheme.js";

/**
 * Generate an Import Map from staticURLs for bare specifier resolution.
 */
function generateImportMap(staticURLs: Record<string, string>): string {
	const imports: Record<string, string> = {};
	for (const [key, value] of Object.entries(staticURLs)) {
		// Skip non-module entries like CSS
		if (!key.endsWith(".css")) {
			imports[key] = value;
		}
	}
	return JSON.stringify({imports}, null, "\t\t\t");
}

function generateJavaScriptIFrameHTML(
	id: number,
	code: string,
	staticURLs: Record<string, any>,
): string {
	return `
		<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="utf-8">
			<meta name="viewport" content="width=device-width,initial-scale=1">
			<script>
				${getColorSchemeScript()}
			</script>
			<script type="importmap">
				${generateImportMap(staticURLs)}
			</script>
			<style>
				/* Minimal reset - only margin/padding, let apps define their own styles */
				html, body {
					margin: 0;
					padding: 0;
				}

				/* CSS variables for apps that want to use them */
				:root {
					--bg-color: #0f1117;
					--text-color: #e4e4e7;
					--highlight-color: #60a5fa;
				}
				.color-scheme-light {
					--bg-color: #f0f4f8;
					--text-color: #1a1b26;
				}
			</style>
			<link
				rel="stylesheet"
				type="text/css"
				href=${staticURLs!["client.css"]}
			/>
		</head>
		<body>
			<script>
				// Listen for color scheme changes from parent
				window.addEventListener('storage', (e) => {
					if (e.key === 'color-scheme' && (e.newValue === 'dark' || e.newValue === 'light')) {
						const isDark = e.newValue === 'dark';
						document.documentElement.dataset.theme = e.newValue;
						document.documentElement.style.setProperty('--bg-color', isDark ? '#0f1117' : '#f0f4f8');
						document.documentElement.style.setProperty('--text-color', isDark ? '#e4e4e7' : '#1a1b26');
						document.documentElement.classList.toggle('color-scheme-light', !isDark);
						document.body.classList.toggle('color-scheme-light', !isDark);
					}
				});

				window.addEventListener("load", (ev) => {
					window.parent.postMessage(
						JSON.stringify({type: "executed", id: ${id}}),
						window.location.origin,
					);
				});

				window.addEventListener("error", (ev) => {
					// https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver#observation_errors
					if (/ResizeObserver loop completed with undelivered notifications/.test(ev.message)) {
						return;
					}

					window.parent.postMessage(
						JSON.stringify({type: "error", id: ${id}, message: ev.message}),
						window.location.origin,
					);
				});

				window.addEventListener("unhandledrejection", (ev) => {
					if (/ResizeObserver loop completed with undelivered notifications/.test(ev.reason.message)) {
						return;
					}
					window.parent.postMessage(
						JSON.stringify({type: "error", id: ${id}, message: ev.reason.message}),
						window.location.origin,
					);
				});

				const obs = new ResizeObserver((entries) => {
					const height = Math.max(entries[0].contentRect.height, 100);
					if (
						document.documentElement.clientHeight <
						document.documentElement.scrollHeight
					) {
						window.parent.postMessage(
							JSON.stringify({
								type: "resize",
								id: ${id},
								height,
							}),
							window.location.origin,
						);
					}
				})

				obs.observe(document.documentElement);
			</script>
			<script type="module">${code}</script>
		</body>
		</html>
	`;
}

/**
 * Resolve bare module specifiers in transformed code using the staticURLs map.
 * This allows executing code in the main page context without an import map.
 */
export function resolveSpecifiers(
	code: string,
	staticURLs: Record<string, any>,
): string {
	for (const [key, url] of Object.entries(staticURLs)) {
		if (!key.endsWith(".css")) {
			code = code.replaceAll(`"${key}"`, `"${url}"`);
		}
	}
	return code;
}

function renderInitialLines(text: string) {
	const lines = text.split("\n");
	if (lines[lines.length - 1] === "") lines.pop();
	return lines.map((line: string) =>
		jsx`<div>${line || jsx`<br />`}</div>`,
	);
}

let globalId = 0;
export function* CodePreview(
	this: Context<typeof CodePreview>,
	{
		value,
		visible = true,
		autoresize = false,
		initial,
	}: {
		value: string;
		visible?: boolean;
		autoresize?: boolean;
		initial?: string;
	},
): any {
	const id = globalId++;
	let iframe!: HTMLIFrameElement;
	// We use this iframe ID as the key for the iframe, so that previous iframes
	// are destroyed along with any registered callbacks like setInterval.
	let iframeID = 0;
	let loading = true;
	let errorMessage: string | null = null;
	let showErrorModal = true;
	let suppressErrors = false;

	// Inline mode: execute code directly in the page on first render.
	// Switches to iframe mode when code is edited for full isolation.
	let inlineMode = true;
	let inlineExecuted = false;
	const inlineState = {
		container: null as HTMLElement | null,
		script: null as HTMLScriptElement | null,
	};
	const inlineContainerId = `__preview_${id}`;

	let staticURLs: Record<string, any> | undefined;
	let executeInline: () => void;
	let execute: () => unknown;
	let executeDebounced: () => unknown;
	let firstIframeExecution = true;
	if (typeof window !== "undefined") {
		staticURLs = extractData(
			document.getElementById("static-urls") as HTMLScriptElement,
		) as Record<string, any>;

		executeInline = () => {
			if (!inlineState.container) return;

			let code = value;
			try {
				const parsed = transform(value);
				code = parsed.code;
			} catch (err: any) {
				console.error(err);
				return;
			}

			// Resolve all bare specifiers to full URLs
			code = resolveSpecifiers(code, staticURLs!);
			// Target our container instead of document.body
			inlineState.container.id = inlineContainerId;
			code = code.replaceAll(
				"document.body",
				`document.getElementById("${inlineContainerId}")`,
			);
			// Clear SSR placeholder before rendering (runs in same synchronous
			// block as the demo's renderer.render(), so no visible flash)
			code = `document.getElementById("${inlineContainerId}").innerHTML = "";\n${code}`;

			inlineState.script = document.createElement("script");
			inlineState.script.type = "module";
			inlineState.script.textContent = code;
			document.head.appendChild(inlineState.script);
			inlineExecuted = true;
		};

		execute = () => {
			if (!visible) {
				return;
			}

			if (firstIframeExecution) {
				firstIframeExecution = false;
			} else {
				// We have to refresh to change the iframe variable in scope, as
				// the previous iframe is destroyed. We would have to await
				// refresh if this component was refactored to be async.
				this.refresh(() => {
					iframeID++;
				});
			}
			const document1 = iframe.contentDocument;
			if (document1 == null) {
				return;
			}

			let code = value;

			try {
				const parsed = transform(value);
				code = parsed.code;
				document1.write(generateJavaScriptIFrameHTML(id, code, staticURLs!));
			} catch (err: any) {
				console.error(err);
				this.refresh(() => {
					loading = false;
					errorMessage = err.message || err;
				});
				return;
			}

			document1.close();
		};

		executeDebounced = debounce(execute, 2000);
	}

	let height = 100;
	if (typeof window !== "undefined") {
		const onmessage = (ev: any) => {
			let data: any = JSON.parse(ev.data);
			if (data.id !== id) {
				return;
			}

			if (data.type === "executed") {
				this.refresh(() => {
					loading = false;
				});
			} else if (data.type === "error") {
				this.refresh(() => {
					loading = false;
					errorMessage = data.message;
					showErrorModal = !suppressErrors;
				});
			} else if (data.type === "resize" && visible) {
				if (autoresize) {
					// Auto-resizing iframes is tricky because you can get into an
					// infinite loop. Therefore, we give a max height of 1000px.
					setTimeout(() => {
						this.refresh(() => {
							height = Math.min(1000, Math.max(100, data.height));
						});
					});
				}
			}
		};

		window.addEventListener("message", onmessage);
		this.cleanup(() => {
			window.removeEventListener("message", onmessage);
			if (inlineState.script) {
				inlineState.script.remove();
				inlineState.script = null;
			}
		});
	}

	let oldValue: string | undefined;
	let oldVisible: boolean | undefined;
	let hasExecuted = false;
	for ({value, visible = true, autoresize = false, initial} of this) {
		if (value !== oldValue || visible !== oldVisible) {
			loading = true;
			errorMessage = null;
			showErrorModal = !suppressErrors;
			if (typeof window !== "undefined") {
				if (oldValue === undefined) {
					// First render: execute inline in the page
					this.after(() => executeInline());
				} else {
					// Code changed: switch to iframe mode
					if (inlineMode) {
						inlineMode = false;
						if (inlineState.script) {
							inlineState.script.remove();
							inlineState.script = null;
						}
						// Clear content rendered by the inline script
						if (inlineState.container) {
							inlineState.container.innerHTML = "";
						}
						// Execute immediately on mode switch
						this.after(() => execute());
					} else {
						this.after(() => executeDebounced());
					}
					hasExecuted = true;
				}
			}
		}

		const pulsingClass = css`
			@keyframes pulse-bg {
				0%,
				100% {
					background-color: rgba(96, 165, 250, 0.2);
				}
				50% {
					background-color: var(--bg-color);
				}
			}
			animation: pulse-bg 1.5s ease-in-out infinite;
		`;

		if (inlineMode) {
			yield jsx`
				<div
					ref=${(el: HTMLElement) => {
						inlineState.container = el;
					}}
					class=${css`
						padding: 1em;
						width: 100%;
					`}
				>
					${initial ? jsx`
						<div contenteditable="true" spellcheck=${false} class="editable">
							${renderInitialLines(initial)}
						</div>
					` : null}
				</div>
			`;
		} else {
			yield jsx`
				<div class=${css`
					display: flex;
					flex-direction: column;
					height: 100%;
					position: relative;
				`}>
					<div class="${css`
						display: flex;
						flex-direction: column;
						flex: 1 1 auto;
						padding: 1em;
						width: 100%;
						position: relative;
					`} ${loading && hasExecuted ? pulsingClass : ""}">
						${
							errorMessage &&
							showErrorModal &&
							jsx`
								<div class=${css`
									position: absolute;
									inset: 0;
									background-color: rgba(0, 0, 0, 0.5);
									display: flex;
									align-items: center;
									justify-content: center;
									padding: 1em;
									z-index: 10;
								`}>
									<div class=${css`
										background-color: rgba(180, 60, 60, 0.95);
										border-radius: 8px;
										max-width: 90%;
										max-height: 80%;
										display: flex;
										flex-direction: column;
										box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
									`}>
										<div class=${css`
											display: flex;
											justify-content: space-between;
											align-items: center;
											padding: 0.75em 1em;
											border-bottom: 1px solid rgba(255, 255, 255, 0.2);
										`}>
											<span class=${css`
												color: white;
												font-weight: bold;
												font-size: 14px;
											`}>Error</span>
											<button
												onclick=${() => {
													this.refresh(() => {
														showErrorModal = false;
													});
												}}
												class=${css`
													background: none;
													border: none;
													color: white;
													font-size: 20px;
													cursor: pointer;
													padding: 0;
													line-height: 1;
													opacity: 0.8;
													&:hover {
														opacity: 1;
													}
												`}
											>×</button>
										</div>
										<pre class=${css`
											color: white;
											background-color: rgba(0, 0, 0, 0.2);
											padding: 1em;
											margin: 0;
											overflow: auto;
											font-size: 12px;
											flex: 1;
										`}>${errorMessage}</pre>
										<label class=${css`
											display: flex;
											align-items: center;
											gap: 0.5em;
											padding: 0.75em 1em;
											border-top: 1px solid rgba(255, 255, 255, 0.2);
											color: white;
											font-size: 12px;
											cursor: pointer;
										`}>
											<input
												type="checkbox"
												checked=${suppressErrors}
												onchange=${(ev: Event) => {
													suppressErrors = (ev.target as HTMLInputElement)
														.checked;
												}}
											/>
											Suppress this modal
										</label>
									</div>
								</div>
							`
						}
						<iframe
							key=${iframeID}
							ref=${(el: HTMLIFrameElement) => (iframe = el)}
							class="
								playground-iframe
								${css`
									flex: 1 1 auto;
									border: none;
									width: 100%;
									background-color: var(--bg-color);
								`}
							"
							style="min-height: ${autoresize ? `${height}px` : "auto"};"
						/>
					</div>
				</div>
			`;
		}

		oldValue = value;
		oldVisible = visible;
	}
}
