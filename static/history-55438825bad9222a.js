// ../dist/src/history.js
function isNoop(edit) {
  const operations = edit.operations();
  return operations.length === 1 && operations[0].type === "retain";
}
function isComplex(edit) {
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
var EditHistory = class {
  current;
  undoStack;
  redoStack;
  constructor() {
    this.current = void 0;
    this.undoStack = [];
    this.redoStack = [];
  }
  checkpoint() {
    if (this.current) {
      this.undoStack.push(this.current);
      this.current = void 0;
    }
  }
  append(edit) {
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
  canUndo() {
    return !!(this.current || this.undoStack.length);
  }
  undo() {
    this.checkpoint();
    const edit = this.undoStack.pop();
    if (edit) {
      this.redoStack.push(edit);
      return edit.invert();
    }
  }
  canRedo() {
    return !!this.redoStack.length;
  }
  redo() {
    this.checkpoint();
    const edit = this.redoStack.pop();
    if (edit) {
      this.undoStack.push(edit);
      return edit;
    }
  }
};
export {
  EditHistory
};
