# @b9g/crankeditable

A [Crank.js](https://crank.js.org) component that bridges
[`@b9g/revise`](https://github.com/bikeshaving/revise) to the DOM. It handles
contenteditable event wiring, undo/redo, selection preservation, and cursor
scrolling so your component only needs to render lines from state.

```
npm install @b9g/crankeditable @b9g/crank @b9g/revise
```

## Usage

```jsx
import {renderer} from "@b9g/crank/dom";
import {EditableState} from "@b9g/revise/state.js";
import {CrankEditable} from "@b9g/crankeditable";

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
update and restores the selection. After an edit, undo, or redo, it also
scrolls the cursor into view. Other renders leave the scroll position alone.

## Props

| Prop | Type | Description |
|------|------|-------------|
| `state` | `EditableState` | The state object to read/write. Caller-owned. |
| `children` | `Children` | The rendered content (keyed lines, syntax-highlighted tokens, etc.) |

## Events

| Event | Bubbles | Description |
|-------|---------|-------------|
| `statechange` | Yes | Dispatched after every edit, undo, or redo. Listen with `onstatechange` on the component element to trigger a parent re-render. |

## Large documents

`Lines` renders a value as lines inside stable chunks. Each chunk uses
`content-visibility: auto`, so the browser skips layout and paint for chunks
that are off screen, while every line stays in the DOM for find in page,
selection, copy, and screen readers. On each edit, only the lines the edit
touched are rendered again.

```jsx
import {Editable, EditableState, Lines} from "@b9g/crankeditable";

function* CodeEditor() {
  const state = new EditableState({value: source});
  const tokenizer = createTokenizer(source);

  for ({} of this) {
    tokenizer.update(state.value);
    yield (
      <Editable state={state} onstatechange={() => this.refresh()}>
        <pre contenteditable="plaintext-only" spellcheck="false">
          <Lines
            state={state}
            revision={tokenizer.tree}
            render={(text, start) => highlight(text, tokenizer.tokens(start, start + text.length))}
            signature={(text, start) => describe(tokenizer.tokens(start, start + text.length))}
          />
        </pre>
      </Editable>
    );
  }
}
```

| Prop | Type | Description |
|------|------|-------------|
| `state` | `EditableState` | The state to render. The value must be empty or end with a newline. |
| `render` | `(text, start) => Children` | Renders the contents of one non-empty line. `start` is the line's index in the value. Empty lines render a `<br>`. |
| `signature` | `(text, start) => unknown` | Optional. Describes how a line renders apart from its text, such as its tokens. Return `undefined` to keep a line's current rendering for now. |
| `revision` | `unknown` | Optional. Change it whenever lines may render differently without their text changing, such as after the syntax tree changes. |
| `chunkSize` | `number` | Optional. Lines per chunk. Defaults to 250. |

When `revision` changes, chunks on screen and their neighbors check each
line's signature right away and render the lines whose signature changed.
Other chunks wait until they scroll into view. Their text is always current;
only their decoration can be out of date while nobody can see it.

`Lines` reads `state.edit` (revise 0.1.8 and later) to find which lines
changed. With older versions it diffs the old and new value instead. Render
after every state change, as in the example above, so no edit is skipped.

Use `contenteditable="plaintext-only"`: with `contenteditable="true"`,
Safari turns a space before a line break into a non-breaking space.
