/// <reference lib="dom" />
import type {Cursor} from "./patch";
import {Patch} from "./patch";

export interface ContentEventDetail {
	patch: Patch;
}

export interface ContentEventInit extends CustomEventInit<ContentEventDetail> {}

export class ContentEvent extends CustomEvent<ContentEventDetail> {
	constructor(typeArg: string, eventInit: ContentEventInit) {
		// Maybe we should do some runtime eventInit validation.
		super(typeArg, {bubbles: true, ...eventInit});
	}
}

const css = `
:host {
	display: contents;
	white-space: pre-wrap;
	white-space: break-spaces;
	overflow-wrap: break-word;
}`;

/********************************************/
/*** ContentAreaElement symbol properties ***/
/********************************************/
// TODO: Maybe these properties can be grouped on a hidden class?
const $cache = Symbol.for("revise$cache");
const $value = Symbol.for("revise$value");
const $cursor = Symbol.for("revise$cursor");
const $slot = Symbol.for("revise$slot");
const $observer = Symbol.for("revise$observer");
const $history = Symbol.for("revise$history");
const $onselectionchange = Symbol.for("revise$onselectionchange");
export class ContentAreaElement extends HTMLElement {
	[$cache]: NodeInfoCache;
	[$value]: string;
	[$cursor]: Cursor;
	[$history]: PatchHistory;
	[$slot]: HTMLSlotElement;
	[$observer]: MutationObserver;
	[$onselectionchange]: (ev: Event) => unknown;

	constructor() {
		super();
		this[$cache] = new Map();
		this[$value] = "";
		this[$cursor] = 0;
		const history = (this[$history] = new PatchHistory());
		const shadow = this.attachShadow({mode: "closed"});
		const style = document.createElement("style");
		style.textContent = css;
		shadow.appendChild(style);
		const slot = document.createElement("slot");
		this[$slot] = slot;
		slot.contentEditable = this.contentEditable;
		shadow.appendChild(slot);

		this[$observer] = new MutationObserver((records) =>
			validate(this, records),
		);
		// Because this listener is added to the document, we have to add and
		// remove the listener in the connected callback.
		this[$onselectionchange] = () => {
			const records = this[$observer].takeRecords();
			if (records.length) {
				validate(this, records);
			} else {
				const cursor = getCursor(this, this[$cache]);
				if (cursor !== undefined && !isCursorEqual(cursor, this[$cursor])) {
					// TODO: Dispatch an event here...
					this[$cursor] = cursor;
					history.checkpoint();
				}
			}
		};

		this.addEventListener("focusin", () => {
			const {
				selectionStart,
				selectionEnd,
				selectionDirection,
			} = selectionInfoFromCursor(this[$cursor]);
			this.setSelectionRange(selectionStart, selectionEnd, selectionDirection);
		});

		this.addEventListener("input", () => {
			// TODO: Should we consider passing input event information to this function?
			validate(this, this[$observer].takeRecords());
		});

		this.addEventListener("keydown", (ev) => {
			if (this.undoMode === "keydown") {
				if (isUndoKeyboardEvent(ev)) {
					ev.preventDefault();
					this.undo();
				} else if (isRedoKeyboardEvent(ev)) {
					ev.preventDefault();
					this.redo();
				}
			}
		});
	}

	/******************************/
	/*** Custom Element methods ***/
	/******************************/
	static get observedAttributes(): Array<string> {
		return ["contenteditable"];
	}

	connectedCallback() {
		// TODO: Figure out a way to call validate here instead
		this[$value] = getContent(this, this[$cache], this[$value]);
		const cursor = getCursor(this, this[$cache]);
		if (cursor !== undefined) {
			this[$cursor] = cursor;
		}

		this[$observer].observe(this, {
			subtree: true,
			childList: true,
			characterData: true,
			attributes: true,
			attributeFilter: [
				"data-content",
				"data-contentbefore",
				"data-contentafter",
			],
		});

		document.addEventListener("selectionchange", this[$onselectionchange]);
	}

	disconnectedCallback() {
		this[$cache].clear();
		this[$observer].disconnect();
		// JSDOM-based environments like jest will make the global document null
		// before calling the disconnectedCallback for some reason.
		if (document) {
			document.removeEventListener("selectionchange", this[$onselectionchange]);
		}
	}

	attributeChangedCallback(name: string) {
		switch (name) {
			case "contenteditable": {
				const slot = this[$slot];
				// We have to set slot.contentEditable to this.contentEditable because
				// Chrome has trouble selecting elements across shadow DOM boundaries.
				// See https://bugs.chromium.org/p/chromium/issues/detail?id=1175930

				// Chrome has additional issues with using the host element as a
				// contenteditable element but this normalizes some of the behavior.
				slot.contentEditable = this.contentEditable;
				break;
			}
		}
	}

	/***********************/
	/*** Content methods ***/
	/***********************/
	get value(): string {
		validate(this, this[$observer].takeRecords());
		return this[$value];
	}

	repair(callback: Function, expectedValue?: string | undefined): void {
		validate(this, this[$observer].takeRecords());
		const cache = this[$cache];
		const value = this[$value];
		if (typeof expectedValue === "undefined") {
			expectedValue = value;
		}

		const {
			selectionStart,
			selectionEnd,
			selectionDirection,
		} = selectionInfoFromCursor(this[$cursor]);
		callback();
		validate(this, this[$observer].takeRecords(), {skipSelection: true});
		if (this[$value] !== expectedValue) {
			throw new Error("Expected value did not match current value");
		}

		if (value === expectedValue) {
			setSelectionRange(
				this,
				cache,
				value,
				selectionStart,
				selectionEnd,
				selectionDirection,
			);
		}
	}

	/*************************/
	/*** Selection Methods ***/
	/*************************/
	get cursor(): Cursor {
		validate(this, this[$observer].takeRecords());
		const cursor = this[$cursor];
		if (typeof cursor === "number") {
			return cursor;
		}

		// defensive copy array cursors
		return cursor.slice() as [number, number];
	}

	get selectionStart(): number {
		validate(this, this[$observer].takeRecords());
		return selectionInfoFromCursor(this[$cursor]).selectionStart;
	}

	set selectionStart(selectionStart: number) {
		validate(this, this[$observer].takeRecords());
		const value = this[$value];
		const cache = this[$cache];
		const {selectionEnd, selectionDirection} = selectionInfoFromCursor(
			this[$cursor],
		);
		setSelectionRange(
			this,
			cache,
			value,
			selectionStart,
			selectionEnd,
			selectionDirection,
		);
	}

	get selectionEnd(): number {
		validate(this, this[$observer].takeRecords());
		return selectionInfoFromCursor(this[$cursor]).selectionEnd;
	}

	set selectionEnd(selectionEnd: number) {
		validate(this, this[$observer].takeRecords());
		const value = this[$value];
		const cache = this[$cache];
		const {selectionStart, selectionDirection} = selectionInfoFromCursor(
			this[$cursor],
		);
		setSelectionRange(
			this,
			cache,
			value,
			selectionStart,
			selectionEnd,
			selectionDirection,
		);
	}

	get selectionDirection(): SelectionDirection {
		validate(this, this[$observer].takeRecords());
		return selectionInfoFromCursor(this[$cursor]).selectionDirection;
	}

	set selectionDirection(selectionDirection: SelectionDirection) {
		validate(this, this[$observer].takeRecords());
		const cache = this[$cache];
		const value = this[$value];
		const {selectionStart, selectionEnd} = selectionInfoFromCursor(
			this[$cursor],
		);
		setSelectionRange(
			this,
			cache,
			value,
			selectionStart,
			selectionEnd,
			selectionDirection,
		);
	}

	setSelectionRange(
		selectionStart: number,
		selectionEnd: number,
		selectionDirection: SelectionDirection = "none",
	): void {
		validate(this, this[$observer].takeRecords());
		const cache = this[$cache];
		const value = this[$value];
		setSelectionRange(
			this,
			cache,
			value,
			selectionStart,
			selectionEnd,
			selectionDirection,
		);
	}

	indexAt(node: Node | null, offset: number): number {
		validate(this, this[$observer].takeRecords());
		const cache = this[$cache];
		return indexAt(this, cache, node, offset);
	}

	nodeOffsetAt(index: number): [Node | null, number] {
		validate(this, this[$observer].takeRecords());
		const cache = this[$cache];
		return nodeOffsetAt(this, cache, index);
	}

	/***********************/
	/*** History Methods ***/
	/***********************/
	get undoMode(): UndoMode {
		let attr = this.getAttribute("undomode");
		if (!attr) {
			return "none";
		}

		attr = attr.toLowerCase();
		if (attr === "keydown") {
			return attr;
		}

		return "none";
	}

	checkpoint(): void {
		this[$history].checkpoint();
	}

	undo(): void {
		validate(this, this[$observer].takeRecords());
		const value = this[$value];
		const patch = this[$history].undo();
		if (patch) {
			const historyValue = patch.apply(value);
			this[$value] = historyValue;
			this.dispatchEvent(new ContentEvent("contentundo", {detail: {patch}}));
			this[$value] = value;
			validate(this, this[$observer].takeRecords(), {skipHistory: true});
			if (this[$value] === historyValue) {
				const cursor = cursorFromPatch(patch);
				const {
					selectionStart,
					selectionEnd,
					selectionDirection,
				} = selectionInfoFromCursor(cursor);
				setSelectionRange(
					this,
					this[$cache],
					historyValue,
					selectionStart,
					selectionEnd,
					selectionDirection,
				);
			} else {
				throw new Error("undo was not correctly rendered");
			}
		}
	}

	redo(): void {
		validate(this, this[$observer].takeRecords());
		const value = this[$value];
		const patch = this[$history].redo();
		if (patch) {
			const historyValue = patch.apply(value);
			this[$value] = historyValue;
			this.dispatchEvent(new ContentEvent("contentredo", {detail: {patch}}));
			this[$value] = value;
			validate(this, this[$observer].takeRecords(), {skipHistory: true});
			if (this[$value] === historyValue) {
				const cursor = cursorFromPatch(patch);
				const {
					selectionStart,
					selectionEnd,
					selectionDirection,
				} = selectionInfoFromCursor(cursor);
				setSelectionRange(
					this,
					this[$cache],
					historyValue,
					selectionStart,
					selectionEnd,
					selectionDirection,
				);
			} else {
				throw new Error("redo was not correctly rendered");
			}
		}
	}
}

// TODO: Smelly
interface ValidateOptions {
	skipSelection?: boolean;
	skipHistory?: boolean;
}

function validate(
	area: ContentAreaElement,
	records: Array<MutationRecord>,
	{skipSelection, skipHistory}: ValidateOptions = {},
): void {
	const cache = area[$cache];
	if (invalidate(area, cache, records)) {
		const history = area[$history];
		const oldValue = area[$value];
		const oldCursor = area[$cursor];
		const value = (area[$value] = getContent(area, cache, oldValue));
		let cursor = oldCursor;
		// TODO: move this code out of here
		// There appears to be a race condition in Safari where
		// document.getSelection() returns erroneous information when repair is
		// called from within a requestAnimationFrame() callback, but the cursor is
		// usually correct, so we just skip finding the new cursor information.
		if (!skipSelection) {
			const cursor1 = getCursor(area, cache);
			if (cursor1 !== undefined) {
				area[$cursor] = cursor = cursor1;
			}
		}

		if (!skipHistory) {
			const hint = Math.min.apply(null, [oldCursor, cursor].flat());
			// TODO: This diff call is expensive. If we create a patch in getContent
			// instead of a new string, we might be able to save a lot in CPU time.
			const patch = Patch.diff(oldValue, value, hint);
			history.push(patch);
			area.dispatchEvent(new ContentEvent("contentchange", {detail: {patch}}));
		}
	}
}

// TODO: Should we allow custom newlines?
const NEWLINE = "\n";

// TODO: Allow the list of block-like elements to be overridden with an
// attribute.
const BLOCKLIKE_ELEMENTS = new Set([
	"ADDRESS",
	"ARTICLE",
	"ASIDE",
	"BLOCKQUOTE",
	"CAPTION",
	"DETAILS",
	"DIALOG",
	"DD",
	"DIV",
	"DL",
	"DT",
	"FIELDSET",
	"FIGCAPTION",
	"FIGURE",
	"FOOTER",
	"FORM",
	"H1",
	"H2",
	"H3",
	"H4",
	"H5",
	"H6",
	"HEADER",
	"HGROUP",
	"HR",
	"LI",
	"MAIN",
	"NAV",
	"OL",
	"P",
	"PRE",
	"SECTION",
	"TABLE",
	"TR",
	"UL",
]);

interface NodeInfo {
	/** flags */
	flags: number;
	/** The start of this node’s contents relative to the start of the parent. */
	offset: number;
	// TODO: Use a separate property for invalidated nodes.
	/** The length of this node’s contents. */
	length: number;
}

/**********************/
/*** NodeInfo flags ***/
/**********************/
/** Whether the node or its children have been mutated */
const IS_VALID = 1 << 0;
/** Whether the node is responsible for the newline before it. */
const PREPENDS_NEWLINE = 1 << 1;
/** Whether the node is responsible for the newline after it. */
const APPENDS_NEWLINE = 1 << 2;

type NodeInfoCache = Map<Node, NodeInfo>;

// This is the single most complicated function in the library!!!
/**
 * This function returns the content of the root (always a content-area
 * element, and populates the cache with info about the contents of nodes for
 * future reads.
 * @param root - The root element (usually a content-area element)
 * @param cache - The nodeInfo cache associated with the root
 * @param oldContent - The previous content of the root.
 */
function getContent(
	root: Element,
	cache: NodeInfoCache,
	oldContent: string,
): string {
	const walker = document.createTreeWalker(
		root,
		NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
	);

	// TODO: It might be faster to construct and return a patch rather than
	// concatenating a giant string.
	let content = "";
	// Because the content variable is a heavily concatenated string and likely
	// inferred by most engines as requiring a “rope-like” data structure for
	// performance, reading from the end of the string to detect newlines can be
	// a bottleneck. Therefore, we store that info in this boolean instead.
	/** A boolean which indicates whether content currently ends in a newline. */
	let hasNewline = false;
	/** The start of the current node relative to its parent. */
	let offset = 0;
	// The current index into oldContent. We use this to copy unchanged text over
	// and track deletions.
	// If there are nodes which have cached start and length information, we get
	// their contents from oldContent string using oldIndex so we don’t have to
	// read it from the DOM.
	let oldIndex = 0;
	// The current index into oldContent of the current node’s parent. We can get
	// the expected start of a node if none of the nodes before it were deleted
	// by finding the difference between oldIndex and relativeOldIndex. We can
	// compare this difference to the cached start information to detect
	// deletions.
	let relativeOldIndex = 0;
	let info: NodeInfo = cache.get(root)!;
	if (info === undefined) {
		info = {flags: 0, offset, length: 0};
		cache.set(root, info);
	}

	// A stack to save some variables as we walk up and down the tree.
	const stack: Array<{relativeOldIndex: number; info: NodeInfo}> = [];
	for (let node: Node | null = root, descending = true; node !== null; ) {
		// A loop to descend into the DOM tree.
		while (descending && !(info.flags & IS_VALID)) {
			if (
				node.nodeType === Node.TEXT_NODE ||
				// We treat elements with data-content attributes as opaque.
				(node as Element).hasAttribute("data-content")
			) {
				break;
			}

			// If the current node is a block-like element, and the previous
			// node/elements did not end with a newline, then the current element
			// would introduce a linebreak before its contents.
			// We check that the offset is non-zero so that the first child of a
			// parent does not introduce a newline before it.
			const prependsNewline =
				!!offset && !hasNewline && isBlocklikeElement(node);
			if (prependsNewline) {
				content += NEWLINE;
				hasNewline = true;
				offset += NEWLINE.length;
				info.offset += NEWLINE.length;
				info.flags |= PREPENDS_NEWLINE;
			} else {
				info.flags &= ~PREPENDS_NEWLINE;
			}

			const firstChild = walker.firstChild();
			if (firstChild) {
				descending = true;
			} else {
				break;
			}

			stack.push({relativeOldIndex, info});
			relativeOldIndex = oldIndex;
			offset = 0;
			node = firstChild;
			// getNodeInfo
			info = cache.get(node)!;
			if (info === undefined) {
				info = {flags: 0, offset, length: 0};
				cache.set(node, info);
			} else {
				if (info.offset > 0) {
					// deletion detected
					oldIndex += info.offset;
				}

				info.offset = offset;
			}
		}

		if (info.flags & IS_VALID) {
			// The node has been seen before.
			// Reading from oldContent because length hasn’t been invalidated.
			const length = info.length;
			if (oldIndex + info.length > oldContent.length) {
				throw new Error("String length mismatch");
			}

			const prependsNewline =
				!!offset && !hasNewline && isBlocklikeElement(node);
			if (prependsNewline) {
				content += NEWLINE;
				hasNewline = true;
				offset += NEWLINE.length;
				info.offset += NEWLINE.length;
				info.flags |= PREPENDS_NEWLINE;
			} else {
				info.flags &= ~PREPENDS_NEWLINE;
			}

			const oldContent1 = oldContent.slice(oldIndex, oldIndex + length);
			content += oldContent1;
			offset += length;
			oldIndex += length;
			hasNewline = oldContent1.endsWith(NEWLINE);
		} else {
			// The node hasn’t been seen before.
			let appendsNewline = false;
			if (node.nodeType === Node.TEXT_NODE) {
				const content1 = (node as Text).data;
				content += content1;
				offset += content1.length;
				hasNewline = content1.endsWith(NEWLINE);
			} else if ((node as Element).hasAttribute("data-content")) {
				const content1 = (node as Element).getAttribute("data-content") || "";
				content += content1;
				offset += content1.length;
				hasNewline = content1.endsWith(NEWLINE);
			} else if (!hasNewline && isBlocklikeElement(node)) {
				content += NEWLINE;
				offset += NEWLINE.length;
				hasNewline = true;
				appendsNewline = true;
			} else if (node.nodeName === "BR") {
				content += NEWLINE;
				offset += NEWLINE.length;
				hasNewline = true;
			}

			info.length = offset - info.offset;
			info.flags |= IS_VALID;
			info.flags = appendsNewline
				? info.flags | APPENDS_NEWLINE
				: info.flags & ~APPENDS_NEWLINE;
		}

		// Finding the next node.
		node = walker.nextSibling();
		if (node) {
			descending = true;
			// getNodeInfo
			info = cache.get(node)!;
			if (info === undefined) {
				info = {flags: 0, offset, length: 0};
				cache.set(node, info);
			} else {
				const oldOffset = oldIndex - relativeOldIndex;
				if (info.offset > oldOffset) {
					// deletion detected
					oldIndex += info.offset - oldOffset;
				} else if (info.offset < oldOffset) {
					// This should never happen
					throw new Error("Invalid state");
				}

				info.offset = offset;
			}
		} else {
			descending = false;
			if (walker.currentNode !== root) {
				if (!stack.length) {
					throw new Error("Stack is empty");
				}

				({relativeOldIndex, info} = stack.pop()!);
				offset = info.offset + offset;
				node = walker.parentNode();
			}
		}
	}

	return content;
}

function isBlocklikeElement(node: Node): node is Element {
	return (
		node.nodeType === Node.ELEMENT_NODE && BLOCKLIKE_ELEMENTS.has(node.nodeName)
	);
}

function invalidate(
	root: Element,
	cache: NodeInfoCache,
	records: Array<MutationRecord>,
): boolean {
	let invalidated = false;
	for (let i = 0; i < records.length; i++) {
		const record = records[i];
		// We make sure all added and removed nodes are cleared from the cache just
		// in case of any MutationObserver weirdness.
		for (let j = 0; j < record.addedNodes.length; j++) {
			clear(record.addedNodes[j], cache);
		}

		for (let j = 0; j < record.removedNodes.length; j++) {
			clear(record.removedNodes[j], cache);
		}

		let node = record.target;
		if (node === root) {
			invalidated = true;
			continue;
		} else if (!root.contains(node)) {
			clear(node, cache);
			continue;
		}

		for (; node !== root; node = node.parentNode!) {
			if (
				!cache.has(node) ||
				(node !== record.target &&
					node.nodeType === Node.ELEMENT_NODE &&
					(node as Element).hasAttribute("data-content"))
			) {
				break;
			}

			const info = cache.get(node);
			if (info) {
				info.flags &= ~IS_VALID;
			}

			invalidated = true;
		}
	}

	if (invalidated) {
		const info = cache.get(root);
		if (info) {
			info.flags &= ~IS_VALID;
		}
	}

	return invalidated;
}

/**
 * For a given parent node and node info cache, clear info for the node and all
 * child nodes from the cache.
 */
function clear(parent: Node, cache: NodeInfoCache): void {
	const walker = document.createTreeWalker(
		parent,
		NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
	);

	for (
		let node: Node | null = parent;
		node !== null;
		node = walker.nextNode()
	) {
		cache.delete(node);
	}
}

/***********************/
/*** Selection Logic ***/
/***********************/

export type SelectionDirection = "forward" | "backward" | "none";

/**
 * Properties which mirror the APIs provided by HTMLInputElements.
 */
export interface SelectionInfo {
	selectionStart: number;
	selectionEnd: number;
	selectionDirection: SelectionDirection;
}

// TODO: Move this somewhere?
function isCursorEqual(cursor1: Cursor, cursor2: Cursor): boolean {
	cursor1 = typeof cursor1 === "number" ? [cursor1, cursor1] : cursor1;
	cursor2 = typeof cursor2 === "number" ? [cursor2, cursor2] : cursor2;
	return cursor1[0] === cursor2[0] && cursor1[1] === cursor2[1];
}

/**
 * Finds the string index of a node and offset pair provided by a browser API
 * like window.getSelection() for a given root and cache.
 */
function indexAt(
	root: Element,
	cache: NodeInfoCache,
	node: Node | null,
	offset: number,
): number {
	if (node == null || !root.contains(node)) {
		return -1;
	}

	if (!cache.has(node)) {
		// If the node is not found in the cache but is contained in the root,
		// then it is probably the child of an element with a data-content
		// attribute.
		// TODO: Maybe a non-zero offset should put the index at the end of
		// the data-content node.
		offset = 0;
		while (!cache.has(node)) {
			node = node.parentNode!;
		}
	}

	let index: number;
	if (node.nodeType === Node.TEXT_NODE) {
		const info = cache.get(node)!;
		index = offset + info.offset;
		node = node.parentNode!;
	} else {
		if (offset <= 0) {
			index = 0;
		} else if (offset >= node.childNodes.length) {
			const info = cache.get(node)!;
			index = info.length;
			if (info.flags & APPENDS_NEWLINE) {
				index -= NEWLINE.length;
			}
		} else {
			let child: Node | null = node.childNodes[offset];
			while (child !== null && !cache.has(child)) {
				child = child.previousSibling;
			}

			if (child === null) {
				index = 0;
			} else {
				node = child;
				const info = cache.get(node)!;
				// If the offset references an element which prepends a newline
				// ("hello<div>world</div>"), we have to start from -1 because the
				// element’s info.offset will not account for the newline.
				index = info.flags & PREPENDS_NEWLINE ? -1 : 0;
			}
		}
	}

	for (; node !== root; node = node.parentNode!) {
		const info = cache.get(node)!;
		index += info.offset;
	}

	return index;
}

/**
 * Finds the node and offset pair to use with browser APIs like
 * selection.collapse() from a given string index.
 */
function nodeOffsetAt(
	root: Element,
	cache: NodeInfoCache,
	index: number,
): [Node | null, number] {
	const [node, offset] = findNodeOffset(root, cache, index);
	if (node && node.nodeName === "BR") {
		// Different browsers can have trouble when calling `selection.collapse()`
		// with a BR element, so we try to avoid returning them from this function.
		return nodeOffsetFromChild(node);
	}

	return [node, offset];
}

function findNodeOffset(
	root: Element,
	cache: NodeInfoCache,
	index: number,
): [Node | null, number] {
	if (index < 0) {
		return [null, 0];
	}

	const walker = document.createTreeWalker(
		root,
		NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
	);

	for (let node: Node | null = root; node !== null; ) {
		const info = cache.get(node);
		if (info == null) {
			return nodeOffsetFromChild(node, index > 0);
		} else if (info.flags & PREPENDS_NEWLINE) {
			index -= NEWLINE.length;
		}

		if (index === 0) {
			return [node, 0];
		} else if (index < 0) {
			// A newline has been prepended before this node
			const previousSibling = walker.previousSibling();
			if (!previousSibling) {
				throw new Error("Invalid state");
			}

			return [previousSibling, getNodeLength(previousSibling)];
		} else if (
			index === info.length &&
			(node.nodeType === Node.TEXT_NODE ||
				(node as Element).hasAttribute("data-content"))
		) {
			if (node.nodeType === Node.TEXT_NODE) {
				return [node, (node as Text).data.length];
			} else {
				return nodeOffsetFromChild(node, true);
			}
		} else if (index >= info.length) {
			index -= info.length;
			node = walker.nextSibling();
		} else {
			if (
				node.nodeType === Node.ELEMENT_NODE &&
				(node as Element).hasAttribute("data-content")
			) {
				return nodeOffsetFromChild(node, true);
			}

			const firstChild = walker.firstChild();
			if (firstChild === null) {
				const offset =
					node.nodeType === Node.TEXT_NODE ? index : index > 0 ? 1 : 0;
				return [node, offset];
			} else {
				node = firstChild;
			}
		}
	}

	const node = walker.currentNode;
	return [node, getNodeLength(node)];
}

function getNodeLength(node: Node) {
	if (node.nodeType === Node.TEXT_NODE) {
		return (node as Text).data.length;
	}

	return node.childNodes.length;
}

function nodeOffsetFromChild(
	node: Node,
	after: boolean = false,
): [Node | null, number] {
	const parentNode = node.parentNode;
	if (parentNode === null) {
		return [null, 0];
	}

	let offset = Array.from(parentNode.childNodes).indexOf(node as ChildNode);
	if (after) {
		offset++;
	}

	return [parentNode, offset];
}

function getCursor(root: Element, cache: NodeInfoCache): Cursor | undefined {
	const selection = document.getSelection();
	if (selection == null) {
		return undefined;
	}

	const focus = indexAt(
		root,
		cache,
		selection.focusNode,
		selection.focusOffset,
	);
	let anchor: number;
	if (selection.isCollapsed) {
		anchor = focus;
	} else {
		anchor = indexAt(root, cache, selection.anchorNode, selection.anchorOffset);
	}

	// TODO: simplify
	if (focus === -1) {
		if (anchor !== -1) {
			return anchor;
		}

		return;
	} else if (anchor === -1) {
		if (focus !== -1) {
			return focus;
		}

		return;
	} else if (focus === anchor) {
		return focus;
	}

	return [anchor, focus];
}

function selectionInfoFromCursor(cursor: Cursor): SelectionInfo {
	let selectionStart: number;
	let selectionEnd: number;
	let selectionDirection: SelectionDirection = "none";
	if (Array.isArray(cursor)) {
		selectionStart = Math.max(0, Math.min.apply(null, cursor));
		selectionEnd = Math.max(0, Math.max.apply(null, cursor));
		selectionDirection = cursor[0] <= cursor[1] ? "forward" : "backward";
	} else {
		selectionStart = selectionEnd = Math.max(0, cursor);
	}

	return {selectionStart, selectionEnd, selectionDirection};
}

// TODO: Make the internals work based on cursors.
function setSelectionRange(
	root: Element,
	cache: NodeInfoCache,
	value: string,
	selectionStart: number,
	selectionEnd: number,
	selectionDirection: SelectionDirection,
): void {
	const selection = document.getSelection();
	if (!selection) {
		return;
	}

	// We bound selection range to the length of value minus the trailing newline
	// because attempting to select after the first newline when there is only
	// one can cause the editable root to lose focus.
	const length = value.replace(/(\r|\n|\r\n)$/, "").length;
	selectionStart = selectionStart || 0;
	selectionEnd = selectionEnd || 0;
	selectionStart = Math.max(0, Math.min(selectionStart, length));
	selectionEnd = Math.max(0, Math.min(selectionEnd, length));
	if (selectionEnd < selectionStart) {
		selectionStart = selectionEnd;
	}

	let focusIndex: number;
	let anchorIndex: number;
	if (selectionDirection === "backward") {
		anchorIndex = selectionEnd;
		focusIndex = selectionStart;
	} else {
		anchorIndex = selectionStart;
		focusIndex = selectionEnd;
	}

	if (focusIndex === anchorIndex) {
		const [node, offset] = nodeOffsetAt(root, cache, focusIndex);
		selection.collapse(node, offset);
	} else {
		const [anchorNode, anchorOffset] = nodeOffsetAt(root, cache, anchorIndex);
		const [focusNode, focusOffset] = nodeOffsetAt(root, cache, focusIndex);
		if (anchorNode === null && focusNode === null) {
			selection.collapse(null);
		} else if (anchorNode === null) {
			selection.collapse(focusNode, focusOffset);
		} else if (focusNode === null) {
			selection.collapse(anchorNode, anchorOffset);
		} else {
			// TODO: This is not a method in IE. Do we care???
			selection.setBaseAndExtent(
				anchorNode,
				anchorOffset,
				focusNode,
				focusOffset,
			);
		}
	}
}

// TODO: Should this go in a separate module?
/*********************/
/*** History logic ***/
/*********************/
// TODO: add native undo
export type UndoMode = "none" | "keydown";

function cursorFromPatch(patch: Patch): Cursor {
	const operations = patch.operations();
	let index = 0;
	let start: number | undefined;
	let end: number | undefined;
	for (const op of operations) {
		switch (op.type) {
			case "delete": {
				if (start === undefined) {
					start = index;
				}

				break;
			}

			case "insert": {
				if (start === undefined) {
					start = index;
				}

				index += op.value.length;
				end = index;
				break;
			}

			case "retain": {
				index += op.end - op.start;
				break;
			}
		}
	}

	if (start !== undefined && end !== undefined) {
		return [start, end];
	} else if (start !== undefined) {
		return start;
	}

	return 0;
}

function isUndoKeyboardEvent(ev: KeyboardEvent): boolean {
	return (ev.metaKey || ev.ctrlKey) && !ev.shiftKey && ev.key === "z";
}

function isRedoKeyboardEvent(ev: KeyboardEvent): boolean {
	return (
		(ev.metaKey || ev.ctrlKey) &&
		((ev.shiftKey && ev.key === "z") ||
			(!ev.shiftKey && ev.key === "y" && !isMacPlatform()))
	);
}

// TODO: Figure out how to avoid this.
function isMacPlatform(): boolean {
	return window.navigator && /Mac/.test(window.navigator.platform);
}

// TODO: Should this be a Patch method?
function isNoop(patch: Patch): boolean {
	// TODO: Think about if the second part of this condition is actually necessary
	return patch.parts.length === 1 && typeof patch.parts[0] === "number";
}

// TODO: Should this be a Patch method?
function isComplex(patch: Patch): boolean {
	const operations = patch.operations();
	let count = 0;
	for (const op of operations) {
		if (op.type !== "retain") {
			count++;
			if (count > 1) {
				return true;
			}
		}
	}

	return false;
}

// TODO: Inline this stuff into the class?
// The thing I worry about is that if we expose this as its own thing, people
// would probably want this class to be evented, but custom EventTarget
// subclasses still don’t work in a lot of environments.
class PatchHistory {
	currentPatch: Patch | undefined;
	undoStack: Array<Patch>;
	redoStack: Array<Patch>;

	constructor() {
		this.currentPatch = undefined;
		this.undoStack = [];
		this.redoStack = [];
	}

	checkpoint(): void {
		if (this.currentPatch) {
			this.undoStack.push(this.currentPatch);
			this.currentPatch = undefined;
		}
	}

	push(patch: Patch): void {
		if (isNoop(patch)) {
			return;
		} else if (this.redoStack.length) {
			this.redoStack.length = 0;
		}

		if (this.currentPatch) {
			const oldPatch = this.currentPatch;
			if (!isComplex(oldPatch) && !isComplex(patch)) {
				this.currentPatch = oldPatch.compose(patch);
				return;
			} else {
				this.checkpoint();
			}
		}

		this.currentPatch = patch;
	}

	canUndo(): boolean {
		return !!(this.currentPatch || this.undoStack.length);
	}

	undo(): Patch | undefined {
		this.checkpoint();
		const patch = this.undoStack.pop();
		if (patch) {
			this.redoStack.push(patch);
			return patch.invert();
		}
	}

	canRedo(): boolean {
		return !!this.redoStack.length;
	}

	redo(): Patch | undefined {
		this.checkpoint();
		const patch = this.redoStack.pop();
		if (patch) {
			this.undoStack.push(patch);
			return patch;
		}
	}
}
