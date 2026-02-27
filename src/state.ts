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

export class EditableState extends EventTarget {
	#value: string;
	#history: EditHistory;
	#keyer: Keyer;
	#selection: SelectionRange | undefined;
	#source: string | null;

	get value(): string { return this.#value; }
	get history(): EditHistory { return this.#history; }
	get keyer(): Keyer { return this.#keyer; }
	get selection(): SelectionRange | undefined { return this.#selection; }
	get source(): string | null { return this.#source; }

	constructor(options?: {value?: string}) {
		super();
		this.#value = options?.value ?? "";
		this.#history = new EditHistory();
		this.#keyer = new Keyer();
		this.#selection = undefined;
		this.#source = null;
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
		this.#value = edit.apply(this.#value);
		this.#keyer.transform(edit);
		if (recordHistory && source !== "history") {
			this.#history.append(edit);
		}
		this.#selection = selectionRangeFromEdit(edit);
		this.#source = source ?? null;
		this.dispatchEvent(new Event("change"));
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
		this.dispatchEvent(new Event("change"));
	}
}
