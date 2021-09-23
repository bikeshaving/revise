import type {Context} from '@bikeshaving/crank/crank.js';
import {createElement} from '@bikeshaving/crank/crank.js';
import {renderer} from '@bikeshaving/crank/dom.js';
import {ContentArea} from '../components/contentarea.js';

const COLORS = [
	'#FF0000',
	'#FFA500',
	'#FFDC00',
	'#008000',
	'#0000FF',
	'#4B0082',
	'#800080',
];

function Rainbow(this: Context, {value}: {value: string}) {
	const keyer = this.consume('ContentAreaKeyer');
	let lines = value.split(/\r\n|\r|\n/);
	if (/\r\n|\r|\n$/.test(value)) {
		lines.pop();
	}

	let cursor = 0;
	// Testing different rendering strategies for lines.
	lines = lines.map((line) => {
		const key = keyer.keyAt(cursor);
		cursor += line.length + 1;
		return (
			<div crank-key={key} data-key={key}>
				{line ? (
					[...line].map((char, i) => (
						<span style={{color: COLORS[i % COLORS.length]}}>{char}</span>
					))
				) : (
					<br />
				)}
			</div>
		);
	});

	return (
		<div class="editable" contenteditable="true">
			{lines}
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
				<p class="">Using content-area to render a plaintext field.</p>
				<ContentArea value={value} renderSource="render">
					<Rainbow value={value} />
				</ContentArea>
			</div>
		);
	}
}

renderer.render(<App />, document.getElementById('root')!);
