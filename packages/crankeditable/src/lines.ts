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
	version: number;
	revision: unknown;
	chunkSize: number;
	chunks: Array<Chunk>;
	nextChunkKey: number;
}

const UNKNOWN = Symbol("unknown");
const COPY = Symbol("copy");
const PLAIN = Symbol("plain");
const OBSERVABLE =
	typeof HTMLElement !== "undefined" &&
	"oncontentvisibilityautostatechange" in HTMLElement.prototype;

export function* Lines(this: Context<LinesProps>, props: LinesProps) {
	const model: Model = {
		props,
		state: null,
		keyer: null,
		value: "",
		version: -1,
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
	let root: HTMLElement | null = null;
	let generation = 0;
	let mounted = false;

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
		const current = document.getSelection();
		const inside =
			area !== null &&
			root !== null &&
			current !== null &&
			(root.contains(current.anchorNode) || root.contains(current.focusNode));
		const selection = inside ? area!.getSelectionRange() : null;
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
		const active = isActive(model, model.chunks.indexOf(chunk));
		const recheck = active && chunk.stale;
		let ready = active;
		const plan: Array<unknown> = [];
		let decorations = 0;
		for (const line of chunk.lines) {
			let action: unknown = COPY;
			if (!active) {
				if (line.dirty) {
					action = PLAIN;
				}
			} else {
				const plain = line.signature === PLAIN;
				if (line.dirty || plain || recheck) {
					if (!signature) {
						action = UNKNOWN;
					} else {
						const next = signature(line.text, chunk.start + line.offset);
						if (next === undefined) {
							ready = false;
							if (line.dirty) {
								action = UNKNOWN;
							}
						} else if (line.dirty || plain || next !== line.signature) {
							action = next;
						}
					}
				}
			}

			plan.push(action);
			if (action !== COPY && action !== PLAIN && line.signature === PLAIN) {
				decorations++;
			}
		}

		const fresh = mounted && decorations > chunk.lines.length / 4;
		if (fresh) {
			generation++;
		}

		const children = chunk.lines.map((line, i) => {
			let action = plan[i];
			if (fresh && action === COPY) {
				action = !active || line.signature === PLAIN ? PLAIN : line.signature;
			}

			if (action === COPY) {
				return createElement("div", {key: line.key, copy: true});
			}

			line.dirty = false;
			line.signature = action;
			if (action === PLAIN) {
				return createElement(
					"div",
					{key: line.key},
					line.text || createElement("br"),
				);
			}

			return createElement(
				"div",
				{key: line.key},
				line.text
					? render(line.text, chunk.start + line.offset)
					: createElement("br"),
			);
		});

		mounted = true;
		chunk.stale = !ready;
		this.after((el: HTMLElement) => {
			root = el;
			area = el.closest("content-area") as ContentAreaElement | null;
		});
		yield createElement(
			"div",
			{
				key: generation,
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
	const {edit, version} = state as {edit?: Edit; version?: number};
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
			edit && version === model.version + 1
				? changeFromEdit(edit, value, model.value)
				: null;
		if (!apply(model, value, change || changeFromDiff(model.value, value))) {
			rebuild(model, value);
		} else if (!change) {
			rekey(model);
		}
	} else if (version !== undefined && version !== model.version) {
		rekey(model);
	}

	model.value = value;
	model.version = version ?? -1;
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

function rekey(model: Model): void {
	const keyer = model.keyer!;
	for (const chunk of model.chunks) {
		for (const line of chunk.lines) {
			const key = keyer.keyAt(chunk.start + line.offset);
			if (key !== line.key) {
				line.key = key;
				line.dirty = true;
				chunk.changed = true;
			}
		}
	}
}

function createChunk(model: Model, lines: Array<Line>): Chunk {
	return {
		key: model.nextChunkKey++,
		start: 0,
		lines,
		visible: !OBSERVABLE,
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
			const chunk = createChunk(model, lines.slice(i, i + model.chunkSize));
			chunk.visible ||= i < model.chunkSize * 2;
			model.chunks.push(chunk);
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
	let text: string | null;
	if (to > bodyEnd) {
		cj = chunks.length - 1;
		lj = chunks[cj].lines.length - 1;
		const tail = value.slice(regionStart);
		text = tail ? body(tail) : null;
	} else {
		[cj, lj] = find(model, to);
		const line = chunks[cj].lines[lj];
		const regionEnd = chunks[cj].start + line.offset + line.text.length;
		const delta = insert.length - (to - from);
		text = value.slice(regionStart, regionEnd + delta);
	}

	const lines = text === null ? [] : createLines(model.keyer!, text, regionStart);
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
	const replacement = merged.length ? [first] : [];
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
	let changedFrom = ci;
	if (
		replacement.length === 1 &&
		first.lines.length < model.chunkSize / 2 &&
		chunks.length > 1
	) {
		const next = ci + 1 < chunks.length;
		const neighbor = chunks[next ? ci + 1 : ci - 1];
		if (neighbor.lines.length + first.lines.length <= model.chunkSize * 2) {
			const [target, source] = next ? [first, neighbor] : [neighbor, first];
			for (const line of source.lines) {
				line.dirty = true;
			}

			target.lines = target.lines.concat(source.lines);
			target.changed = true;
			target.visible = target.visible || source.visible;
			chunks.splice(chunks.indexOf(source), 1);
			changedFrom = Math.min(ci, chunks.indexOf(target));
		}
	}

	layout(model, changedFrom);
	return true;
}
