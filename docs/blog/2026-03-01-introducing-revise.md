---
title: Introducing Revise.js
description: Revise.js is a JavaScript library for building rich text editors using low-level foundations that work with contenteditable instead of against it.
publish: true
author: Brian Kim
authorURL: https://github.com/brainkim
publishDate: 2027-03-17
---

## The state of rich-text editing

Imagine it’s the late 2010s and you’re a human programmer working for a small startup. One day, an ambitious product manager comes to you with a feature request: See this input or textarea? Can we make it so that when the user types in a URL, it turns into a link automatically? Or can we let users @-mention each other, and have that highlighted? Or can we mark text over a certain character limit with a red background?

To the product manager, these may sound like natural extensions to the behavior of inputs and textareas. To you, the developer, it reads as ignorance. Sure, you could overlay a div on top of the form to style the text, but this is fragile and hacky. You could use rich-text editing libraries like the epic works of Dutch programmer [Marijn Haverbeke](https://marijnhaverbeke.nl), who almost singlehandedly made the web editable with his “Mirror” libraries [ProseMirror](https://prosemirror.net) and [CodeMirror](https://codemirror.net). But these are heavyweight solutions for what should be minor modifications to form behavior.

If you’re pragmatic, what you typically don’t consider as a possibility is using `contenteditable`, an HTML attribute which turns any element into a freeform text editing surface. The libraries I’ve mentioned exist because working with `contenteditable` is notoriously difficult and frankly, not your problem to solve. You may have read the essay [Why ContentEditable is Terrible](https://medium.engineering/why-contenteditable-is-terrible-122d8a40e480), written by an engineer at Medium. If programmers at Medium, a firm dedicated to writing and publishing, find working with `contenteditable` so difficult, wouldn’t it be unwise to try for yourself?

Cut to 2026. The situation has not measurably improved. New libraries have popped up, old ones have received updates, and browsers have even attempted to provide alternatives to `contenteditable` like [`EditContext`](https://developer.mozilla.org/en-US/docs/Web/API/EditContext_API). But there’s still the same old chasm between form elements like `<input>` and `<textarea>` and anything more than plaintext representations of them.

Revise.js is an attempt to bridge the gap. It’s not a full-fledged editor with toolbars; rather, it’s the missing standard library for `contenteditable`. It provides a small set of building blocks for working with `contenteditable` directly: a custom element that watches the DOM for changes and translates them into stringwise operations, a data structure for describing edits to text, and a [Crank.js](https://crank.js.org) integration which allows you to write declarative editable components. The following is a description of each of these parts.

## The `<content-area>` element

The first problem you might encounter when working with `contenteditable` is how to represent the underlying document. Editing libraries can be cleanly divided into two main camps: code editors like CodeMirror, where the document is a string, and rich-text editors like ProseMirror, where the document is a tree of nodes, usually represented as JSON. Revise.js chooses to use the code editor approach, where the document is just a string for simplicity.

This is because while trees give you structure, they also bring their own problems. For instance, where is the cursor? In a string, the cursor is just an index into the string. In a tree, you need paths or traversal algorithms to determine where you are. Another difficulty is that tree structures require bespoke serialization and deserialization schemes. When users want to export their document, they want markdown or plaintext. Exporting your bespoke JSON tree would read as vendor lock-in. With strings, the document is already in a ready-made format for saving and exporting.

<figure>
<img src="/static/prosemirror-indexing.png" alt="ProseMirror's token-based indexing scheme">
<figcaption>How ProseMirror counts positions: tokens in a tree, not characters in a string.</figcaption>
</figure>

Unfortunately, the difficulty with the string approach is that there is no DOM API to help you. For instance, the `textContent` property is a merely a concatenation of all the text nodes in a document; it does not include line breaks. The `innerHTML` property gives you the actual HTML markup, which is obviously not what we want either. The `innerText` property is probably the closest approximation, it’s described as what would be copied if you selected the element and copied its contents. However, its behavior is inconsistent across browsers, unconfigurable, and hard-codes weird conventions like adding extra newlines for `<p>` elements.

In the course of developing this library, I realized that the browser was lacking an analogue to something like `<textarea>`’s `.value`, a clean string that reflects the editable content. The `<content-area>` custom element provides exactly this:

```html
<content-area>
  <div contenteditable="true">
    <p>Hello</p>
    <p>World</p>
  </div>
</content-area>
```

```js
const area = document.querySelector("content-area");
area.value;          // "Hello\nworld\n"
area.selectionStart; // cursor position as an index into value
```

The API deliberately mirrors `<textarea>`, and provides expected properties like `.value`, `.selectionStart`, `.selectionEnd`, and `.selectionDirection`. The difference is that the contents can be anything: paragraphs, links, images, styled spans. Logically, this implies that the `.value` property is read-only: the DOM is the source of truth, not the string, and if you want to change the `.value` of a content-area you just update the DOM.

It is hard to overstate what an engineering marvel the `<content-area>` element is. Consider that a string like `"Hello\nWorld\n"` can be represented by nearly infinite DOM structures:

- `<p>Hello</p><p>World</p>`
- `<div>Hello<br>World</div>`
- `<div>Hello<div>World</div></div>`

To read the DOM into a string, the content-area element walks its children and tracks `<br>` and block-like elements to determine where newlines should be placed. In essence, it’s a mini-layout algorithm which painstakingly identifies where line-breaks would go in the final rendered text. It also converts the DOM selection, which is determined by node/offset pairs, into integers which reflect the position in the final string.

This would be expensive to do on every keystroke, so the `<content-area>` element uses a `MutationObserver` under the hood to watch and selectively validate subtrees. Rather than re-reading the entire DOM, it only rereads the parts that were actually mutated. And because the content-area element watches for mutations rather than intercepting input events, every input method works for free: spellcheck, IME, dictation, browser extensions. This approach is fail-safe: editor libraries which rely on events like `input` and `beforeinput` risk bugs where the DOM falls out of sync, especially in weird environments like mobile Android with custom keyboards. You can even make programmatic DOM mutations and have those changes observed.

## The `Edit` data structure

Knowing the value of a `contenteditable` element is only half the problem. You also need to know what *changed*. If the value was `"Hello World"` and is now `"Hello, World!"`, what happened? Was it two separate edits, or one? Where exactly did the change occur?

The `Edit` class answers this. It's a compact data structure that describes a transformation from one string to another. Internally, it's represented as a flat array in the format `[position, deleted, inserted, ..., length]`, where each triplet says “at this position, delete this string, insert this string” and the final number is the length of the original string:

```js
// "Hello World" → "Hello, World!"
new Edit([5, "", ",", 11, "", "!", 11]);
// At position 5: insert ","
// At position 11: insert "!"
```

Retains are implicit: the gaps between positions represent text that is kept. This makes the common case, small edits to large documents, very compact. And the format is intuitive enough to read and write by hand, so long as you can calculate the indices of insertions and deletions.

This data structure was not something I invented out of thin air. The `Edit` class is actually inspired by the subsequence arithmetic described in Raph Levien's [detailed descriptions](https://xi-editor.io/docs/crdt-details.html) of the now defunct Xi editor’s conflict-free replicated data type (CRDT). The key insight from that work is that you can decompose any edit into two *subsequences*: one marking where insertions go, another marking where deletions go. These subsequences can then be manipulated with set-like operations — union, intersection, expansion, shrinking — to combine and transform edits algebraically. Revise borrows this decomposition without the full CRDT machinery, using it instead for operational transformation (OT).

The `Edit` data structure provided by Revise provide a rich set of methods for working with changes:

- **`edit.apply(text)`** applies the edit to a string.
- **`edit.compose(other)`** combines two sequential edits into one: if edit A transforms `s0` → `s1` and edit B transforms `s1` → `s2`, then `A.compose(B)` transforms `s0` → `s2` directly.
- **`edit.invert()`** reverses an edit: if A transforms `s0` → `s1`, then `A.invert()` transforms `s1` → `s0`. Every edit includes what is deleted so every edit is invertible.
- **`edit.transform(other)`** resolves concurrent edits. Given edits A and B both applied to the same document, `transform` returns adjusted versions A' and B' such that applying A then B' produces the same result as applying B then A'. This is the foundation of collaborative editing.
- **`edit.normalize()`** simplifies edits by finding common prefixes and suffixes between insertions and deletions: `[0, "abc", "axc", 3]` normalizes to `[1, "b", "x", 3]`.
- **`Edit.diff(text1, text2)`** computes the edit between two strings.

The `<content-area>` element integrates with the `Edit` data structure directly. Whenever the DOM changes, whether from typing, pasting, spellcheck, or any other source, `<content-area>` diffs the old and new values and dispatches a `contentchange` event with the resulting `Edit`:

```js
area.addEventListener("contentchange", (ev) => {
  console.log(ev.detail.edit); // an Edit instance
  // ev.detail.edit.apply(oldValue) === area.value
});
```
Because `<content-area>` produces `Edit` objects for every mutation, and because these can be composed, inverted, and transformed, they can be used as the basis for undo/redo history, stable keys for edited text, real-time “multiplayer” collaboration, or any feature that requires reasoning about changes to text over time. This is conveniently encapsulated in an `EditableState` class:

```js
// CLAUDE PLEASE FILL THIS
```

Again, it’s hard to overstate what an engineering marvel the `Edit` data structure is. It’s likely the most compact and elegant version of stringwise OT ever created, and the edit operations have been tested extensively with [`fast-check`](https://github.com/bikeshaving/revise/blob/99e7325a781f699da3cc04ea2d43b42b73a262c6/test/edit-properties.ts) for correctness. If you’re interested in OT and CRDTs, you should read through the source and plunder it for ideas about collaborative sequences and strings.

Ultimately, the goal for the `Edit` data structure is to promote aspirations for data abundance in document editing. We live in a world of 4K video streaming and high-frequency trading; surely, we can afford to store every edit to a document, forever. When edits are first-class data, not ephemeral input events that vanish after being applied, you can replay history, sync across devices, audit changes, review deletions, or do cool things nobody has thought of yet.The Edit data structure makes this all possible.

## Declarative text editors

The core parts of Revise chooses to be framework-agnostic and avoid owning the DOM rendering process, which brings its own tradeoffs. Consider the alternative. Most editing libraries solve the UI problem by owning entire rendering process. Vertically integrated editors like ProseMirror, CodeMirror and Quill each have their own rendering layer. Others like Draft.js, Slate, or the newer Svedit are tied to specific frameworks, but still own the rendering pipeline: you write Slate “elements” and “leaves,” not React components. Even “framework agnostic” libraries like the newer Lexical still do DOM manipulation themselves and expose plugin APIs, rather than letting you render to the DOM directly.

These systems are feature-complete but limited in extensibility, and require a lot of editor library specific knowledge. Want to render an inline image with a tooltip? You’re writing a narrowly defined plugin or a schema or a widget, never a regular component. You cannot use the same component architecture you use in the rest of your appplication, and any behavior outside the narrowly defined ontology of widgets and annotations becomes impossible.

Revise.js takes the opposite approach. Rather than owning the render, it actually relies on the framework to perform DOM mutations. The `<content-area>` element dispatches a `contentchange` event, your framework updates the DOM however it likes, and `<content-area>` observes the result. The document is never a tree of editor-specific nodes, it’s whatever HTML your framework produces, parsed back into a string.

This inversion is powerful but introduces two problems. First, when the framework re-renders, it mutates the DOM, and `<content-area>` can't tell the difference between a user typing and the framework correcting the DOM. Without intervention, every framework render would fire another `contentchange`, creating an infinite loop. Second, framework renders destroy and recreate DOM nodes, which means the browser's selection — the cursor — is lost after every render.

All the Revise.js parts described so far are UI framework-agnostic. For instance, you can use `<content-area> and `EditableState` with no framework at all via `innerHTML`.

```js live
import {ContentAreaElement} from "@b9g/revise/contentarea.js";
import {EditableState} from "@b9g/revise/state.js";

if (!customElements.get("content-area")) {
  customElements.define("content-area", ContentAreaElement);
}

const COLORS = [
  "#FF0000", "#FFA500", "#FFDC00",
  "#008000", "#0000FF", "#4B0082", "#800080",
];

const state = new EditableState({
  value: `Hello
World
Rainbow
Text
`,
});

const container = document.body;
container.innerHTML =
  `<content-area><div class="editable" contenteditable="true" spellcheck="false"></div></content-area>`;

const area = container.querySelector("content-area");
const editable = container.querySelector("[contenteditable]");

function render() {
  const lines = state.value.split("\n");
  if (lines[lines.length - 1] === "") lines.pop();
  editable.innerHTML = lines.map((line) =>
    `<div>${line
      ? [...line].map((ch, i) =>
          `<span style="color:${COLORS[i % COLORS.length]}">${ch}</span>`
        ).join("")
      : "<br>"}</div>`
  ).join("");
  // source() must be called immediately after DOM mutations,
  // before any other content-area API (which would trigger validate).
  area.source("render");
}

// CLAUDE WE NEED TO ADD THE SELECTION RESTORATION LOGIC BACK PLEASE
area.addEventListener("contentchange", (ev) => {
  if (ev.detail.source === "render") return;
  ev.preventDefault();
  state.applyEdit(ev.detail.edit);
  render();
});

requestAnimationFrame(() => render());
```

This approach has its limits, as you probably do not want to be updating `.innerHTML` with large and unsanitized documents, but it outlines the responsibilities of a UI editor which uses Revise.js abstractions. The UI library must:

- listen for `contentchange`
- call `preventDefault()` to revert the DOM to the state before the change was made
- apply the edit to state
- re-render, and tag the mutations with `source("render")` so they don't trigger another `contentchange`
- make sure the selection is restored in its expected location

This is a delicate and error-prone handshake, so Revise.js provides a Crank integration under the package `crankeditable` to do all this. After each render, the `Editable` component calls `el.source("render")`, which tags the pending mutations so that `<content-area>` knows to suppress the `contentchange` event. And before the render, it captures the selection position and restores it afterward using `el.setSelectionRange()`. The full cycle looks like this:

1.`contentchange` fires with `source: null`
2. The handler calls `preventDefault()`, which walks the mutation records backward to undo the DOM changes
3. The edit is applied to an `EditableState` object, which manages the document value, undo history, and stable line keys
4. The framework re-renders the decorated content
5. `el.source("render")` tags the mutations → the resulting `contentchange` is suppressed
6. `el.setSelectionRange()` restores the cursor

Here’s the complete rainbow editor in Crank.js — each character gets a color, and the whole thing is a normal Crank component:

```tsx live
import type {Context} from "@b9g/crank";
import {renderer} from "@b9g/crank/dom";
import {Editable, EditableState} from "@b9g/crankeditable";

const COLORS = [
  "#FF0000", "#FFA500", "#FFDC00",
  "#008000", "#0000FF", "#4B0082", "#800080",
];

function* RainbowEditable(this: Context) {
  const state = new EditableState({
    value: `Hello
World
Rainbow
Text
`,
  });
  for (const {} of this) {
    const lines = state.value.split("\n");
    if (lines[lines.length - 1] === "") lines.pop();
    let cursor = 0;
    yield (
      <Editable state={state} onstatechange={() => this.refresh()}>
        <div class="editable" contenteditable="true" spellcheck="false">
          {lines.map((line) => {
            const key = state.keyer.keyAt(cursor);
            cursor += line.length + 1;
            const chars = line
              ? [...line].map((char, i) => (
                  <span style={"color: " + COLORS[i % COLORS.length]}>{char}</span>
                ))
              : <br />;
            return <div key={key}>{chars}</div>;
          })}
        </div>
      </Editable>
    );
  }
}

renderer.render(<RainbowEditable />, document.body);
```

There’s nothing editor-specific about the rendering: it’s just JSX. The `Editable` wrapper handles the `contentchange` cycle, and `EditableState` tracks the value and undo history. You split the string into lines, render each line however you want, and the framework takes care of the rest.

Sometimes you want an element to represent text that isn’t its `textContent`. An emoji rendered as an `<img>` tag has no text content, but it should count as represented emoji in the final string. The `data-content` attribute tells `<content-area>` to use its value instead of walking the element’s children:

```tsx live
import type {Context, Element} from "@b9g/crank";
import {renderer} from "@b9g/crank/dom";
import {Editable, EditableState, ContentAreaElement} from "@b9g/crankeditable";
import {parse as parseEmoji} from "@twemoji/parser";

if (!customElements.get("content-area")) {
  customElements.define("content-area", ContentAreaElement);
}

function renderTwemoji(text: string): (Element | string)[] {
  const entities = parseEmoji(text);
  if (!entities.length) return [text];
  const result: (Element | string)[] = [];
  let lastIndex = 0;
  for (const entity of entities) {
    const [start, end] = entity.indices;
    if (start > lastIndex) result.push(text.slice(lastIndex, start));
    result.push(
      <img
        data-content={entity.text}
        src={entity.url}
        alt={entity.text}
        draggable={false}
        style="height:1.2em;width:1.2em;vertical-align:middle;display:inline-block"
      />
    );
    lastIndex = end;
  }
  if (lastIndex < text.length) result.push(text.slice(lastIndex));
  return result;
}

function* TwemojiEditable(this: Context) {
  const state = new EditableState({
    value: `Hello World! 👋
Revise.js is 🔥🔥🔥
Type some emoji: 😎❤️🚀
`,
  });
  for (const {} of this) {
    const lines = state.value.split("\n");
    if (lines[lines.length - 1] === "") lines.pop();
    let cursor = 0;
    yield (
      <Editable state={state} onstatechange={() => this.refresh()}>
        <div class="editable" contenteditable="true" spellcheck="false">
          {lines.map((line) => {
            const key = state.keyer.keyAt(cursor);
            cursor += line.length + 1;
            return (
              <div key={key}>
                {line ? renderTwemoji(line) : <br />}
              </div>
            );
          })}
        </div>
      </Editable>
    );
  }
}

renderer.render(<TwemojiEditable />, document.body);
```

As you can see, this approach to editing is less about upfront definition of nodes or document structure, and more about experimentation and seeing what you can possibly render and make editable. The task of writing a custom editor then becomes parsing the document with regexps, and figuring out how the UI corresponds to this underlying string. And I can personally tell you that there is something magical and inspiring to being about create a text editor with the component models you already use, like suddenly the scope of possible web applications has expanded.

## Manifesting a editable web

I’ve quietly worked on Revise in the open since 2018, and it’s bit like a graduate thesis for what I think `contenteditable`-based editors on the web should look like. I called it “revise” because I believe that writing is often about countless revisions and rethinking, every essay is a journey that changes you just as much as it might change the world. This library is an expression of hope that we might make editors on the web less monolithic, more expressive, less static, more weird. It already powers the playground and interactive examples on the Crank.js website, as well as all of the examples on this website as well.

The core APIs have stabilized, and I’m planning on crafting specific web component-based editors for common use-cases like a [Typora-style](https://typora.io) Markdown editor for the web. I’m also eager to put the `Edit` data structure’s OT capabilities into production, with a collaborative/multiplayer text editor.

If I can ask anything of you, dear reader, it’s that you should really see how much fun it is to write a custom text editor. I’d also be happy to advise anyone looking to write a UI framework adapter for any framework that doesn’t end in “react.” The process might involve a bit of DOM debugging and rethinking how to write text editors, but I promise the effort will be worth your time.
