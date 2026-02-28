---
title: API Reference
description: Complete API reference for Revise.js
---

## ContentAreaElement

A custom element (`<content-area>`) with an API modeled after [`HTMLTextAreaElement`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLTextAreaElement). Wraps a `contenteditable` element and translates DOM mutations into `Edit` objects.

```js
import {ContentAreaElement} from "@b9g/revise/contentarea.js";

customElements.define("content-area", ContentAreaElement);
```

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `value` | `string` | The text content of the element |
| `selectionStart` | `number` | The start index of the selection |
| `selectionEnd` | `number` | The end index of the selection |
| `selectionDirection` | `SelectionDirection` | The direction of the selection |

### Methods

- **`getSelectionRange(): SelectionRange`** — Returns `{start, end, direction}` for the current selection.

- **`setSelectionRange(start, end, direction?): void`** — Sets the selection within the content area.

- **`indexAt(node, offset): number`** — Converts a DOM position (node + offset) to a text index.

- **`nodeOffsetAt(index): [Node | null, number]`** — Converts a text index to a DOM position.

- **`source(name): boolean`** — Tags the next DOM mutation cycle so `contentchange` events include a `source` property. Call this before making DOM changes from your rendering code so you can distinguish render-triggered changes from user edits. Returns `true` if the content actually changed.

### Events

**`contentchange`** — Dispatched when the content changes. The event's `detail` contains:

```ts
{
  edit: Edit;              // The edit describing the change
  source: string | null;   // The source tag, or null for user edits
}
```

Call `event.preventDefault()` to revert the DOM mutation. This lets you apply the edit to your own state and re-render instead of letting the browser's mutation stand.

## Edit

A compact, composable data structure for representing changes to strings.

```js
import {Edit} from "@b9g/revise/edit.js";
```

### Instance Methods

- **`apply(text): string`** — Apply the edit to a string, returning the new string.

- **`invert(): Edit`** — Return the inverse edit. Applying the inverse undoes the original edit.

- **`compose(that): Edit`** — Compose two sequential edits into one. If edit A transforms text from state 1 to state 2, and edit B transforms from state 2 to state 3, then `A.compose(B)` transforms directly from state 1 to state 3.

- **`normalize(): Edit`** — Normalize the edit by removing no-op operations.

- **`operations(): Array<Operation>`** — Get the list of retain, insert, and delete operations.

- **`hasChangesBetween(start, end): boolean`** — Check whether the edit modifies text in the given range.

### Static Methods

- **`Edit.diff(text1, text2, hint?): Edit`** — Compute an edit that transforms `text1` into `text2`. The optional `hint` parameter is an index to improve diff performance.

- **`Edit.createBuilder(value): EditBuilder`** — Create a builder for constructing edits operation-by-operation.

### EditBuilder

Fluent builder for constructing edits:

```js
const edit = Edit.createBuilder("Hello World")
  .retain(5)
  .delete(6)
  .insert(" Revise")
  .build();

edit.apply("Hello World"); // "Hello Revise"
```

- **`insert(value): EditBuilder`**
- **`retain(length): EditBuilder`**
- **`delete(length): EditBuilder`**
- **`concat(edit): EditBuilder`**
- **`build(): Edit`**

## EditHistory

Undo/redo stack that automatically composes consecutive simple edits into groups.

```js
import {EditHistory} from "@b9g/revise/history.js";
```

- **`append(edit): void`** — Record an edit. Consecutive simple edits (single insert or delete) are composed together. Complex edits (multiple operations) trigger an automatic checkpoint.

- **`checkpoint(): void`** — Break the current edit group. Call this when the cursor moves without editing.

- **`undo(): Edit | undefined`** — Pop the undo stack and return the inverted edit. Returns `undefined` if there's nothing to undo.

- **`redo(): Edit | undefined`** — Pop the redo stack and return the edit. Returns `undefined` if there's nothing to redo.

- **`canUndo(): boolean`**

- **`canRedo(): boolean`**

## Keyer

Assigns stable integer keys to text positions and keeps them in sync as edits are applied.

```js
import {Keyer} from "@b9g/revise/keyer.js";
```

- **`keyAt(index): number`** — Get or create a stable key for the character at a given index. Returns the same key for the same position across renders, as long as `transform()` is called after each edit.

- **`transform(edit): void`** — Update all key positions after an edit. Must be called after every edit to keep keys in sync.

## EditableState

A framework-agnostic state coordinator that ties together value, keyer, history, and selection.

```js
import {EditableState} from "@b9g/revise/state.js";

const state = new EditableState({value: "initial text"});
```

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `value` | `string` | The current text |
| `keyer` | `Keyer` | The keyer for stable line keys |
| `history` | `EditHistory` | The undo/redo history |
| `selection` | `SelectionRange \| undefined` | Selection computed from the last edit |

### Methods

- **`applyEdit(edit, options?): void`** — Apply an edit, updating value, keyer, history, and selection. Options can be a source string or `{source?, history?}`.

- **`setValue(newValue, options?): void`** — Set a new value by computing a diff against the current value.

- **`undo(): boolean`** — Undo the last edit group. Returns `true` if successful.

- **`redo(): boolean`** — Redo the last undone edit group. Returns `true` if successful.

- **`canUndo(): boolean`**

- **`canRedo(): boolean`**

- **`checkpoint(): void`** — Break the current edit group.

- **`reset(value?): void`** — Reset all state (value, history, keyer, selection).
