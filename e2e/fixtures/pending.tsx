import {createElement} from "@b9g/crank/crank.js";
import type {Context} from "@b9g/crank/crank.js";
import {renderer} from "@b9g/crank/dom.js";
import {Editable, EditableState} from "../../packages/crankeditable/src/crank-editable.ts";

const COMPLETION = "Ada Lovelace <ada@example.com>, ";
const state = new EditableState({value: "Ad\n"});
(window as any).state = state;

function* App(this: Context) {
	for ({} of this) {
		yield (
			<Editable state={state} onstatechange={() => this.refresh()}>
				<div
					contenteditable="plaintext-only"
					spellcheck={false}
					onkeydown={(ev: KeyboardEvent) => {
						if (ev.key !== "Tab") return;
						ev.preventDefault();
						const line = state.value.split("\n")[0];
						if (COMPLETION.startsWith(line.trim())) {
							state.setValue(COMPLETION + "\n");
							this.refresh();
						}
					}}
				>
					<div>{state.value.split("\n")[0] || <br />}</div>
				</div>
			</Editable>
		);
	}
}

renderer.render(<App />, document.body);
