---
title: "Introducing Revise"
description: Revise is a JavaScript library for building rich text editors using low-level foundations that work with contenteditable instead of against it.
publish: true
author: Brian Kim
authorURL: https://github.com/brainkim
publishDate: 2026-03-9
---

## The state of rich-text editing

Imagine it’s the late 2010s and you’re a human programmer working for a small startup. One day, an ambitious product manager comes to you with a feature request: See this input or textarea? Can we make it so that when the user types in a URL, it turns into a link automatically? Or can we let users @-mention each other, and have that highlighted? Or can we mark text over a certain character limit with a red background?

To the product manager, these may sound like natural extensions to the behavior of `<input>` and `<textarea>` elements. To you, the developer, it reads as ignorance. Sure, you could overlay a `<div>` on top of the form to style the text, but this is fragile and hacky. You could use rich-text editing libraries like the epic works of Dutch programmer Marijn Haverbeke, who almost singlehandedly made the web editable with his “Mirror” libraries ProseMirror and CodeMirror. But these are heavyweight solutions for what should be minor modifications of form behavior.

If you’re pragmatic, what you typically don’t consider as a possibility is directly using `contenteditable`, an HTML attribute which turns any element into a freeform text editing surface. The libraries I’ve mentioned exist because working with `contenteditable` is notoriously difficult and frankly, not your problem to solve. You may have read the essay [Why ContentEditable is Terrible](https://medium.engineering/why-contenteditable-is-terrible-122d8a40e480), written by an engineer at Medium. If programmers at Medium, a firm dedicated to writing and publishing, find working with `contenteditable` so difficult, wouldn’t it be unwise to try it yourself?

Cut to 2026. The situation has not measurably improved. New libraries have popped up, old ones have received updates, and browsers have even attempted to provide alternatives to `contenteditable` like [`EditContext`](https://developer.mozilla.org/en-US/docs/Web/API/EditContext_API). But there’s still the same old chasm between form elements like `<input>` and `<textarea>` and anything more than plaintext representations of them.

Revise.js is an attempt to bridge the gap. It’s not a full-fledged editor with toolbars; rather, it’s the missing standard library for `contenteditable`. It provides a small set of building blocks for working with `contenteditable` directly: a custom element that watches the DOM for changes, a data structure for describing edits to text, and a [Crank.js](https://crank.js.org) integration which allows you to write declarative components.
## The `<content-area>` element

The first problem you might encounter when working with `contenteditable` is how to represent the underlying document. Editing libraries can be divided into two main types: code editors like CodeMirror, where the document is a string, and rich-text editors like ProseMirror, where the document is a tree of nodes, usually represented as JSON. Revise.js chooses to use the code editor approach for simplicity.

Trees give you structure, but they also bring their own problems. For instance, where is the cursor? In a string, it's just an index. In a tree, you need paths or traversal algorithms. Another difficulty is that tree structures require bespoke serialization and deserialization schemes. When users want to export their document, they want markdown or plaintext. Exporting your bespoke JSON tree would almost feel like vendor lock-in. With strings, the document is already in a ready-made format for saving and exporting.

<figure>
<img src="/static/prosemirror-indexing.png" alt="ProseMirror's token-based indexing scheme">
<figcaption>How ProseMirror counts positions: tokens in a tree, not characters in a string.</figcaption>
</figure>

Unfortunately, the difficulty with the string approach is modeling the DOM as a string. The reality is that there is no DOM API which can help you. For instance, the `textContent` property is a concatenation of all the text nodes in a document; it does not include line breaks. The `innerHTML` property gives you the actual HTML markup, not text. The `innerText` property is probably the closest approximation, it’s described as what would be copied if you selected the element and copied its contents. However, its behavior is inconsistent across browsers, unconfigurable, and it hard-codes weird conventions like adding extra newlines for `<p>` elements.

What you really want is something like `<textarea>`’s `.value`, a clean string that reflects the editable content. The `<content-area>` custom element provides exactly this:

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

The API deliberately mirrors `<textarea>`, and provides `.value`, `.selectionStart`, `.selectionEnd`, `.selectionDirection` properties. The difference is that the contents can be anything: paragraphs, links, images, styled spans. This necessarily implies that the value is read-only: the DOM is the source of truth, not the string.

It is hard to overstate what an engineering marvel the `<content-area>` element is. Consider that a string like `"Hello\nWorld\n"` can be represented by nearly infinite DOM structures:

- `<p>Hello</p><p>World</p>`
- `<div>Hello<br>World</div>`
- `<div>Hello<div>World</div></div>`

To read the DOM into a string, it walks its children and tracks `<br>` and block-like elements to determine where newlines belong.

This would be expensive to do on every keystroke, so `<content-area>` uses a `MutationObserver` to watch its subtree. Rather than re-reading the entire DOM, it only rereads the parts that were actually mutated. And because it observes mutations rather than intercepting input events, every input method works for free: spellcheck, IME, dictation, browser extensions, even programmatic DOM mutations. This approach is fail-safe: editor libraries which rely on events like `input` and `beforeinput` risk bugs where the DOM falls out of sync, especially in weird environments like mobile Android with custom keyboards.

## The `Edit` data structure

Knowing the value of a `contenteditable` element is only half the problem. You also need to know what *changed*. If the value was `"Hello World"` and is now `"Hello, World!"`, what happened? Was it two separate edits, or one? Where exactly did the change occur?

The `Edit` class answers this. It's a compact data structure that describes a transformation from one string to another. Internally, it's represented as a flat array in the format `[position, deleted, inserted, ..., length]`, where each triplet says "at this position, delete this string, insert this string" and the final number is the length of the original:

```js
// "Hello World" → "Hello, World!"
new Edit([5, "", ",", 11, "", "!", 11]);
// At position 5: insert ","
// At position 11: insert "!"
```

Retains are implicit: the gaps between positions represent text that is kept. This makes the common case, small edits to large documents, very compact. And the format is intuitive enough to read and write by hand, so long as you calculate the indices of insertions and deletions.

The `Edit` class is inspired by the subsequence arithmetic described in Raph Levien's [detailed descriptions](https://xi-editor.io/docs/crdt-details.html) of the now defunct xi-editor’s conflict-free replicated data type (CRDT). The key insight from that work is that you can decompose any edit into two *subsequences*: one marking where insertions go, another marking where deletions go. These subsequences can then be manipulated with set-like operations — union, intersection, expansion, shrinking — to combine and transform edits algebraically. Revise borrows this decomposition without the full CRDT machinery, using it instead for operational transformation (OT).

This gives `Edit` a rich set of methods for working with changes:

- **`apply(text)`** applies the edit to a string.
- **`compose(other)`** combines two sequential edits into one: if edit A transforms `s0` → `s1` and edit B transforms `s1` → `s2`, then `A.compose(B)` transforms `s0` → `s2` directly.
- **`invert()`** reverses an edit: if A transforms `s0` → `s1`, then `A.invert()` transforms `s1` → `s0`. Every edit includes what is deleted so every edit is invertible.
- **`transform(other)`** resolves concurrent edits. Given edits A and B both applied to the same document, `transform` returns adjusted versions A' and B' such that applying A then B' produces the same result as applying B then A'. This is the foundation of collaborative editing.
- **`normalize()`** simplifies edits by finding common prefixes and suffixes between insertions and deletions: `[0, "abc", "axc", 3]` normalizes to `[1, "b", "x", 3]`.
- **`diff(text1, text2)`** computes the edit between two strings.

The `<content-area>` element integrates with `Edit` directly. Whenever the DOM changes, whether from typing, pasting, spellcheck, or any other source, `<content-area>` diffs the old and new values and dispatches a `contentchange` event with the resulting `Edit`:

```js
area.addEventListener("contentchange", (ev) => {
  console.log(ev.detail.edit); // an Edit instance
  // ev.detail.edit.apply(oldValue) === area.value
});
```
Because `<content-area>` produces `Edit` objects for every mutation, and because they can be composed, inverted, and transformed, they can be used as the basis for undo/redo history, creating stable keys for text which is edited, real-time collaboration, or any feature that requires reasoning about changes over time. Most of this is exposed via an `EditableState` class, and while the real-time collaboration feature hasn’t been implemented, it’s planned.

Again, it’s hard to overstate what an engineering marvel the `Edit` data structure is. It’s likely the most compact and elegant version of stringwise OT ever created. The operations grow out of algebraic subsequence arithmetic and have been tested extensively with [`fast-check`](https://github.com/bikeshaving/revise/blob/99e7325a781f699da3cc04ea2d43b42b73a262c6/test/edit-properties.ts) for correctness. If you’re interested in OT and CRDTs, you should read through the source and plunder it for ideas about collaborative sequences and strings.

The vision behind the Edit data structure is one of data abundance. We live in a world of 4K video streaming and high-frequency trading. Surely we can afford to store every edit to a document, forever. When edits are first-class data, not ephemeral input events that vanish after being applied, you can replay history, sync across devices, audit changes, review deletions, or do things nobody has thought of yet. The goal is to make this not just possible but natural.

## Crank integration

## Crossing the river
