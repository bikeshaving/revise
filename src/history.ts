import {Edit} from "./edit";

// TODO: Figure out if these make sense as Edit methods.
function isNoop(edit: Edit): boolean {
	const operations = edit.operations();
	return operations.length === 1 && operations[0].type === "retain";
}

function isComplex(edit: Edit): boolean {
	let count = 0;
	for (const op of edit.operations()) {
		if (op.type !== "retain") {
			count++;
			if (count > 1) {
				return true;
			}
		}
	}

	return false;
}

export class EditHistory {
	current: Edit | undefined;
	undoStack: Array<Edit>;
	redoStack: Array<Edit>;

	constructor() {
		this.current = undefined;
		this.undoStack = [];
		this.redoStack = [];
	}

	checkpoint(): void {
		if (this.current) {
			this.undoStack.push(this.current);
			this.current = undefined;
		}
	}

	append(edit: Edit): void {
		if (isNoop(edit)) {
			return;
		} else if (this.redoStack.length) {
			this.redoStack.length = 0;
		}

		if (this.current) {
			const oldEdit = this.current;
			if (!isComplex(oldEdit) && !isComplex(edit)) {
				this.current = oldEdit.compose(edit);
				return;
			} else {
				this.checkpoint();
			}
		}

		this.current = edit;
	}

	canUndo(): boolean {
		return !!(this.current || this.undoStack.length);
	}

	undo(): Edit | undefined {
		this.checkpoint();
		const edit = this.undoStack.pop();
		if (edit) {
			this.redoStack.push(edit);
			return edit.invert();
		}
	}

	canRedo(): boolean {
		return !!this.redoStack.length;
	}

	redo(): Edit | undefined {
		this.checkpoint();
		const edit = this.redoStack.pop();
		if (edit) {
			this.undoStack.push(edit);
			return edit;
		}
	}
}
