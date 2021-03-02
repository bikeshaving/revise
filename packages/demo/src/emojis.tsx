import type {Child, Context} from '@bikeshaving/crank/crank.js';
import {createElement} from '@bikeshaving/crank/crank.js';
import {renderer} from '@bikeshaving/crank/dom.js';
import twemoji from 'twemoji';
import {ContentAreaElement} from '@bikeshaving/revise/contentarea.js';
import type {ContentEvent} from '@bikeshaving/revise/contentarea.js';
import {Keyer} from '@bikeshaving/revise/keyer.js';
import './index.css';

// TODO: Pass in old lines?
function parse(content: string, keyer: Keyer): Array<Child> {
	const lines = content.split(/\r\n|\r|\n/);
	if (/\r\n|\r|\n$/.test(content)) {
		lines.pop();
	}

	let cursor = 0;
	return lines.map((line) => {
		const line1 = twemoji.parse(line, {
			attributes(emoji) {
				return {'data-content': emoji};
			},
		});
		const key = keyer.keyOf(cursor);
		cursor += line.length + 1;
		return line ? (
			<div crank-key={key} innerHTML={line1} />
		) : (
			<div crank-key={key}>
				<br />
			</div>
		);
	});
}

function* Editable(this: Context) {
	let content = '\n';
	let el: any;
	const keyer = new Keyer(content.length);
	this.addEventListener('contentchange', (ev) => {
		const content1 = (ev.target as ContentAreaElement).value;
		if (content === content1) {
			return;
		}

		content = content1;
		keyer.push(ev.detail.patch);
		// For some reason, pasting rendered emojis causes some odd effects on
		// Safari when done synchronously.
		requestAnimationFrame(() => el.repair(() => this.refresh()));
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
			<p>
				Using content-area to render emojis with{' '}
				<a href="https://twemoji.twitter.com">Twemoji.</a>
			</p>
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
