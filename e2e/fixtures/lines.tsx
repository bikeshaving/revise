import {createElement} from "@b9g/crank/crank.js";
import type {Context} from "@b9g/crank/crank.js";
import {renderer} from "@b9g/crank/dom.js";
import {ContentAreaElement} from "../../src/contentarea.ts";
import {EditableState} from "../../src/state.ts";
import {
	Editable,
	EditableState as PublishedEditableState,
	Lines,
} from "../../packages/crankeditable/src/crank-editable.ts";

customElements.define("content-area", ContentAreaElement);

const params = new URLSearchParams(location.search);
const count = Number(params.get("lines") || 40);
const chunkSize = Number(params.get("chunk") || 10);
const value = Array.from({length: count}, (_, i) => `line ${i}\n`).join("");
const State =
	params.get("state") === "published" ? PublishedEditableState : EditableState;

const harness = {
	state: new State({value}),
	color: "a",
	revision: 0,
	renders: 0,
	refresh: () => {},
};
(window as any).harness = harness;

function* App(this: Context) {
	harness.refresh = () => this.refresh();
	for ({} of this) {
		yield (
			<Editable state={harness.state} onstatechange={() => this.refresh()}>
				<div
					contenteditable="true"
					spellcheck="false"
					style="font: 16px/20px monospace; outline: none; white-space: pre"
				>
					<Lines
						state={harness.state}
						chunkSize={chunkSize}
						revision={harness.revision}
						render={(text) => {
							harness.renders++;
							return <span class={harness.color}>{text}</span>;
						}}
						signature={() => harness.color}
					/>
				</div>
			</Editable>
		);
	}
}

renderer.render(<App />, document.body);
