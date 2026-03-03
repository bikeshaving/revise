// Polyfill DOM globals for SSR environment (Bun worker).
// @b9g/revise/contentarea.js defines ContentAreaElement which extends
// HTMLElement. This class definition runs at module load time, so we need
// HTMLElement to exist even though it's never instantiated during SSR.
if (typeof HTMLElement === "undefined") {
	(globalThis as any).HTMLElement = class {};
}
