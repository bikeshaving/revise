import {Edit} from "./edit.js";
import {EditHistory} from "./history.js";
import {Keyer} from "./keyer.js";

export interface SelectionRange {
	selectionStart: number;
	selectionEnd: number;
	selectionDirection: "forward" | "backward" | "none";
}

export interface EditableStateOptions {
	initialValue?: string;
	onEdit?: (state: EditContext) => EditResult;
}

export interface EditContext {
	value: string;
	edit: Edit;
	selection?: SelectionRange;
	source: string;
}

export interface EditResult {
	value: string;
	selection?: SelectionRange;
}

/**
 * EditableState is a stateful coordinator that manages all editing concerns
 * through a unified callback pipeline.
 *
 * Features:
 * - Unified edit transformation callback
 * - Built-in history management (undo/redo)
 * - Automatic keying for stable rendering
 * - Selection state tracking
 * - Source tracking to prevent infinite loops
 */
export class EditableState extends EventTarget {
	value: string;
	history: EditHistory;
	keyer: Keyer;
	selection: SelectionRange | undefined;

	private onEdit: ((state: EditContext) => EditResult) | undefined;
	private _source: string | undefined;

	constructor(options: EditableStateOptions = {}) {
		super();
		this.value = options.initialValue || "";
		this.history = new EditHistory();
		this.keyer = new Keyer();
		this.selection = undefined;
		this.onEdit = options.onEdit;
		this._source = undefined;
	}

	/**
	 * Get the current source tracking value.
	 * Used internally to distinguish between user edits and programmatic changes.
	 */
	get source(): string | undefined {
		return this._source;
	}

	/**
	 * Apply an edit to the state.
	 * This is the main entry point for all state changes.
	 */
	applyEdit(edit: Edit, source: string = "edit"): void {
		// Store old values for the callback
		const oldValue = this.value;

		// Apply the edit
		const newValue = edit.apply(oldValue);

		// Calculate selection from edit
		const selection = selectionRangeFromEdit(edit);

		// Set source for tracking
		this._source = source;

		// Call the transformation callback if provided
		let result: EditResult = {value: newValue, selection};
		if (this.onEdit) {
			result = this.onEdit({
				value: oldValue,
				edit,
				selection,
				source,
			});
		}

		// Update state
		this.value = result.value;
		this.selection = result.selection;

		// Transform keyer unless this is from history/special sources
		if (source !== "history" && source !== "newline") {
			this.keyer.transform(edit);
		}

		// Update history unless this is from history
		if (source !== "history" && source !== null) {
			this.history.append(edit.normalize());
		}

		// Clear source after synchronous updates
		Promise.resolve().then(() => {
			this._source = undefined;
		});

		// Emit change event
		this.dispatchEvent(new Event("change"));
	}

	/**
	 * Set the value programmatically.
	 * This will create a diff edit and apply it.
	 */
	setValue(newValue: string, source: string = "set"): void {
		if (newValue === this.value) {
			return;
		}

		const edit = Edit.diff(this.value, newValue);
		this.applyEdit(edit, source);
	}

	/**
	 * Undo the last edit.
	 */
	undo(): boolean {
		const edit = this.history.undo();
		if (edit) {
			this.value = edit.apply(this.value);
			this.selection = selectionRangeFromEdit(edit);
			this.keyer.transform(edit);
			this._source = "history";

			Promise.resolve().then(() => {
				this._source = undefined;
			});

			this.dispatchEvent(new Event("change"));
			return true;
		}
		return false;
	}

	/**
	 * Redo the last undone edit.
	 */
	redo(): boolean {
		const edit = this.history.redo();
		if (edit) {
			this.value = edit.apply(this.value);
			this.selection = selectionRangeFromEdit(edit);
			this.keyer.transform(edit);
			this._source = "history";

			Promise.resolve().then(() => {
				this._source = undefined;
			});

			this.dispatchEvent(new Event("change"));
			return true;
		}
		return false;
	}

	/**
	 * Check if undo is available.
	 */
	canUndo(): boolean {
		return this.history.canUndo();
	}

	/**
	 * Check if redo is available.
	 */
	canRedo(): boolean {
		return this.history.canRedo();
	}

	/**
	 * Create a checkpoint in the edit history.
	 * Useful for grouping edits or breaking edit sequences.
	 */
	checkpoint(): void {
		this.history.checkpoint();
	}

	/**
	 * Reset the state to a new value, optionally preserving history.
	 */
	reset(newValue: string, preserveHistory: boolean = false): void {
		this.value = newValue;
		this.selection = undefined;
		this._source = "reset";

		if (!preserveHistory) {
			this.history = new EditHistory();
			this.keyer = new Keyer();
		}

		Promise.resolve().then(() => {
			this._source = undefined;
		});

		this.dispatchEvent(new Event("change"));
	}
}

/**
 * Helper function to calculate selection range from an edit.
 */
function selectionRangeFromEdit(edit: Edit): SelectionRange | undefined {
	let index = 0;
	let start: number | undefined;
	let end: number | undefined;

	for (const op of edit.operations()) {
		switch (op.type) {
			case "delete": {
				if (start === undefined) {
					start = index;
				}
				break;
			}

			case "insert": {
				if (start === undefined) {
					start = index;
				}
				index += op.value.length;
				end = index;
				break;
			}

			case "retain": {
				index += op.end - op.start;
				break;
			}
		}
	}

	if (start !== undefined && end !== undefined) {
		return {
			selectionStart: start,
			selectionEnd: end,
			selectionDirection: "forward",
		};
	} else if (start !== undefined) {
		return {
			selectionStart: start,
			selectionEnd: start,
			selectionDirection: "none",
		};
	}

	return undefined;
}
