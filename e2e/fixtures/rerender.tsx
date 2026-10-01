import {createElement} from "@b9g/crank/crank.js";
import type {Context} from "@b9g/crank/crank.js";
import {renderer} from "@b9g/crank/dom.js";
import {Editable, EditableState} from "@b9g/crankeditable";

const state = new EditableState({value: "\n"});

function* App(this: Context) {
	let tick = 0;
	(window as any).rerender = () => {
		tick++;
		this.refresh();
	};
	for ({} of this) {
		const lines = state.value.split("\n");
		if (lines[lines.length - 1] === "") lines.pop();
		let cursor = 0;
		yield (
			<div>
				<p id="tick">tick {tick}</p>
				<Editable state={state} onstatechange={() => this.refresh()}>
					<div contenteditable="true" spellcheck={false}>
						{lines.map((line) => {
							const key = state.keyer.keyAt(cursor);
							cursor += line.length + 1;
							return <div key={key}>{line || <br />}</div>;
						})}
					</div>
				</Editable>
				<input id="other" />
			</div>
		);
	}
}

renderer.render(<App />, document.body);
