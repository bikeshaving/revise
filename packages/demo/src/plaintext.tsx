import type {Child, Children, Context} from '@bikeshaving/crank/crank.js';
import {Copy, createElement, Fragment, Raw} from '@bikeshaving/crank/crank.js';
import {renderer} from '@bikeshaving/crank/dom.js';
import type {Patch, Cursor} from '@bikeshaving/revise/patch.js';
import {ContentAreaElement} from '@bikeshaving/revise/contentarea.js';
import type {ContentEvent} from "@bikeshaving/revise/contentarea.js";
import {Keyer} from "@bikeshaving/revise/keyer.js";
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
		// THIS IS THE MOST WELL BEHAVED WAY TO DIVIDE LINES
		return (
			<div crank-key={key}>{line || <br />}</div>
		);

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


function* Editable(this: Context, { children }: any) {
	let content = "\n";
	let el: any;
	const keyer = new Keyer(content.length);
	this.addEventListener("contentchange", (ev) => {
		content = (ev.target as ContentAreaElement).value;
		keyer.push(ev.detail.patch);
		el.repair(() => this.refresh());
	});

	this.addEventListener("contentundo", (ev) => {
		content = (ev.target as ContentAreaElement).value;
		keyer.push(ev.detail.patch);
		this.refresh();
	});

	this.addEventListener("contentredo", (ev) => {
		content = (ev.target as ContentAreaElement).value;
		keyer.push(ev.detail.patch);
		this.refresh();
	});

	for ({} of this) {
		yield (
			<content-area
				undomode="keydown"
				crank-ref={(el1: Node) => (el = el1)}
			>
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
			<p class="">Using content-area to render a plaintext field.</p>
			<Editable />
		</div>
	);
}

declare global {
	module Crank {
		interface EventMap {
			"contentchange": ContentEvent;
			"contentundo": ContentEvent;
			"contentredo": ContentEvent;
		}
	}
}

window.customElements.define("content-area", ContentAreaElement);
renderer.render(<App />, document.getElementById('root')!);
