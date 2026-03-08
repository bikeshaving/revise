---
title: "Introducing Revise"
description: Revise is a JavaScript library for building rich text editors using low-level foundations that work with contenteditable instead of against it.
publish: false
author: Brian Kim
authorURL: https://github.com/brainkim
publishDate: 2026-03-06
---

## Rich-text on the web

Imagine it’s the late 2010s and you’re a human programmer working for a small startup. One day, an ambitious product manager comes to you with a feature request: See this input or textarea? Can we make it so that when the user types in a URL, it turns into a link automatically? Or can we let users @-mention each other, and have that highlighted/autocompleted? Or can we mark text over a certain character limit with a red background?

To the product manager, these may sound like natural extensions to the behavior of `<input>` and `<textarea>` elements. To you, the developer, it reads as ignorance. Sure, you could overlay a `<div>` on top of the form to style the text, but this is fragile and hacky. You could use rich-text editing libraries like the epic works of Dutch programmer Marijn Haverbeke, who almost singlehandedly made the web editable with his “Mirror” libraries ProseMirror and CodeMirror. But these are for full-on editors, not really simple forms.

If you’re pragmatic, what you typically don’t consider as a possibility is directly using `contenteditable`, an HTML attribute which turns any element into a freeform text editing surface. The libraries I’ve mentioned exist because working with `contenteditable` is notoriously difficult and frankly, not your problem to solve. You may have read the essay [Why ContentEditable is Terrible](https://medium.engineering/why-contenteditable-is-terrible-122d8a40e480), written by an engineer at Medium. If programmers at Medium, a firm dedicated to writing and publishing, find working with `contenteditable` difficult, wouldn’t it be unwise to try it yourself?

Cut to 2026. The situation has not measurably improved. New libraries have popped up, old ones have received updates, and even browsers have attempted to provide alternatives to `contenteditable` like [`EditContext`](https://developer.mozilla.org/en-US/docs/Web/API/EditContext_API). But there’s still the same old chasm between form elements like `<input>` and `<textarea>` and anything more than plaintext representation.

Revise.js is an attempt to bridge the gap. It’s not a rich-text editor or a code editor; rather, it’s the layer underneath. It provides a set of foundational building blocks for working with `contenteditable` directly: a custom element that watches the DOM for changes, a data structure for describing edits to text, and a Crank.js integration which brings it all together. The rest of this essay will examine the parts which comprise this open source library and explain the tradeoffs of using this approach.

## The `<content-area>` element

## The `Edit` data structure

## Crank integration

## Crossing the river
