---
title: "Introducing Revise"
description: Revise is a JavaScript library for building rich text editors using low-level foundations that work with contenteditable instead of against it.
publish: true
author: Brian Kim
authorURL: https://github.com/brainkim
publishDate: 2026-03-9
---

## The state of rich-text editing

Imagine it’s the late 2010s and you’re a human programmer working for a small startup. One day, an ambitious product manager comes to you with a feature request: See this input or textarea? Can we make it so that when the user types in a URL, it turns into a link automatically? Or can we let users @-mention each other, and have that highlighted / autocompleted? Or can we mark text over a certain character limit with a red background?

To the product manager, these may sound like natural extensions to the behavior of `<input>` and `<textarea>` elements. To you, the developer, it reads as ignorance. Sure, you could overlay a `<div>` on top of the form to style the text, but this is fragile and hacky. You could use rich-text editing libraries like the epic works of Dutch programmer Marijn Haverbeke, who almost singlehandedly made the web editable with his “Mirror” libraries ProseMirror and CodeMirror. But these are for full-on editors, not for slightly modified forms.

If you’re pragmatic, what you typically don’t consider as a possibility is directly using `contenteditable`, an HTML attribute which turns any element into a freeform text editing surface. The libraries I’ve mentioned exist because working with `contenteditable` is notoriously difficult and frankly, not your problem to solve. You may have read the essay [Why ContentEditable is Terrible](https://medium.engineering/why-contenteditable-is-terrible-122d8a40e480), written by an engineer at Medium. If programmers at Medium, a firm dedicated to writing and publishing, find working with `contenteditable` so difficult, wouldn’t it be unwise to try it yourself?

Cut to 2026. The situation has not measurably improved. New libraries have popped up, old ones have received updates, and browsers have even attempted to provide alternatives to `contenteditable` like [`EditContext`](https://developer.mozilla.org/en-US/docs/Web/API/EditContext_API). But there’s still the same old chasm between form elements like `<input>` and `<textarea>` and anything more than plaintext representations of them.

Revise.js is an attempt to bridge the gap. It’s not a full-fledged editor with toolbars; rather, it’s the layer underneath. It provides a small set of building blocks for working with `contenteditable` directly: a custom element that watches the DOM for changes, a data structure for describing edits to text, and a Crank.js integration which allows you to write declarative components. Together, these pieces provide the foundations for working with `contenteditable` directly to add as much richness to your forms as you might need.

## The `<content-area>` element

The first problem you might encounter when working with `contenteditable` is how to represent the underlying document. Editing libraries can be divided into two main types: code editors like CodeMirror, where the document is a string, and rich-text editors like ProseMirror, where the document is a tree of nodes. Revise.js chooses to use the code editor approach for simplicity.

Trees give you structure, but they also bring their own problems. For instance, where is the cursor? In a string, it's just an index. In a tree, you need paths or traversal algorithms. Another difficulty is that tree structures require bespoke serialization and deserialization schemes. When users want to export their document, they want markdown or plaintext. Exporting your bespoke JSON tree would read as vendor lockin. With strings, the document is already in a ready-made format for saving and exporting.

<figure>
<img src="/static/prosemirror-indexing.png" alt="ProseMirror's token-based indexing scheme">
<figcaption>How ProseMirror counts positions: tokens in a tree, not characters in a string.</figcaption>
</figure>

The difficulty with the string approach is modeling the DOM as a string. The reality is that there is no DOM API which can help you. For instance, the `textContent` property is a concatenation of all the text nodes in a document; it does not include line breaks. The `innerHTML` property gives you the actual HTML markup, not text. The `innerText` property is probably the closest approximation, except its behavior is inconsistent across browsers, and hard-codes weird conventions like adding extra newlines for `<p>` elements.

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

The API deliberately mirrors `<textarea>`, and provides `.value`, `.selectionStart`, `.selectionEnd`, `.selectionDirection` properties, but the contents of this custom element can be anything: paragraphs, links, images, styled spans. This necessarily implies that the value is read-only: the DOM is the source of truth, not the string.

It is hard to overstate what an engineering marvel the `<content-area>` element is. Consider that a string like `"Hello\nWorld\n"` can be represented by dozens of different DOM structures:

- `<p>Hello</p><p>World</p>`
- `<div>Hello<br>World</div>`
- `<div>Hello<div>World</div></div>`

To turn the DOM into a string, the element walks its children and uses `<br>` and block-like elements to determine where newlines belong.

This would be expensive to do on every keystroke, so `<content-area>` uses a `MutationObserver` to watch its subtree. Rather than re-reading the entire DOM, it only recomputes the parts that were actually mutated, walking the tree and diffing the result against the previous value. And because it observes mutations rather than intercepting input events, every input method works for free: spellcheck, IME, dictation, browser extensions, even programmatic DOM mutations.

## The `Edit` data structure

## Crank integration

## Crossing the river
