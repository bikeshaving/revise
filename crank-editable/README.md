# @b9g/crank-editable

A [Crank.js](https://crank.js.org) component that bridges
[`@b9g/revise`](https://github.com/bikeshaving/revise) to the DOM. It handles
contenteditable event wiring, undo/redo, selection preservation, and cursor
scrolling so your component only needs to render lines from state.

```
npm install @b9g/crank-editable @b9g/crank @b9g/revise
```

## Usage

```jsx
import {renderer} from "@b9g/crank/dom";
import {ContentAreaElement} from "@b9g/revise/contentarea.js";
import {EditableState} from "@b9g/revise/state.js";
import {CrankEditable} from "@b9g/crank-editable";

customElements.define("content-area", ContentAreaElement);

function* MyEditor() {
  const state = new EditableState({value: "Hello World!\n"});

  for ({} of this) {
    const lines = state.value.split("\n");
    if (state.value.endsWith("\n")) lines.pop();

    let cursor = 0;
    yield (
      <CrankEditable state={state} onstatechange={() => this.refresh()}>
        <div contenteditable="true">
          {lines.map((line) => {
            const key = state.keyer.keyAt(cursor);
            cursor += line.length + 1;
            return <div key={key}>{line || <br />}</div>;
          })}
        </div>
      </CrankEditable>
    );
  }
}

renderer.render(<MyEditor />, document.getElementById("app"));
```

## How it works

`CrankEditable` renders a `<content-area>` element (from `@b9g/revise`)
wrapping your children. It listens for:

- **`contentchange`** — Captures the browser selection, calls
  `preventDefault()` to revert the DOM mutation, applies the edit to
  `EditableState`, and dispatches a `statechange` event so the parent can
  re-render.

- **`beforeinput`** (`historyUndo`/`historyRedo`) and **`keydown`**
  (Cmd/Ctrl+Z, Cmd/Ctrl+Shift+Z, Ctrl+Y) — Intercepts undo/redo and
  delegates to `state.undo()`/`state.redo()`.

- **`selectionchange`** — Calls `state.checkpoint()` when the cursor moves
  without editing, so undo groups break at natural boundaries.

After each render it calls `contentArea.source("render")` to tag the DOM
update, restores the selection, and scrolls the cursor into view.

## Props

| Prop | Type | Description |
|------|------|-------------|
| `state` | `EditableState` | The state object to read/write. Caller-owned. |
| `children` | `Children` | The rendered content (keyed lines, syntax-highlighted tokens, etc.) |

## Events

| Event | Bubbles | Description |
|-------|---------|-------------|
| `statechange` | Yes | Dispatched after every edit, undo, or redo. Listen with `onstatechange` on the component element to trigger a parent re-render. |
