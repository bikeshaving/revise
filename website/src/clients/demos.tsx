import {createElement} from "@b9g/crank/crank.js";
import type {Context} from "@b9g/crank/crank.js";
import {renderer} from "@b9g/crank/dom.js";
import {Editable, EditableState} from "@b9g/crankeditable";

function* EditableTitle(
	this: Context<typeof EditableTitle>,
	{initial}: {initial: string},
) {
	const state = new EditableState({value: initial});
	for ({} of this) {
		const lines = state.value.split(/\r\n|\r|\n/);
		if (/(?:\r\n|\r|\n)$/.test(state.value)) {
			lines.pop();
		}

		let cursor = 0;
		yield (
			<Editable state={state} onstatechange={() => this.refresh()}>
				<h1
					contenteditable="true"
					spellcheck={false}
					style={{
						fontSize: "max(40px, 8vw)",
						color: "var(--highlight-color)",
						margin: "0",
						outline: "none",
					}}
				>
					{lines.map((line) => {
						const key = state.keyer.keyAt(cursor);
						cursor += line.length + 1;
						return (
							<div key={key}>
								{line || <br />}
							</div>
						);
					})}
				</h1>
			</Editable>
		);
	}
}

function* EditableTagline(
	this: Context<typeof EditableTagline>,
	{initial}: {initial: string},
) {
	const state = new EditableState({value: initial});
	for ({} of this) {
		const lines = state.value.split(/\r\n|\r|\n/);
		if (/(?:\r\n|\r|\n)$/.test(state.value)) {
			lines.pop();
		}

		let cursor = 0;
		yield (
			<Editable state={state} onstatechange={() => this.refresh()}>
				<p
					contenteditable="true"
					spellcheck={false}
					style={{
						fontSize: "1.25rem",
						color: "var(--text-muted)",
						margin: "0.5em 0 0",
						outline: "none",
					}}
				>
					{lines.map((line) => {
						const key = state.keyer.keyAt(cursor);
						cursor += line.length + 1;
						return (
							<div key={key}>
								{line || <br />}
							</div>
						);
					})}
				</p>
			</Editable>
		);
	}
}

const titleEl = document.getElementById("hero-title");
if (titleEl) {
	titleEl.innerHTML = "";
	renderer.render(
		<EditableTitle initial={titleEl.dataset.initial || "\n"} />,
		titleEl,
	);
}

const taglineEl = document.getElementById("hero-tagline");
if (taglineEl) {
	taglineEl.innerHTML = "";
	renderer.render(
		<EditableTagline initial={taglineEl.dataset.initial || "\n"} />,
		taglineEl,
	);
}
