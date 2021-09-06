import type {Child, Context} from '@bikeshaving/crank/crank.js';
import {createElement} from '@bikeshaving/crank/crank.js';
import {Fragment} from '@bikeshaving/crank/crank.js';
import {renderer} from '@bikeshaving/crank/dom.js';
import {ContentAreaElement} from '@bikeshaving/revise/contentarea.js';
import type {ContentEvent} from '@bikeshaving/revise/contentarea.js';
import {Keyer} from '@bikeshaving/revise/keyer.js';
import './index.css';

const colors = [
	'#FF0000',
	'#FFA500',
	'#FFDC00',
	'#008000',
	'#0000FF',
	'#4B0082',
	'#800080',
];

// TODO: Pass in old lines?
function parse(content: string, keyer: Keyer): Array<Child> {
	//return content;
	const lines = content.split(/\r\n|\r|\n/);
	if (/\r\n|\r|\n$/.test(content)) {
		lines.pop();
	}

	let cursor = 0;
	// Testing different rendering strategies for lines.
	return lines.map((line) => {
		const key = keyer.keyOf(cursor);
		cursor += line.length + 1;
		return (
			<Fragment crank-key={key}>
				{!!line &&
					Array.from(line).map((char, i) => (
						<span style={{color: colors[i % colors.length]}}>{char}</span>
					))}
				<br />
			</Fragment>
		);
	});
}

function* Editable(this: Context) {
	let content = '\n';
	let el: any;
	const keyer = new Keyer(content.length);
	this.addEventListener('contentchange', (ev) => {
		content = (ev.target as ContentAreaElement).value;
		keyer.push(ev.detail.patch);
		this.refresh();
		//el.repair(() => this.refresh());
	});

	this.addEventListener('contentundo', (ev) => {
		content = (ev.target as ContentAreaElement).value;
		keyer.push(ev.detail.patch);
		this.refresh();
	});

	this.addEventListener('contentredo', (ev) => {
		content = (ev.target as ContentAreaElement).value;
		keyer.push(ev.detail.patch);
		this.refresh();
	});

	let html = '';
	let area: any;
	let cursor: any = -1;

	document.addEventListener('selectionchange', () => {
		const selection = window.getSelection();
		if (!selection) {
			cursor = -1;
		} else if (selection.isCollapsed) {
			cursor = area.indexAt(selection.focusNode, selection.focusOffset);
		} else {
			cursor = [
				area.indexAt(selection.anchorNode, selection.anchorOffset),
				area.indexAt(selection.focusNode, selection.focusOffset),
			];
		}
		this.refresh();
	});

	this.flush(() => {
		content = area.value;
		this.refresh();
	});

	for ({} of this) {
		this.schedule(([area1]) => {
			area = area1;
			const html1 = area.firstChild!.innerHTML;
			if (html !== html1) {
				html = html1;
				this.refresh();
			}
		});
		yield (
			<Fragment>
				<content-area crank-ref={(el1: Node) => (el = el1)}>
					<div contenteditable="true" crank-static>
						<div>Hello</div>
						<div>World</div>
					</div>
				</content-area>
				<br />
				<br />
				<br />
				<br />
				<div>
					<div>
						HTML:
						<pre>{html}</pre>
					</div>
					<hr />
					<div>
						Content:
						<pre>{content}</pre>
					</div>
					<hr />
					<div>
						Cursor:
						<pre>{JSON.stringify(cursor)}</pre>
					</div>
				</div>
			</Fragment>
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
