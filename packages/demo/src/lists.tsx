import type {Child, Context} from '@bikeshaving/crank/crank.js';
import {createElement} from '@bikeshaving/crank/crank.js';
import {renderer} from '@bikeshaving/crank/dom.js';
import {ContentAreaElement} from '@bikeshaving/revise/contentarea.js';
import type {ContentEvent} from '@bikeshaving/revise/contentarea.js';
import {Keyer} from '@bikeshaving/revise/keyer.js';
import './index.css';

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
		return <div crank-key={key}>{line || <br />}</div>;
	});
}

function* Editable(this: Context) {
	let content = '\n';
	let el: any;
	const keyer = new Keyer(content.length);
	this.addEventListener('contentchange', (ev) => {
		content = (ev.target as ContentAreaElement).value;
		keyer.push(ev.detail.patch);
		el.repair(() => this.refresh());
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

	for ({} of this) {
		yield (
			<content-area undomode="keydown" crank-ref={(el1: Node) => (el = el1)}>
				<div
					crank-ref={(el1: Node) => (el = el1)}
					class="editable"
					contenteditable="true"
				>
					{parse(content, keyer)}
				</div>
			</content-area>
		);
	}
}

function App() {
	return (
		<div class="app">
			<p>Using content-area to render lists.</p>
			<Editable />
		</div>
	);
}

declare global {
	module Crank {
		interface EventMap {
			contentchange: ContentEvent;
			contentundo: ContentEvent;
			contentredo: ContentEvent;
		}
	}
}

window.customElements.define('content-area', ContentAreaElement);
renderer.render(<App />, document.getElementById('root')!);
