import {suite} from "uvu";
import * as Assert from "uvu/assert";

import {Edit} from "../src/edit.js";
import {EditableState, selectionRangeFromEdit} from "../src/state.js";

/****************************************/
/*** selectionRangeFromEdit tests     ***/
/****************************************/
const selTest = suite("selectionRangeFromEdit");

selTest("no-op edit returns undefined", () => {
	const edit = new Edit([5]);
	Assert.is(selectionRangeFromEdit(edit), undefined);
});

selTest("retain-only edit returns undefined", () => {
	const edit = Edit.diff("hello", "hello");
	Assert.is(selectionRangeFromEdit(edit), undefined);
});

selTest("insertion", () => {
	const edit = Edit.diff("hello", "hello world");
	const sel = selectionRangeFromEdit(edit);
	Assert.equal(sel, {start: 5, end: 11, direction: "none"});
});

selTest("deletion", () => {
	const edit = Edit.diff("hello world", "hello");
	const sel = selectionRangeFromEdit(edit);
	Assert.equal(sel, {start: 5, end: 5, direction: "none"});
});

selTest("replacement", () => {
	const edit = Edit.diff("hello", "hi");
	const sel = selectionRangeFromEdit(edit);
	// retain(0,1), delete(1,5,"ello"), insert(1,"i")
	Assert.equal(sel, {start: 1, end: 2, direction: "none"});
});

selTest("insertion at start", () => {
	const edit = Edit.diff("hello", "XXhello");
	const sel = selectionRangeFromEdit(edit);
	Assert.equal(sel, {start: 0, end: 2, direction: "none"});
});

selTest("deletion at start", () => {
	const edit = Edit.diff("hello", "llo");
	const sel = selectionRangeFromEdit(edit);
	Assert.equal(sel, {start: 0, end: 0, direction: "none"});
});

selTest("edge: empty string insertion", () => {
	const edit = Edit.diff("", "hello");
	const sel = selectionRangeFromEdit(edit);
	Assert.equal(sel, {start: 0, end: 5, direction: "none"});
});

selTest("multi-region: insertion then deletion", () => {
	// "hello world" -> "XXhello" (insert "XX" at start, delete " world" at end)
	const edit = new Edit([0, "", "XX", 5, " world", "", 11]);
	const sel = selectionRangeFromEdit(edit);
	// start stays at first change (0), end at last change (5 in new text)
	Assert.equal(sel, {start: 0, end: 7, direction: "none"});
});

selTest("edge: delete everything", () => {
	const edit = Edit.diff("hello", "");
	const sel = selectionRangeFromEdit(edit);
	Assert.equal(sel, {start: 0, end: 0, direction: "none"});
});

selTest.run();

/****************************************/
/*** EditableState tests              ***/
/****************************************/
const stateTest = suite("EditableState");

stateTest("constructor defaults", () => {
	const state = new EditableState();
	Assert.is(state.value, "");
	Assert.is(state.source, null);
	Assert.is(state.selection, undefined);
	Assert.ok(!state.canUndo());
	Assert.ok(!state.canRedo());
});

stateTest("constructor with initial value", () => {
	const state = new EditableState({value: "hello"});
	Assert.is(state.value, "hello");
});

stateTest("applyEdit updates value", () => {
	const state = new EditableState({value: "hello"});
	const edit = Edit.diff("hello", "hello world");
	state.applyEdit(edit);
	Assert.is(state.value, "hello world");
});

stateTest("applyEdit transforms keyer", () => {
	const state = new EditableState({value: "hello"});
	const key0 = state.keyer.keyAt(0);
	const key4 = state.keyer.keyAt(4);

	// Insert "XX" at position 2
	const edit = Edit.builder("hello").retain(2).insert("XX").retain(3).build();
	state.applyEdit(edit);

	Assert.is(state.keyer.keyAt(0), key0);
	Assert.is(state.keyer.keyAt(6), key4); // key4 shifted from 4 to 6
});

stateTest("applyEdit appends to history", () => {
	const state = new EditableState({value: "hello"});
	const edit = Edit.diff("hello", "hello world");
	state.applyEdit(edit);
	Assert.ok(state.canUndo());
});

stateTest("applyEdit skips history for source 'history'", () => {
	const state = new EditableState({value: "hello"});
	const edit = Edit.diff("hello", "hello world");
	state.applyEdit(edit, "history");
	Assert.ok(!state.canUndo());
});

stateTest("applyEdit skips history with history: false", () => {
	const state = new EditableState({value: "hello"});
	const edit = Edit.diff("hello", "hello world");
	state.applyEdit(edit, {history: false});
	Assert.is(state.value, "hello world");
	Assert.ok(!state.canUndo());
});

stateTest("applyEdit with options object passes source", () => {
	const state = new EditableState({value: "hello"});
	const edit = Edit.diff("hello", "hello world");
	state.applyEdit(edit, {source: "remote", history: false});
	Assert.is(state.source, "remote");
	Assert.ok(!state.canUndo());
});

stateTest("applyEdit computes selection", () => {
	const state = new EditableState({value: "hello"});
	const edit = Edit.diff("hello", "hello world");
	state.applyEdit(edit);
	Assert.equal(state.selection, {start: 5, end: 11, direction: "none"});
});

stateTest("applyEdit sets source", () => {
	const state = new EditableState({value: "hello"});
	const edit = Edit.diff("hello", "hello world");
	state.applyEdit(edit, "user");
	Assert.is(state.source, "user");
});

stateTest("applyEdit source defaults to null", () => {
	const state = new EditableState({value: "hello"});
	state.applyEdit(Edit.diff("hello", "hello world"), "user");
	Assert.is(state.source, "user");
	state.applyEdit(Edit.diff("hello world", "hello world!"));
	Assert.is(state.source, null);
});

stateTest("setValue diffs and applies", () => {
	const state = new EditableState({value: "hello"});
	state.setValue("hello world");
	Assert.is(state.value, "hello world");
	Assert.ok(state.canUndo());
});

stateTest("setValue passes source", () => {
	const state = new EditableState({value: "hello"});
	state.setValue("hello world", "programmatic");
	Assert.is(state.source, "programmatic");
});

stateTest("undo reverses edit", () => {
	const state = new EditableState({value: "hello"});
	state.applyEdit(Edit.diff("hello", "hello world"));
	Assert.is(state.undo(), true);
	Assert.is(state.value, "hello");
});

stateTest("undo returns false when nothing to undo", () => {
	const state = new EditableState({value: "hello"});
	Assert.is(state.undo(), false);
});

stateTest("undo sets source to 'history'", () => {
	const state = new EditableState({value: "hello"});
	state.applyEdit(Edit.diff("hello", "hello world"));
	state.undo();
	Assert.is(state.source, "history");
});

stateTest("undo transforms keyer", () => {
	const state = new EditableState({value: "hello"});
	const key0 = state.keyer.keyAt(0);
	state.applyEdit(Edit.diff("hello", "hello world"));
	state.undo();
	Assert.is(state.keyer.keyAt(0), key0);
});

stateTest("undo computes selection from inverted edit", () => {
	const state = new EditableState({value: "hello"});
	state.applyEdit(Edit.diff("hello", "hello world"));
	state.undo();
	// Undo of insertion " world" is a deletion at position 5
	Assert.ok(state.selection != null);
	Assert.is(state.selection!.start, 5);
});

stateTest("redo re-applies edit", () => {
	const state = new EditableState({value: "hello"});
	state.applyEdit(Edit.diff("hello", "hello world"));
	state.undo();
	Assert.is(state.redo(), true);
	Assert.is(state.value, "hello world");
});

stateTest("redo returns false when nothing to redo", () => {
	const state = new EditableState({value: "hello"});
	Assert.is(state.redo(), false);
});

stateTest("redo sets source to 'history'", () => {
	const state = new EditableState({value: "hello"});
	state.applyEdit(Edit.diff("hello", "hello world"));
	state.undo();
	state.redo();
	Assert.is(state.source, "history");
});

stateTest("new edit clears redo stack", () => {
	const state = new EditableState({value: "hello"});
	state.applyEdit(Edit.diff("hello", "hello world"));
	state.undo();
	state.applyEdit(Edit.diff("hello", "hi"));
	Assert.is(state.canRedo(), false);
});

stateTest("multiple undo/redo with checkpoint", () => {
	const state = new EditableState({value: "hello"});
	state.applyEdit(Edit.diff("hello", "hello world"));
	state.checkpoint();
	state.applyEdit(Edit.diff("hello world", "hello world!"));

	// Two separate undo units
	state.undo();
	Assert.is(state.value, "hello world");
	state.undo();
	Assert.is(state.value, "hello");

	state.redo();
	Assert.is(state.value, "hello world");
	state.redo();
	Assert.is(state.value, "hello world!");
});

stateTest("without checkpoint, simple edits compose", () => {
	const state = new EditableState({value: "hello"});
	state.applyEdit(Edit.diff("hello", "hello world"));
	state.applyEdit(Edit.diff("hello world", "hello world!"));

	// Both edits composed into single undo unit
	state.undo();
	Assert.is(state.value, "hello");
});

stateTest("canUndo after apply", () => {
	const state = new EditableState({value: "hello"});
	Assert.is(state.canUndo(), false);
	state.applyEdit(Edit.diff("hello", "hello world"));
	Assert.is(state.canUndo(), true);
});

stateTest("canRedo after undo", () => {
	const state = new EditableState({value: "hello"});
	state.applyEdit(Edit.diff("hello", "hello world"));
	Assert.is(state.canRedo(), false);
	state.undo();
	Assert.is(state.canRedo(), true);
});

stateTest("reset clears everything", () => {
	const state = new EditableState({value: "hello"});
	state.applyEdit(Edit.diff("hello", "hello world"));
	state.reset("new");
	Assert.is(state.value, "new");
	Assert.is(state.canUndo(), false);
	Assert.is(state.canRedo(), false);
	Assert.is(state.selection, undefined);
	Assert.is(state.source, "reset");
});

stateTest("reset reinitializes keyer", () => {
	const state = new EditableState({value: "hello"});
	state.keyer.keyAt(0);
	state.keyer.keyAt(1);
	Assert.is(state.keyer.keys.size, 2);
	state.reset("new");
	Assert.is(state.keyer.keys.size, 0);
});

stateTest("reset defaults to empty string", () => {
	const state = new EditableState({value: "hello"});
	state.reset();
	Assert.is(state.value, "");
});

stateTest.run();
