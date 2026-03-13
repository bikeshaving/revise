import {createElement} from "@b9g/crank/crank.js";
import type {Context} from "@b9g/crank/crank.js";
import {renderer} from "@b9g/crank/dom.js";
import {Editable, EditableState} from "@b9g/crankeditable";

function getLineAt(val: string, pos: number) {
	const start = val.lastIndexOf("\n", pos - 1) + 1;
	const end = val.indexOf("\n", pos);
	return {start, end: end === -1 ? val.length : end};
}

function* TodoEditable(this: Context) {
	const state = new EditableState({
		value: `- [x] Build content-area
- [x] Build Edit data structure
- [ ] Write documentation
- [ ] Take over the world
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
						const match = line.match(/^(- \[[ x]\] )/);
						if (!match) return;
						if (ev.key === "Enter") {
							ev.preventDefault();
							if (line === match[1]) {
								state.setValue(
									val.slice(0, start) +
										val.slice(start + match[1].length),
									"user",
								);
							} else {
								state.setValue(
									val.slice(0, pos) +
										"\n- [ ] " +
										val.slice(pos),
									"user",
								);
								this.refresh();
								area.setSelectionRange(pos + 7, pos + 7);
								return;
							}
						} else if (
							ev.key === "Backspace" &&
							pos === start + match[1].length
						) {
							ev.preventDefault();
							state.setValue(
								val.slice(0, Math.max(0, start - 1)) +
									val.slice(start + match[1].length),
								"user",
							);
						} else {
							return;
						}
						this.refresh();
					}}
				>
					{lines.map((line) => {
						const lineStart = cursor;
						const key = state.keyer.keyAt(cursor);
						cursor += line.length + 1;
						const match = line.match(/^(- \[[ x]\] )([\s\S]*)$/);
						if (match) {
							const prefix = match[1];
							const checked = prefix === "- [x] ";
							return (
								<div key={key} data-contentbefore={prefix}>
									<input
										type="checkbox"
										checked={checked}
										data-content=""
										contenteditable="false"
										onclick={() => {
											const newPrefix = checked
												? "- [ ] "
												: "- [x] ";
											state.setValue(
												state.value.slice(
													0,
													lineStart,
												) +
													newPrefix +
													state.value.slice(
														lineStart +
															prefix.length,
													),
												"user",
											);
											this.refresh();
										}}
									/>
									<span
										style={
											checked
												? {
														textDecoration:
															"line-through",
														opacity: "0.5",
													}
												: undefined
										}
									>
										{match[2] || <br />}
									</span>
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

renderer.render(<TodoEditable />, document.body);
