import type {Child, Context} from '@bikeshaving/crank/crank.js';
import {createElement} from '@bikeshaving/crank/crank.js';
import {renderer} from '@bikeshaving/crank/dom.js';
import {ContentAreaElement} from '@bikeshaving/revise/contentarea.js';
import type {ContentEvent} from '@bikeshaving/revise/contentarea.js';
import {Keyer} from '@bikeshaving/revise/keyer.js';
import {EditHistory} from '@bikeshaving/revise/history.js';

function parse(content: string, keyer: Keyer): Array<Child> {
	//return content;
	const lines = content.split(/\r\n|\r|\n/);
	if (/\r\n|\r|\n$/.test(content)) {
		lines.pop();
	}

	let cursor = 0;
	// Testing different rendering strategies for lines.
	return lines.map((line) => {
		const key = keyer.keyAt(cursor);
		cursor += line.length + 1;
		// THIS IS THE MOST WELL BEHAVED WAY TO DIVIDE LINES
		return (
			<div crank-key={key}>
				{line || <br />}
			</div>
		);

		//return (
		//	<div crank-key={key}>
		//		{line ? [...line].map((char) => <span>{char}</span>) : <br />}
		//	</div>
		//);

		//return (
		//	<div crank-key={key}>{line || "\n"}</div>
		//);

		//return (
		//	<div crank-key={key}>{line}<br /></div>
		//);

		//return <Fragment crank-key={key}>{line}<br /></Fragment>;

		//return (
		//	<Fragment crank-key={key}>
		//		{!!line && <span>{line}</span>}
		//		<br />
		//	</Fragment>
		//);

		//return (
		//	<Fragment crank-key={key}>
		//		{!!line && Array.from(line).map((char) => <span>{char}</span>)}
		//		<br />
		//	</Fragment>
		//);
	});
}

function* Editable(this: Context) {
	let content = '\n';
	let contentArea: ContentAreaElement;
	const keyer = new Keyer();
	const history = new EditHistory();
	let historyInitiated = false;
	this.addEventListener('contentchange', (ev) => {
		content = contentArea.value;
		keyer.transform(ev.detail.edit);
		if (!historyInitiated) {
			history.append(ev.detail.edit);
		}

		const {selectionStart, selectionEnd, selectionDirection} = contentArea;
		const p = this.refresh();
		if (typeof p.then !== 'undefined') {
			throw new Error('Editable children must be synchronous');
		}

		contentArea.setSelectionRange(
			selectionStart,
			selectionEnd,
			selectionDirection,
		);
	});

	// TODO: bring back the old logic where we checkpoint history based on when the cursor moves + time.
	setInterval(() => {
		history.checkpoint();
	}, 5000);

	// TODO: add a validate function
	this.addEventListener('beforeinput', (ev: any) => {
		// TODO: set selection to the selection before the edit
		if (ev.inputType === 'historyUndo') {
			const edit = history.undo();
			if (edit) {
				historyInitiated = true;
				ev.preventDefault();
				content = edit.apply(content);
				this.refresh();
				contentArea.value;
				historyInitiated = false;
			}
		} else if (ev.inputType === 'historyRedo') {
			const edit = history.redo();
			if (edit) {
				historyInitiated = true;
				ev.preventDefault();
				content = edit.apply(content);
				this.refresh();
				contentArea.value;
				historyInitiated = false;
			}
		}
	});

	let composing = false;
	this.addEventListener('compositionstart', () => {
		composing = true;
	});

	this.addEventListener('compositionend', () => {
		composing = false;
	});

	for ({} of this) {
		yield (
			<content-area
				crank-ref={(el: ContentAreaElement) => (contentArea = el)}
				crank-static={composing}
			>
				<div class="editable" contenteditable="true">
					{parse(content, keyer)}
				</div>
			</content-area>
		);
	}
}

function App() {
	return (
		<div class="app">
			<p class="">Using content-area to render a plaintext field.</p>
			<Editable />
		</div>
	);
}

declare global {
	module Crank {
		interface EventMap {
			contentchange: ContentEvent;
		}
	}
}

window.customElements.define('content-area', ContentAreaElement);
renderer.render(<App />, document.getElementById('root')!);
