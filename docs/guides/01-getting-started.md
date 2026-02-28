---
title: Getting Started
description: Learn how to use Revise.js to build a rich text editor
---

## Installation

```bash
npm install @b9g/revise
```

## Register the Custom Element

Revise provides a `ContentAreaElement` custom element that wraps `contenteditable` and translates DOM mutations into `Edit` objects.

```js
import {ContentAreaElement} from "@b9g/revise/contentarea.js";

customElements.define("content-area", ContentAreaElement);
```

## Create State

`EditableState` ties together your document value, edit history, and keyer into a single object.

```js
import {EditableState} from "@b9g/revise/state.js";

const state = new EditableState({value: "Hello World!\n"});
```

## Listen for Changes

When the user types, the `<content-area>` element fires a `contentchange` event with an `Edit` describing the change. Call `preventDefault()` to revert the DOM, then apply the edit to your state and re-render.

```js
const area = document.querySelector("content-area");

area.addEventListener("contentchange", (ev) => {
  const {edit, source} = ev.detail;

  // Ignore changes from our own re-renders
  if (source === "render") return;

  // Capture the cursor position before reverting the DOM
  const selection = area.getSelectionRange();

  // Revert the DOM mutation — we'll re-render from state
  ev.preventDefault();

  // Apply the edit
  state.applyEdit(edit);

  // Re-render your UI from state.value...
  render();

  // Then tag the update and restore the cursor
  area.source("render");
  area.setSelectionRange(selection.start, selection.end, selection.direction);
});
```

## Render Keyed Lines

Use `state.keyer.keyAt(index)` to assign stable keys to each line. This lets your framework reconcile DOM nodes efficiently so the browser doesn't lose track of the cursor.

```js
function render() {
  const lines = state.value.split("\n");
  // Remove trailing empty string from final newline
  if (state.value.endsWith("\n")) lines.pop();

  let cursor = 0;
  const html = lines.map((line) => {
    const key = state.keyer.keyAt(cursor);
    cursor += line.length + 1;
    return `<div data-key="${key}">${line || "<br>"}</div>`;
  }).join("");

  area.querySelector("[contenteditable]").innerHTML = html;
}
```

## Undo/Redo

Undo and redo are built into `EditableState`. The history automatically groups consecutive simple edits together, breaking groups when the cursor moves or a complex edit occurs.

```js
state.undo();       // returns true if there was something to undo
state.redo();       // returns true if there was something to redo
state.checkpoint(); // explicitly break the current edit group
```

To integrate with the browser's native undo/redo, intercept `beforeinput` events:

```js
area.addEventListener("beforeinput", (ev) => {
  if (ev.inputType === "historyUndo") {
    ev.preventDefault();
    if (state.undo()) render();
  } else if (ev.inputType === "historyRedo") {
    ev.preventDefault();
    if (state.redo()) render();
  }
});
```

## Next Steps

- See the [live demos](/) for complete examples with syntax highlighting and social highlighting
- Read the [API reference](/guides/api) for the full EditableState, Edit, and ContentAreaElement APIs
- Check out [`@b9g/crank-editable`](https://github.com/bikeshaving/revise/tree/main/crank-editable) for a ready-made Crank.js integration
