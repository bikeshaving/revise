import {createElement} from "@b9g/crank/crank.js";
import type {Context} from "@b9g/crank/crank.js";
import {renderer} from "@b9g/crank/dom.js";
import {ContentAreaElement} from "../src/contentarea.ts";
import {EditableState} from "../src/state.ts";
import {Editable, Lines} from "../packages/crankeditable/src/crank-editable.ts";

customElements.define("content-area", ContentAreaElement);

const params = new URLSearchParams(location.search);
const count = Number(params.get("lines") || 50000);
const words = ["const", "value", "=", "compute(", "label,", "[1,", "2]);"];
const value = Array.from(
	{length: count},
	(_, i) => (i % 9 === 8 ? "" : `${"  ".repeat(i % 3)}${words.join(" ")} // ${i}`) + "\n",
).join("");

const bench = {
	state: new EditableState({value}),
	theme: 0,
	inputAt: 0,
	lastRender: 0,
	refresh: () => {},
};
(window as any).bench = bench;
document.addEventListener("beforeinput", () => (bench.inputAt = performance.now()), true);

function render(text: string) {
	const parts = text.split(" ");
	return parts.map((part, i) => (
		<span class={"t" + ((i + bench.theme) % 4)}>{i ? " " + part : part}</span>
	));
}

function* App(this: Context) {
	bench.refresh = () => this.refresh();
	for ({} of this) {
		this.after(() => (bench.lastRender = performance.now()));
		yield (
			<Editable state={bench.state} onstatechange={() => this.refresh()}>
				<pre contenteditable="true" spellcheck="false">
					<Lines
						state={bench.state}
						revision={bench.theme}
						render={render}
						signature={() => bench.theme}
					/>
				</pre>
			</Editable>
		);
	}
}

const start = performance.now();
renderer.render(<App />, document.body);
(window as any).renderMs = performance.now() - start;
