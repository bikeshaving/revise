import {createElement} from "@b9g/crank/crank.js";
import type {Children, Context} from "@b9g/crank/crank.js";
import type {ContentAreaElement} from "@b9g/revise/contentarea.js";
import type {Edit} from "@b9g/revise/edit.js";
import type {Keyer} from "@b9g/revise/keyer.js";
import type {EditableState} from "@b9g/revise/state.js";

export interface LinesProps {
	state: EditableState;
	/** Renders the contents of one line. */
	render(text: string, start: number): Children;
	/**
	 * Describes how a line renders apart from its text, such as its tokens.
	 * Visible lines whose signature changes are rendered again. Return
	 * undefined to keep a line's current rendering for now.
	 */
	signature?(text: string, start: number): unknown;
	/**
	 * Change this whenever lines may render differently without their text
	 * changing. Visible chunks are checked right away, and the rest when they
	 * scroll into view.
	 */
	revision?: unknown;
	chunkSize?: number;
}

interface Line {
	key: number;
	text: string;
	offset: number;
	dirty: boolean;
	signature: unknown;
}

interface Chunk {
	key: number;
	start: number;
	lines: Array<Line>;
	visible: boolean;
	stale: boolean;
	changed: boolean;
	refresh: (() => void) | null;
}

interface Model {
	props: LinesProps;
	state: EditableState | null;
	keyer: Keyer | null;
	value: string;
	edit: Edit | undefined;
	revision: unknown;
	chunkSize: number;
	chunks: Array<Chunk>;
	nextChunkKey: number;
}

const UNKNOWN = Symbol("unknown");

export function* Lines(this: Context<LinesProps>, props: LinesProps) {
	const model: Model = {
		props,
		state: null,
		keyer: null,
		value: "",
		edit: undefined,
		revision: undefined,
		chunkSize: 0,
		chunks: [],
		nextChunkKey: 0,
	};

	for (props of this) {
		model.props = props;
		sync(model);
		yield model.chunks.map((chunk, i) =>
			createElement(ChunkView, {
				key: chunk.key,
				chunk,
				model,
				copy: !chunk.changed && !(chunk.stale && isActive(model, i)),
			}),
		);
	}
}

function* ChunkView(
	this: Context,
	{chunk, model}: {chunk: Chunk; model: Model},
) {
	let area: ContentAreaElement | null = null;
	this.after((el: HTMLElement) => {
		area = el.closest("content-area") as ContentAreaElement | null;
	});

	this.addEventListener("contentvisibilityautostatechange", (ev: Event) => {
		chunk.visible = !(ev as Event & {skipped: boolean}).skipped;
		if (chunk.visible) {
			const i = model.chunks.indexOf(chunk);
			for (let j = Math.max(0, i - 1); j <= i + 1; j++) {
				const neighbor = model.chunks[j];
				if (neighbor && neighbor.stale && neighbor.refresh) {
					neighbor.refresh();
				}
			}
		}
	});

	chunk.refresh = () => {
		const focused = area !== null && area.contains(document.activeElement);
		const selection = focused ? area!.getSelectionRange() : null;
		this.refresh();
		if (area !== null) {
			area.source("render");
			if (selection !== null) {
				area.setSelectionRange(
					selection.start,
					selection.end,
					selection.direction,
				);
			}
		}
	};

	this.cleanup(() => {
		chunk.refresh = null;
	});

	for ({chunk, model} of this) {
		const {render, signature} = model.props;
		const recheck = chunk.stale && isActive(model, model.chunks.indexOf(chunk));
		let ready = true;
		const children = chunk.lines.map((line) => {
			const start = chunk.start + line.offset;
			let next: unknown = line.signature;
			if (recheck && signature) {
				next = signature(line.text, start);
				if (next === undefined) {
					ready = false;
					next = line.signature;
				}
			}

			const same = signature
				? line.signature !== UNKNOWN && next === line.signature
				: !recheck;
			if (!line.dirty && same) {
				return createElement("div", {key: line.key, copy: true});
			}

			line.dirty = false;
			line.signature = signature
				? next === UNKNOWN ? signature(line.text, start) ?? UNKNOWN : next
				: undefined;
			return createElement(
				"div",
				{key: line.key},
				line.text ? render(line.text, start) : createElement("br"),
			);
		});

		if (recheck && ready) {
			chunk.stale = false;
		}

		yield createElement(
			"div",
			{
				style:
					"content-visibility: auto; contain-intrinsic-size: auto " +
					`calc(${chunk.lines.length} * 1lh)`,
			},
			children,
		);
	}
}

function isActive(model: Model, i: number): boolean {
	const chunks = model.chunks;
	return (
		chunks[i].visible ||
		(i > 0 && chunks[i - 1].visible) ||
		(i + 1 < chunks.length && chunks[i + 1].visible)
	);
}

function sync(model: Model): void {
	const {state, revision, chunkSize = 250} = model.props;
	const value = state.value;
	const edit = (state as {edit?: Edit}).edit;
	for (const chunk of model.chunks) {
		chunk.changed = false;
	}

	if (
		state !== model.state ||
		state.keyer !== model.keyer ||
		chunkSize !== model.chunkSize
	) {
		model.state = state;
		model.keyer = state.keyer;
		model.chunkSize = chunkSize;
		rebuild(model, value);
	} else if (value !== model.value) {
		const change =
			(edit !== model.edit && edit && changeFromEdit(edit, value, model.value)) ||
			changeFromDiff(model.value, value);
		if (!apply(model, value, change)) {
			rebuild(model, value);
		}
	}

	model.value = value;
	model.edit = edit;
	if (!Object.is(revision, model.revision)) {
		model.revision = revision;
		for (const chunk of model.chunks) {
			chunk.stale = true;
		}
	}
}

interface Change {
	from: number;
	to: number;
	insert: string;
}

function changeFromEdit(
	edit: Edit,
	value: string,
	oldValue: string,
): Change | null {
	let from = -1;
	let to = -1;
	let oldLength = 0;
	for (const op of edit.operations()) {
		if (op.type === "insert") {
			from = from === -1 ? op.start : from;
			to = Math.max(to, op.start);
			continue;
		}

		oldLength = op.end;
		if (op.type === "delete") {
			from = from === -1 ? op.start : from;
			to = Math.max(to, op.end);
		}
	}

	if (from === -1 || oldLength !== oldValue.length) {
		return null;
	}

	return {from, to, insert: value.slice(from, to + value.length - oldLength)};
}

function changeFromDiff(oldValue: string, value: string): Change {
	const max = Math.min(oldValue.length, value.length);
	let prefix = 0;
	while (prefix < max && oldValue.charCodeAt(prefix) === value.charCodeAt(prefix)) {
		prefix++;
	}

	let suffix = 0;
	while (
		suffix < max - prefix &&
		oldValue.charCodeAt(oldValue.length - 1 - suffix) ===
			value.charCodeAt(value.length - 1 - suffix)
	) {
		suffix++;
	}

	return {
		from: prefix,
		to: oldValue.length - suffix,
		insert: value.slice(prefix, value.length - suffix),
	};
}

function createChunk(model: Model, lines: Array<Line>): Chunk {
	return {
		key: model.nextChunkKey++,
		start: 0,
		lines,
		visible: true,
		stale: false,
		changed: true,
		refresh: null,
	};
}

function createLines(keyer: Keyer, text: string, start: number): Array<Line> {
	const lines: Array<Line> = [];
	let cursor = start;
	for (const piece of text.split("\n")) {
		lines.push({
			key: keyer.keyAt(cursor),
			text: piece,
			offset: 0,
			dirty: true,
			signature: UNKNOWN,
		});
		cursor += piece.length + 1;
	}

	return lines;
}

function body(value: string): string {
	return value.endsWith("\n") ? value.slice(0, -1) : value;
}

function rebuild(model: Model, value: string): void {
	model.chunks = [];
	if (value) {
		const lines = createLines(model.keyer!, body(value), 0);
		for (let i = 0; i < lines.length; i += model.chunkSize) {
			model.chunks.push(
				createChunk(model, lines.slice(i, i + model.chunkSize)),
			);
		}
	}

	layout(model, 0);
}

function layout(model: Model, from: number): void {
	let start = 0;
	if (from > 0) {
		start = end(model.chunks[from - 1]) + 1;
	}

	for (let c = from; c < model.chunks.length; c++) {
		const chunk = model.chunks[c];
		chunk.start = start;
		if (chunk.changed) {
			let offset = 0;
			for (const line of chunk.lines) {
				line.offset = offset;
				offset += line.text.length + 1;
			}
		}

		start = end(chunk) + 1;
	}
}

function end(chunk: Chunk): number {
	const last = chunk.lines[chunk.lines.length - 1];
	return chunk.start + last.offset + last.text.length;
}

function find(model: Model, pos: number): [number, number] {
	const chunks = model.chunks;
	let lo = 0;
	let hi = chunks.length - 1;
	while (lo < hi) {
		const mid = (lo + hi + 1) >> 1;
		if (chunks[mid].start <= pos) {
			lo = mid;
		} else {
			hi = mid - 1;
		}
	}

	const lines = chunks[lo].lines;
	const rel = pos - chunks[lo].start;
	let a = 0;
	let b = lines.length - 1;
	while (a < b) {
		const mid = (a + b + 1) >> 1;
		if (lines[mid].offset <= rel) {
			a = mid;
		} else {
			b = mid - 1;
		}
	}

	return [lo, a];
}

function apply(model: Model, value: string, change: Change): boolean {
	const chunks = model.chunks;
	if (!chunks.length || !value) {
		return false;
	}

	const {from, to, insert} = change;
	const bodyEnd = end(chunks[chunks.length - 1]);
	const [ci, li] = find(model, Math.min(from, bodyEnd));
	const first = chunks[ci];
	const regionStart = first.start + first.lines[li].offset;
	let cj: number;
	let lj: number;
	let text: string;
	if (to > bodyEnd) {
		cj = chunks.length - 1;
		lj = chunks[cj].lines.length - 1;
		text = body(value).slice(regionStart);
	} else {
		[cj, lj] = find(model, to);
		const line = chunks[cj].lines[lj];
		const regionEnd = chunks[cj].start + line.offset + line.text.length;
		const delta = insert.length - (to - from);
		text = value.slice(regionStart, regionEnd + delta);
	}

	const lines = createLines(model.keyer!, text, regionStart);
	const rest = chunks[cj].lines.slice(lj + 1);
	if (cj !== ci) {
		for (const line of rest) {
			line.dirty = true;
		}
	}

	const merged = first.lines.slice(0, li).concat(lines, rest);
	const size =
		merged.length > model.chunkSize * 2
			? Math.ceil(merged.length / Math.floor(merged.length / model.chunkSize))
			: merged.length;
	const replacement = [first];
	first.lines = merged.slice(0, size);
	first.changed = true;
	for (let i = size; i < merged.length; i += size) {
		const moved = merged.slice(i, i + size);
		for (const line of moved) {
			line.dirty = true;
		}

		const chunk = createChunk(model, moved);
		chunk.visible = first.visible;
		replacement.push(chunk);
	}

	chunks.splice(ci, cj - ci + 1, ...replacement);
	layout(model, ci);
	return true;
}
