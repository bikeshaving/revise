import {Patch} from "./patch";
// TODO: stop hardcoding this so we can have \r\n documents?
// Alternatively we can always default to \n documents.
const NEWLINE = "\n";

//TODO: Use a single symbol property?
/**
 * A symbol property added to DOM nodes whose value is the content offset of a
 * child node relative to its parent.
 */
export const ContentOffset = Symbol.for("revise.ContentOffset");

/**
 * A symbol property added to DOM nodes whose value is the content length of
 * its children.
 */
export const ContentLength = Symbol.for("revise.ContentLength");

declare global {
	interface Node {
		[ContentOffset]?: number | undefined;
		[ContentLength]?: number | undefined;
	}
}

// TODO: expose methods via a ContentController class.

// TODO: Mutations in non-contenteditable widgets should be ignored.
// TODO: Mutations in nested contenteditables should be ignored.
// TODO: Figure out how to limit the amount of work we need to do with
// getContent by actually reading mutation records themselves.
// TODO: Figure out what records we should emit.
// TODO: Integrate with an undo stack of some kind.
export interface ContentRecord {
	type: "content" | "cursor";
	root: Node;
	patch: Patch | null;
	content: string;
	contentOldValue: string | null;
	cursor: Cursor;
	cursorOldValue: Cursor | null;
}

// Maybe we can base this abstraction around the custom elements.
export class ContentObserver {
	_callback: (record: ContentRecord) => unknown;
	_root: Node | null;
	_content: string | null;
	_cursor: Cursor;
	_mutationObserver: MutationObserver;
	_onselectionchange: () => unknown;
	constructor(callback: (record: ContentRecord) => unknown) {
		this._root = null;
		this._content = null;
		this._cursor = -1;
		this._callback = callback;
		this._mutationObserver = new MutationObserver((records) => {
			const root = this._root;
			if (!root) {
				return;
			}

			invalidate(root, records);
			const contentOldValue = this._content || null;
			const cursorOldValue = this._cursor;
			const content = getContent(root, contentOldValue || "");
			const cursor = cursorFromSelection(root, document.getSelection());
			this._content = content;
			this._cursor = cursor;
			const patch = Patch.diff(
				contentOldValue || "",
				content,
				Math.min(...[cursorOldValue, cursor].flat()),
			);
			this._callback({
				type: "content",
				root,
				patch,
				content,
				contentOldValue,
				cursor,
				cursorOldValue,
			});
		});

		// TODO: Don’t call the constructor callback if the selection has not changed.
		this._onselectionchange = () => {
			// We have to execute this code in a microtask callback or
			// contenteditables become uneditable in Safari.
			// (but only when the console is closed???)
			queueMicrotask(() => {
				const root = this._root;
				if (!root) {
					return;
				}

				const cursor = cursorFromSelection(root, document.getSelection());
				this._cursor = cursor;
				this._callback({
					type: "cursor",
					root,
					patch: null,
					content: this._content!,
					contentOldValue: null,
					cursor,
					cursorOldValue: null,
				});
			});
		};
	}

	// TODO: Pass in intended content to observe so we can get an initial diff?
	observe(root: Node) {
		this._content = getContent(root);
		this._mutationObserver.observe(root, {
			subtree: true,
			childList: true,
			characterData: true,
			// TODO: We need to listen to attribute changes for widgets.
		});
		document.addEventListener("selectionchange", this._onselectionchange);
		this._root = root;
	}

	disconnect() {
		this._root = null;
		this._content = null;
		this._cursor = -1;
		this._mutationObserver.disconnect();
		// TODO: only remove the event listener if all roots are disconnected.
		document.removeEventListener("selectionchange", this._onselectionchange);
	}

	repair(callback: Function): void {
		const root = this._root;
		if (!root) {
			return;
		}

		const selection = document.getSelection();
		const cursor = cursorFromSelection(root, selection);
		callback();
		invalidate(root, this._mutationObserver.takeRecords());
		getContent(root, this._content || undefined);
		setSelection(selection, root, cursor);
	}
}

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

function isBlocklikeElement(node: Node): node is Element {
	return (
		node.nodeType === Node.ELEMENT_NODE && BLOCKLIKE_ELEMENTS.has(node.nodeName)
	);
}

// TODO: Make this function return a Patch instead of string?
export function getContent(root: Node, contentOldValue?: string): string {
	if (contentOldValue && typeof root[ContentLength] !== "undefined") {
		if (contentOldValue.length !== root[ContentLength]) {
			throw new Error("Length mismatch");
		}

		return contentOldValue;
	}

	const walker = document.createTreeWalker(
		root,
		NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
	);
	let content = "";
	let hasNewline = false;
	let oi = 0; // old index
	let oiRelative = 0;
	const oiRelatives: Array<number> = [];
	const offsets: Array<number> = [];
	let offset = 0;
	const seen = new Set<Node>();
	for (let node: Node | null = root; node !== null; ) {
		if (!seen.has(node)) {
			while (!contentOldValue || typeof node[ContentLength] === "undefined") {
				node[ContentOffset] = offset;
				const newlineBefore = !hasNewline && offset && isBlocklikeElement(node);
				if (newlineBefore) {
					content += NEWLINE;
					hasNewline = true;
					oi += NEWLINE.length;
				}

				const firstChild = walker.firstChild();
				if (firstChild) {
					offsets.push(offset);
					oiRelatives.push(oiRelative);
					oiRelative = oi;

					if (newlineBefore) {
						offset = NEWLINE.length;
					} else {
						offset = 0;
					}

					seen.add(node);
					node = firstChild;
				} else {
					break;
				}
			}
		}

		if (contentOldValue && typeof node[ContentLength] !== "undefined") {
			const offset1 = oi - oiRelative;
			if (offset1 < node[ContentOffset]!) {
				oi += node[ContentOffset]! - offset1;
			}

			node[ContentOffset] = offset;
			const content1 = contentOldValue.slice(oi, oi + node[ContentLength]!);
			content += content1;
			offset += content1.length;
			hasNewline = content1.endsWith(NEWLINE);
			oi += node[ContentLength]!;
		} else {
			if (node.nodeType === Node.TEXT_NODE) {
				const content1 = (node as Text).data;
				content += content1;
				offset += content1.length;
				hasNewline = content1.endsWith(NEWLINE);
			} else if (node.nodeName === "BR") {
				content += NEWLINE;
				offset += NEWLINE.length;
				hasNewline = true;
			} else if (
				!hasNewline &&
				isBlocklikeElement(node) &&
				(node === root || node.firstChild)
			) {
				content += NEWLINE;
				offset += NEWLINE.length;
				hasNewline = true;
			}

			const length = offset - (node[ContentOffset] || 0);
			node[ContentLength] = length;
		}

		const nextSibling = walker.nextSibling();
		if (nextSibling === null && walker.currentNode !== root) {
			const offset1 = offsets.pop()!;
			oiRelative = oiRelatives.pop()!;
			if (offset1 === undefined || oiRelative === undefined) {
				throw new Error("Missing offset");
			}

			offset = offset1 + offset;
			node = walker.parentNode();
		} else {
			node = nextSibling;
		}
	}

	return content;
}

// TODO: Is it necessary to clean nodes recursively?
function clean(root: Node) {
	const walker = document.createTreeWalker(
		root,
		NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
	);
	for (let node: Node | null = root; node !== null; node = walker.nextNode()) {
		node[ContentOffset] = undefined;
		node[ContentLength] = undefined;
	}
}

/**
 * Given an observed root, and an array of mutation records, this function
 * invalidates nodes which have changed by deleting the ContentOffset and
 * ContentLength properties from them.
 */
export function invalidate(root: Node, records: Array<MutationRecord>): void {
	let invalidated = false;
	for (let i = 0; i < records.length; i++) {
		const record = records[i];
		for (let j = 0; j < record.addedNodes.length; j++) {
			clean(record.addedNodes[j]);
		}

		for (let j = 0; j < record.removedNodes.length; j++) {
			clean(record.removedNodes[j]);
		}

		let node = record.target;
		// TODO: handle non-contenteditable widgets
		if (node === root) {
			invalidated = true;
			continue;
		} else if (
			typeof node[ContentLength] === "undefined" ||
			!root.contains(node)
		) {
			continue;
		}

		for (; node !== root; node = node.parentNode!) {
			if (typeof node[ContentLength] === "undefined") {
				break;
			}

			node[ContentLength] = undefined;
			node[ContentOffset] = undefined;
			invalidated = true;
		}
	}

	if (invalidated) {
		root[ContentLength] = undefined;
		root[ContentOffset] = undefined;
	}
}

export type NodeOffset = [Node | null, number];

export type Cursor = [number, number] | number;

// TODO: Should we be exporting this???
export function indexFromNodeOffset(
	root: Node,
	node: Node | null,
	offset: number,
): number {
	if (
		node == null ||
		!root.contains(node) ||
		typeof node[ContentLength] === "undefined"
	) {
		return -1;
	}

	let index = offset;
	if (node.nodeType === Node.ELEMENT_NODE) {
		if (offset >= node.childNodes.length) {
			index = node[ContentLength] || 0;
		} else {
			node = node.childNodes[offset];
			index = 0;
		}
	}

	const walker = document.createTreeWalker(
		root,
		NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
	);
	walker.currentNode = node;

	while (node !== null && node !== root) {
		const previousSibling = walker.previousSibling();
		if (previousSibling === null) {
			const parentNode = walker.parentNode();
			if (parentNode) {
				index += node[ContentOffset] || 0;
			}

			node = parentNode;
		} else {
			node = previousSibling;
			index += node[ContentLength] || 0;
		}
	}

	return index;
}

export function cursorFromSelection(
	root: Node,
	selection: Selection | null,
): Cursor {
	if (selection == null) {
		return -1;
	}

	const focus = indexFromNodeOffset(
		root,
		selection.focusNode,
		selection.focusOffset,
	);

	let anchor: number;
	if (selection.isCollapsed) {
		anchor = focus;
	} else {
		anchor = indexFromNodeOffset(
			root,
			selection.anchorNode,
			selection.anchorOffset,
		);
	}

	if (focus === -1) {
		return anchor;
	} else if (anchor === -1 || focus === anchor) {
		return focus;
	}

	return [anchor, focus];
}

function createParentNodeOffset(node: Node): [Node, number] {
	const parentNode = node.parentNode;
	if (parentNode === null) {
		throw new Error("Node has no parent");
	}

	const offset = Array.from(parentNode.childNodes).indexOf(node as ChildNode);
	return [parentNode, offset];
}

function findSuccessorNode(walker: TreeWalker): Node | null {
	let node: Node | null = walker.currentNode;
	while (node !== null) {
		node = walker.nextSibling();
		if (node === null) {
			node = walker.parentNode();
		} else {
			return node;
		}
	}

	return null;
}

export function nodeOffsetFromIndex(root: Node, index: number): NodeOffset {
	if (index < 0) {
		return [null, 0];
	}

	const walker = document.createTreeWalker(
		root,
		NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
	);
	let node: Node | null = root;
	walker.currentNode = node;
	let offset = index;
	while (node !== null) {
		const length = node[ContentLength] || 0;
		if (offset <= length) {
			if (node.nodeType === Node.TEXT_NODE) {
				return [node, offset];
			}

			const firstChild = walker.firstChild();
			if (firstChild) {
				offset -= firstChild[ContentOffset] || 0;
				node = firstChild;
			} else if (offset > 0) {
				const successor = findSuccessorNode(walker);
				if (successor) {
					if (successor.nodeName === "BR") {
						return createParentNodeOffset(successor);
					}

					return [successor, 0];
				} else {
					break;
				}
			} else if (node.nodeName === "BR") {
				return createParentNodeOffset(node);
			} else {
				return [node, 0];
			}
		} else {
			offset -= length;
			const nextSibling = walker.nextSibling();
			if (nextSibling) {
				node = nextSibling;
			} else {
				const successor = findSuccessorNode(walker);
				if (successor) {
					if (successor.nodeName === "BR") {
						return createParentNodeOffset(successor);
					}

					return [successor, 0];
				} else {
					break;
				}
			}
		}
	}

	return [
		root,
		root.nodeType === Node.TEXT_NODE
			? (root as Text).data.length
			: root.childNodes.length,
	];
}

export function setSelection(
	selection: Selection | null,
	root: Node,
	cursor: Cursor,
): void {
	if (!selection) {
		return;
	}

	const anchor = typeof cursor === "number" ? cursor : cursor[0];
	const focus = typeof cursor === "number" ? cursor : cursor[1];
	if (anchor === focus) {
		const [node, offset] = nodeOffsetFromIndex(root, focus);
		if (
			// Chrome seems to draw selections which point to a BR element incorrectly
			// when there are two adjacent BR elements and one has been deleted
			// backwards, so we force a redraw.
			(node &&
				node.nodeType === Node.ELEMENT_NODE &&
				node.childNodes[offset] &&
				node.childNodes[offset].nodeName === "BR") ||
			selection.focusNode !== node ||
			selection.focusOffset !== offset
		) {
			selection.collapse(node, offset);
		}

		return;
	}

	const [anchorNode, anchorOffset] = nodeOffsetFromIndex(root, anchor);
	const [focusNode, focusOffset] = nodeOffsetFromIndex(root, focus);
	if (anchorNode === null && focusNode === null) {
		selection.collapse(null);
	} else if (anchorNode === null) {
		selection.collapse(focusNode, focusOffset);
	} else if (focusNode === null) {
		selection.collapse(anchorNode, anchorOffset);
	} else {
		const range = selection.getRangeAt(0);
		range.setStart(focusNode, focusOffset);
		range.setEnd(anchorNode, anchorOffset);
	}
}
