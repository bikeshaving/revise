import {Edit} from "./edit.js";
import {EditHistory} from "./history.js";
import {Keyer} from "./keyer.js";
import type {SelectionRange} from "./contentarea.js";

export type {SelectionRange};

export function selectionRangeFromEdit(edit: Edit): SelectionRange | undefined {
	const ops = edit.operations();
	let newIndex = 0;
	let start: number | undefined;
	let end: number | undefined;

	for (const op of ops) {
		switch (op.type) {
			case "retain":
				newIndex += op.end - op.start;
				break;
			case "delete":
				if (start === undefined) start = newIndex;
				end = newIndex;
				break;
			case "insert":
				if (start === undefined) start = newIndex;
				newIndex += op.value.length;
				end = newIndex;
				break;
		}
	}

	if (start === undefined) return undefined;

	return {start: start!, end: end!, direction: "none"};
}

function inputLength(edit: Edit): number {
	let length = 0;
	for (const op of edit.operations()) {
		if (op.type !== "insert") {
			length = op.end;
		}
	}

	return length;
}

export class EditableState {
	#value: string;
	#history: EditHistory;
	#keyer: Keyer;
	#selection: SelectionRange | undefined;
	#source: string | null;
	#edit: Edit | undefined;
	#version: number;

	get value(): string { return this.#value; }
	get history(): EditHistory { return this.#history; }
	get keyer(): Keyer { return this.#keyer; }
	get selection(): SelectionRange | undefined { return this.#selection; }
	get source(): string | null { return this.#source; }
	/** The most recently applied edit, or undefined after construction or reset. */
	get edit(): Edit | undefined { return this.#edit; }
	/** Increases by one with every applied edit and every reset. */
	get version(): number { return this.#version; }

	constructor(options?: {value?: string}) {
		this.#value = options?.value ?? "";
		this.#history = new EditHistory();
		this.#keyer = new Keyer();
		this.#selection = undefined;
		this.#source = null;
		this.#edit = undefined;
		this.#version = 0;
	}

	applyEdit(edit: Edit, options?: string | {source?: string; history?: boolean}): void {
		let source: string | undefined;
		let recordHistory = true;
		if (typeof options === "string") {
			source = options;
		} else if (options) {
			source = options.source;
			recordHistory = options.history ?? true;
		}

		edit = edit.normalize();
		const length = inputLength(edit);
		if (length !== this.#value.length) {
			throw new RangeError(
				`Edit expects a value of length ${length}, but the value has length ${this.#value.length}`,
			);
		}

		this.#value = edit.apply(this.#value);
		this.#keyer.transform(edit);
		if (recordHistory && source !== "history") {
			this.#history.append(edit);
		}
		this.#selection = selectionRangeFromEdit(edit);
		this.#source = source ?? null;
		this.#edit = edit;
		this.#version++;
	}

	setValue(newValue: string, options?: string | {source?: string; history?: boolean}): void {
		const edit = Edit.diff(this.#value, newValue);
		this.applyEdit(edit, options);
	}

	undo(): boolean {
		const edit = this.#history.undo();
		if (!edit) return false;
		this.applyEdit(edit, "history");
		return true;
	}

	redo(): boolean {
		const edit = this.#history.redo();
		if (!edit) return false;
		this.applyEdit(edit, "history");
		return true;
	}

	canUndo(): boolean {
		return this.#history.canUndo();
	}

	canRedo(): boolean {
		return this.#history.canRedo();
	}

	checkpoint(): void {
		this.#history.checkpoint();
	}

	reset(value: string = ""): void {
		this.#value = value;
		this.#history = new EditHistory();
		this.#keyer = new Keyer();
		this.#selection = undefined;
		this.#source = "reset";
		this.#edit = undefined;
		this.#version++;
	}
}
