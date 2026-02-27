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
				start = newIndex;
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
	value: string;
	history: EditHistory;
	keyer: Keyer;
	selection: SelectionRange | undefined;
	source: string | null;

	constructor(options?: {value?: string}) {
		super();
		this.value = options?.value ?? "";
		this.history = new EditHistory();
		this.keyer = new Keyer();
		this.selection = undefined;
		this.source = null;
	}

	applyEdit(edit: Edit, source?: string): void {
		edit = edit.normalize();
		this.value = edit.apply(this.value);
		this.keyer.transform(edit);
		if (source !== "history") {
			this.history.append(edit);
		}
		this.selection = selectionRangeFromEdit(edit);
		this.source = source ?? null;
		this.dispatchEvent(new Event("change"));
	}

	setValue(newValue: string, source?: string): void {
		const edit = Edit.diff(this.value, newValue);
		this.applyEdit(edit, source);
	}

	undo(): boolean {
		const edit = this.history.undo();
		if (!edit) return false;
		this.applyEdit(edit, "history");
		return true;
	}

	redo(): boolean {
		const edit = this.history.redo();
		if (!edit) return false;
		this.applyEdit(edit, "history");
		return true;
	}

	canUndo(): boolean {
		return this.history.canUndo();
	}

	canRedo(): boolean {
		return this.history.canRedo();
	}

	checkpoint(): void {
		this.history.checkpoint();
	}

	reset(value: string = ""): void {
		this.value = value;
		this.history = new EditHistory();
		this.keyer = new Keyer();
		this.selection = undefined;
		this.source = "reset";
		this.dispatchEvent(new Event("change"));
	}
}
