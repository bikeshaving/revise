# Revise.js

Revise is a JavaScript library for creating
[`contenteditable`-based](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/contenteditable)
rich-text editors in the browser. It provides a low-level, web-component based
API for translating the DOM into string documents. The library also ships with
a compact data structure for representing edits to strings. Revise is intended
to be framework-agnostic, though currently it is only being tested with
[Crank](crank.js.org).

## Status

At present, this library is in an early beta. It is recommended for developers
who aren’t afraid of stepping through DOM code in a debugger.

## Usage

TKTKTKT

## API

### `ContentAreaElement`

A custom element class with an API similar to that of the JavaScript API for
the [`<textarea>`
element](https://developer.mozilla.org/en-US/docs/Web/API/HTMLTextAreaElement).
This class provides special properties and methods for reading the current
value of the element’s contents and manipulating its selection.

- `value`

- `selectionStart`

- `selectionEnd`

- `selectionDirection`

- `setSelectionRange(selectionStart: number, selectionEnd: number, selectionDirection?: SelectionDirection): void;`

- `indexAt(node: Node | null, offset: number): number`

- `nodeOffsetAt(index: number): [Node | null, number]

- `source(name: string): boolean`

- `ContentEvent`

### `Edit`

- `operations(): Array<Operation>`

- `apply(text: string): string`

- `compose(that: Edit): Edit`

- `invert(): Edit`

- `normalize(): Edit`

- `hasChangesBetween(start: number, end: number): boolean`

- `Edit.createBuilder(value: string): EditBuilder`

- `Edit.diff(text1: string, text2: string, hint?: number): Edit`

### `EditBuilder`

### `EditHistory`

### `Keyer`
