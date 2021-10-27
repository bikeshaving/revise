import {createElement} from '@b9g/crank/crank.js';
import type {Context} from '@b9g/crank/crank.js';
import {renderer} from '@b9g/crank/dom.js';
import twemoji from 'twemoji';

import {ContentArea} from '../components/contentarea';

function Twemoji(this: Context, {value}: {value: string}) {
	const keyer = this.consume('ContentAreaKeyer');
	const lines = value.split(/\r\n|\r|\n/);
	if (/\r\n|\r|\n$/.test(value)) {
		lines.pop();
	}

	let cursor = 0;
	return (
		<div class="editable" contenteditable="true">
			{lines.map((line) => {
				const line1 = twemoji.parse(line, {
					attributes(emoji) {
						return {'data-content': emoji};
					},
				});
				const key = keyer.keyAt(cursor);
				cursor += line.length + 1;
				return line ? (
					<div crank-key={key} innerHTML={line1} />
				) : (
					<div crank-key={key}>
						<br />
					</div>
				);
			})}
		</div>
	);
}

function* App(this: Context<{}>) {
	let value = '\n';
	this.addEventListener('contentchange', (ev: any) => {
		if (ev.detail.source === 'render') {
			return;
		}

		value = ev.target.value;
		this.refresh();
	});

	for ({} of this) {
		yield (
			<div class="app">
				<p>Using content-area to render Twemojis.</p>
				<ContentArea value={value} renderSource="render">
					<Twemoji value={value} />
				</ContentArea>
			</div>
		);
	}
}

renderer.render(<App />, document.getElementById('root')!);
