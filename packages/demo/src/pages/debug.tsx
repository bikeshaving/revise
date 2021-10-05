import {createElement, Fragment} from '@bikeshaving/crank/crank.js';
import type {Context} from '@bikeshaving/crank/crank.js';
import {renderer} from '@bikeshaving/crank/dom.js';
import {ContentAreaElement} from '@bikeshaving/revise/contentarea.js';
import type {
	ContentEvent,
	SelectionRange,
} from '@bikeshaving/revise/contentarea.js';

function* Debugger(this: Context) {
	let content = '\n';
	let html = '';
	let area: any;
	let selectionRange: SelectionRange = {
		selectionStart: 0,
		selectionEnd: 0,
		selectionDirection: 'none',
	};
	let operations: undefined | Array<any>;

	this.flush(() => {
		content = area.value;
		this.refresh();
	});

	this.addEventListener('contentchange', (ev) => {
		content = (ev.target as ContentAreaElement).value;
		const edit = ev.detail.edit;
		operations = edit.operations;
		this.refresh();
	});

	document.addEventListener('selectionchange', () => {
		selectionRange = {
			selectionStart: area.selectionStart,
			selectionEnd: area.selectionEnd,
			selectionDirection: area.selectionDirection,
		};
		this.refresh();
	});

	for ({} of this) {
		this.schedule(() => {
			const html1 = area.firstChild!.innerHTML;
			if (html !== html1) {
				html = html1;
				this.refresh();
			}
		});

		yield (
			<Fragment>
				<h1>😤 Debugger 😤</h1>
				<content-area c-ref={(ref: any) => (area = ref)}>
					<div class="editable" contenteditable="true" c-static={true}>
						<div>Hello</div>
						<div>World</div>
					</div>
				</content-area>
				<br />
				<div>
					<div>
						<h3>HTML:</h3>
						<pre>{html}</pre>
						<hr />
					</div>
					<div>
						<h3>Content:</h3>
						<pre>{JSON.stringify(content)}</pre>
						<hr />
					</div>
					<div>
						<h3>Selection:</h3>
						<div>Start: {selectionRange?.selectionStart}</div>
						<div>End: {selectionRange?.selectionEnd}</div>
						<div>Direction: {selectionRange?.selectionDirection}</div>
						<hr />
					</div>
					<div>
						<h3>Patch operations:</h3>
						{operations && <pre>{JSON.stringify(operations, null, 2)}</pre>}
						<hr />
					</div>
				</div>
			</Fragment>
		);
	}
}

function App() {
	return (
		<div class="app">
			<Debugger />
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
