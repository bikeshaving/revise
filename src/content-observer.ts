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
 * A symbol property added to DOM nodes whose value is the content length of a
 * child node relative to its parent.
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

// TODO: Allow this class to observe multiple roots, or change this abstraction
// around so that it only works for a single root, more like traditional JS
// libraries which are passed a DOM node in the constructor.
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
			const contentOldValue = this._content || "";
			const cursorOldValue = this._cursor;
			const content = getContent(root);
			const cursor = cursorFromSelection(root, document.getSelection());
			this._content = content;
			this._cursor = cursor;
			const patch = Patch.diff(
				contentOldValue,
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
		getContent(root);
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

// TODO: Make this function work incrementally (with invalidate)
// TODO: Make this function return patches?
export function getContent(root: Node): string {
	const walker = document.createTreeWalker(
		root,
		NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
	);

	walker.currentNode = root;
	let content = "";
	let hasNewline = false;
	let offset = 0;
	const offsets: Array<number> = [];
	const seen = new Set<Node>();
	for (let node: Node | null = root; node !== null; ) {
		if (!seen.has(node)) {
			// eslint-disable-next-line no-constant-condition
			while (true) {
				node[ContentOffset] = offset;
				const newlineBefore = !hasNewline && offset && isBlocklikeElement(node);
				if (newlineBefore) {
					content += NEWLINE;
					hasNewline = true;
				}

				const firstChild = walker.firstChild();
				if (firstChild) {
					offsets.push(offset);
					offset = newlineBefore ? NEWLINE.length : 0;
					seen.add(node);
					node = firstChild;
				} else {
					break;
				}
			}
		}

		if (node.nodeType === Node.TEXT_NODE) {
			const content1 = (node as Text).data;
			content += content1;
			offset += content1.length;
			hasNewline = content1.endsWith(NEWLINE);
		} else if (node.nodeName === "BR") {
			content += NEWLINE;
			offset += NEWLINE.length;
			hasNewline = true;
		} else {
			if (
				!hasNewline &&
				isBlocklikeElement(node) &&
				(node === root || node.firstChild)
			) {
				content += NEWLINE;
				offset += NEWLINE.length;
				hasNewline = true;
			}
		}

		const length = offset - node[ContentOffset]!;
		node[ContentLength] = length;
		node = walker.nextSibling();
		if (node === null) {
			offset = offsets.pop()! + offset;
			node = walker.parentNode();
		}
	}

	return content;
}

/**
 * Given an observed root, and an array of mutation records, this function
 * invalidates nodes which have changed children by deleting the ContentLength
 * property.
 *
 * This function should be used in conjunction with the getPatch() function
 * below.
 */
function invalidate(root: Node, records: Array<MutationRecord>): void {
	let invalidated = false;
	for (let i = 0; i < records.length; i++) {
		const record = records[i];
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

	if (focus === anchor || focus === -1 || anchor === -1) {
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
		// Chrome seems to draw selections which point to a BR element incorrectly
		// when there are two adjacent BR elements and one has been deleted
		// backwards, so we force a redraw.
		const force =
			node &&
			node.nodeType === Node.ELEMENT_NODE &&
			node.childNodes[offset] &&
			node.childNodes[offset].nodeName === "BR";
		if (
			force ||
			selection.focusNode !== node ||
			selection.focusOffset !== offset
		) {
			selection.collapse(node, offset);
		}

		return;
	}

	const range = selection.getRangeAt(0);
	const [anchorNode, anchorOffset] = nodeOffsetFromIndex(root, anchor);
	if (anchorNode) {
		range.setStart(anchorNode, anchorOffset);
	}

	const [focusNode, focusOffset] = nodeOffsetFromIndex(root, focus);
	if (focusNode) {
		range.setEnd(focusNode, focusOffset);
	}
}
