import {createElement} from "@b9g/crank/crank.js";
import type {Context} from "@b9g/crank/crank.js";
import {renderer} from "@b9g/crank/dom.js";
import {Editable, EditableState} from "@b9g/crankeditable";

function getLineAt(val: string, pos: number) {
	const start = val.lastIndexOf("\n", pos - 1) + 1;
	const end = val.indexOf("\n", pos);
	return {start, end: end === -1 ? val.length : end};
}

function* BlockquoteEditable(this: Context) {
	const state = new EditableState({
		value: `> To be or not to be,
> that is the question.
Hamlet, Act 3, Scene 1
`,
	});
	for (const {} of this) {
		const lines = state.value.split("\n");
		if (lines[lines.length - 1] === "") lines.pop();
		let cursor = 0;
		yield (
			<Editable state={state} onstatechange={() => this.refresh()}>
				<div
					contenteditable="true"
					spellcheck={false}
					onkeydown={(ev: KeyboardEvent) => {
						if (ev.shiftKey || ev.ctrlKey || ev.metaKey) return;
						const area = (ev.currentTarget as HTMLElement).closest(
							"content-area",
						) as any;
						const pos = area.selectionStart;
						if (pos !== area.selectionEnd) return;
						const val = state.value;
						const {start, end} = getLineAt(val, pos);
						const line = val.slice(start, end);
						if (!/^> /.test(line)) return;
						if (ev.key === "Enter") {
							ev.preventDefault();
							if (line === "> ") {
								state.setValue(
									val.slice(0, start) + val.slice(start + 2),
									"user",
								);
							} else {
								state.setValue(
									val.slice(0, pos) +
										"\n> " +
										val.slice(pos),
									"user",
								);
								this.refresh();
								area.setSelectionRange(pos + 3, pos + 3);
								return;
							}
						} else if (ev.key === "Backspace") {
							if (line === "> ") {
								ev.preventDefault();
								state.setValue(
									val.slice(0, start) +
										val.slice(start + 2),
									"user",
								);
							} else if (pos === start + 2) {
								ev.preventDefault();
								state.setValue(
									val.slice(0, Math.max(0, start - 1)) +
										val.slice(start + 2),
									"user",
								);
							} else {
								return;
							}
						} else {
							return;
						}
						this.refresh();
					}}
				>
					{lines.map((line) => {
						const key = state.keyer.keyAt(cursor);
						cursor += line.length + 1;
						const match = line.match(/^(> )([\s\S]*)$/);
						if (match) {
							return (
								<div
									key={key}
									data-contentbefore="> "
									style={{
										borderLeft: "3px solid currentColor",
										paddingLeft: "0.5em",
										opacity: 0.7,
									}}
								>
									{match[2] || <br />}
								</div>
							);
						}
						return (
							<div key={key}>{line || <br />}</div>
						);
					})}
				</div>
			</Editable>
		);
	}
}

renderer.render(<BlockquoteEditable />, document.body);
