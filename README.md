# Revise.js

Revise is a JavaScript library for building rich-text editors on top of
[`contenteditable`](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/contenteditable).
It provides low-level primitives — a custom element, an edit data structure,
a keyed reconciler, and a state coordinator — so that any framework can build
editing experiences without fighting the DOM.

```
npm install @b9g/revise
```

## Status

Early beta. The API is stabilizing but may still change. Recommended for
developers who aren’t afraid of stepping through DOM code in a debugger.

## Quick Start

Register the custom element, create an `EditableState`, and render keyed lines
inside a `<content-area>`:

```js
import {ContentAreaElement} from "@b9g/revise/contentarea.js";
import {EditableState} from "@b9g/revise/state.js";

customElements.define("content-area", ContentAreaElement);

const state = new EditableState({value: "Hello World!\n"});
```

When `<content-area>` detects a user edit, it fires a `contentchange` event
with an `Edit` object describing the change. Prevent the default DOM mutation,
apply the edit to state, then re-render:

```js
area.addEventListener("contentchange", (ev) => {
  const {edit, source} = ev.detail;
  if (source === "render") return; // ignore our own re-renders

  const selection = area.getSelectionRange();
  ev.preventDefault();
  state.applyEdit(edit);
  // Re-render your UI from state.value, then restore selection
});
```

After re-rendering, mark the DOM update so the next `contentchange` is tagged
as a render (not a user edit), and restore the cursor:

```js
area.source("render");
area.setSelectionRange(sel.start, sel.end, sel.direction);
```

Use `state.keyer.keyAt(index)` to get stable keys for each line so your
framework can reconcile DOM nodes efficiently:

```js
const lines = state.value.split("\n");
let cursor = 0;
for (const line of lines) {
  const key = state.keyer.keyAt(cursor);
  cursor += line.length + 1;
  // render <div key={key}>{line || <br/>}</div>
}
```

Undo/redo is built in:

```js
state.undo(); // returns true if there was something to undo
state.redo();
state.checkpoint(); // break the current edit group (e.g. on cursor move)
```

See the [live demos](https://bikeshaving.github.io/revise/) for complete
examples with syntax highlighting, rainbow text, and social highlighting.

## Modules

### `@b9g/revise/contentarea.js`

**`ContentAreaElement`** — A custom element (`<content-area>`) with an API
modeled after
[`HTMLTextAreaElement`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLTextAreaElement).
Wraps a `contenteditable` element and translates DOM mutations into `Edit`
objects.

- `value: string` — The text content of the element.
- `selectionStart: number`
- `selectionEnd: number`
- `selectionDirection: SelectionDirection`
- `getSelectionRange(): SelectionRange`
- `setSelectionRange(start, end, direction?): void`
- `indexAt(node, offset): number` — Convert a DOM position to a text index.
- `nodeOffsetAt(index): [Node | null, number]` — Convert a text index to a DOM position.
- `source(name): boolean` — Tag the next DOM mutation cycle so `contentchange` events include a `source` property. Returns `true` if content changed.

**`ContentEvent`** — The event dispatched on `contentchange`. `event.detail`
contains `{edit: Edit, source: string | null}`. Call `event.preventDefault()`
to revert the DOM mutation and apply the edit to your own state instead.

### `@b9g/revise/edit.js`

**`Edit`** — A compact, composable data structure for representing changes to
strings.

- `apply(text): string` — Apply the edit to a string.
- `invert(): Edit` — Return the inverse edit (for undo).
- `compose(that): Edit` — Compose two sequential edits into one.
- `normalize(): Edit` — Normalize the edit (remove no-ops).
- `operations(): Array<Operation>` — Get the list of retain/insert/delete operations.
- `hasChangesBetween(start, end): boolean`
- `Edit.diff(text1, text2, hint?): Edit` — Compute an edit from two strings.
- `Edit.createBuilder(value): EditBuilder` — Create a builder for constructing edits operation-by-operation.

**`EditBuilder`** — Fluent builder for constructing edits:
`insert(value)`, `retain(length)`, `delete(length)`, `concat(edit)`, `build()`.

### `@b9g/revise/history.js`

**`EditHistory`** — Undo/redo stack that automatically composes consecutive
simple edits into groups.

- `append(edit): void` — Record an edit. Consecutive simple edits are composed; complex edits (multiple operations) trigger a checkpoint.
- `checkpoint(): void` — Break the current edit group.
- `undo(): Edit | undefined` — Pop the undo stack and return the inverted edit.
- `redo(): Edit | undefined` — Pop the redo stack and return the edit.
- `canUndo(): boolean`
- `canRedo(): boolean`

### `@b9g/revise/keyer.js`

**`Keyer`** — Assigns stable integer keys to text positions and keeps them in
sync as edits are applied. Use `keyAt(index)` to get a stable key for the
character at a given index, then call `transform(edit)` after each edit to
update all key positions.

- `keyAt(index): number` — Get or create a stable key for a text position.
- `transform(edit): void` — Update all key positions after an edit.

### `@b9g/revise/state.js`

**`EditableState`** — A framework-agnostic state coordinator that ties
together value, keyer, history, and selection.

- `value: string` — The current text.
- `keyer: Keyer` — The keyer for stable line keys.
- `history: EditHistory` — The undo/redo history.
- `selection: SelectionRange | undefined` — Selection computed from the last edit.
- `applyEdit(edit, options?): void` — Apply an edit, updating value/keyer/history/selection.
- `setValue(newValue, options?): void` — Set a new value by diffing against the current value.
- `undo(): boolean` — Undo the last edit group.
- `redo(): boolean` — Redo the last undone edit group.
- `canUndo(): boolean`
- `canRedo(): boolean`
- `checkpoint(): void` — Break the current edit group.
- `reset(value?): void` — Reset all state.
