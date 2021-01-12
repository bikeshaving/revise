// TODO: stop hardcoding this so we can have \r\n documents???
const NEWLINE = "\n";

//TODO: Use a single symbol property.

/**
 * A symbol property added to the root node which is being observed. It is set
 * to the string content of the entire DOM node.
 *
 * Maybe this can be set to some kind of controller object instead.
 */
export const Content = Symbol.for("revise.Content");

/**
 * A symbol property added to every Text and Element node of the DOM tree which
 * is being observed. It is set to the length of the contents of all nodes
 * before this node, and is used to identify the positions of selections and
 * edits in the tree.
 */
export const ContentOffset = Symbol.for("revise.ContentOffset");

export const ContentLength = Symbol.for("revise.ContentLength");

declare global {
	interface Node {
		[Content]?: string | undefined;
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
	type: string;
	root: Node;
	content: string;
	cursor: Cursor;
}

// TODO: Multiple targets.
export class ContentObserver {
	_root: Node | null;
	_mutationObserver: MutationObserver;
	_onselectionchange: () => unknown;
	constructor(callback: (record: ContentRecord) => unknown) {
		this._root = null;
		this._mutationObserver = new MutationObserver((/* records */) => {
			const root = this._root;
			if (!root) {
				return;
			}

			// TODO: Use invalidate and patches as opposed to reading the entire tree.
			// invalidate(root, records);
			// const patch = getPatch(root);
			const content = getContent(root);
			const selection = window.getSelection()!;
			const cursor = cursorFromSelection(root, selection);
			callback({
				type: "mutation",
				root,
				content,
				cursor,
			});
		});

		this._onselectionchange = () => {
			const root = this._root;
			if (!root) {
				return;
			}

			const selection = document.getSelection();
			const cursor = cursorFromSelection(root, selection);
			if (cursor === -1) {
				return;
			}

			callback({
				type: "selectionchange",
				root,
				content: root[Content]!,
				cursor,
			});
		};
	}

	// TODO: Pass in intended content to observe so we can get an initial diff?
	observe(root: Node) {
		this._root = root;
		// Marking the offset/lengths of the root
		getContent(root);
		this._mutationObserver.observe(root, {
			subtree: true,
			childList: true,
			characterData: true,
			characterDataOldValue: true,
			// TODO: We need to listen to attribute changes for widgets.
		});
		document.addEventListener("selectionchange", this._onselectionchange);
	}

	disconnect() {
		this._root = null;
		this._mutationObserver.disconnect();
		// TODO: only remove the event listener if all roots are disconnected.
		document.removeEventListener("selectionchange", this._onselectionchange);
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

const NOOP = () => {};

function walk(
	root: Node,
	{
		whatToShow = NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
		pre = NOOP,
		post = NOOP,
		start,
	}: {
		whatToShow?: number;
		pre?: (node: Node) => unknown;
		post?: (node: Node) => unknown;
		start?: Node | null;
	},
): void {
	const walker = document.createTreeWalker(root, whatToShow);
	const seen = new Set<Node>();
	next: for (
		let currentNode: Node | null = start || walker.currentNode;
		currentNode !== null;
		currentNode = walker.nextSibling() || walker.parentNode()
	) {
		if (!seen.has(currentNode)) {
			let firstChild: Node | null;
			// eslint-disable-next-line no-constant-condition
			while (true) {
				if (pre(currentNode)) {
					continue next;
				}

				firstChild = walker.firstChild();
				if (firstChild) {
					seen.add(currentNode);
					currentNode = firstChild;
				} else {
					break;
				}
			}
		}

		if (post(currentNode)) {
			break;
		}
	}
}

export function getContent(root: Node): string {
	let hasNewline = false,
		content = "",
		offset = 0;
	walk(root, {
		pre(node) {
			if (node !== root && typeof node[Content] !== "undefined") {
				throw new Error("Cannot observe nodes within a content observer");
			}

			node[ContentOffset] = offset;
			if (!hasNewline && offset && isBlocklikeElement(node)) {
				hasNewline = true;
				content += NEWLINE;
				offset += NEWLINE.length;
			}
		},
		post(node) {
			if (node.nodeName === "BR") {
				hasNewline = true;
				content += NEWLINE;
				offset += NEWLINE.length;
			} else if (node.nodeType === Node.TEXT_NODE) {
				const content1 = (node as Text).data;
				hasNewline = content1.endsWith(NEWLINE);
				content += content1;
				offset += content1.length;
			} else if (
				!hasNewline &&
				isBlocklikeElement(node) &&
				// TODO: We check that the any block-like elements that aren’t the root
				// have at least one child, to deal with empty divs and such, but I am
				// not sure about this logic. For instance, empty divs non-zero heights
				// seem to record as a newline according to content-editable algorithms.
				(node === root || node.firstChild)
			) {
				hasNewline = true;
				content += NEWLINE;
				offset += NEWLINE.length;
			}

			node[ContentLength] = offset - node[ContentOffset]!;
		},
	});

	root[Content] = content;
	return content;
}

// TODO: uncomment
///**
// * Given an observed root, and an array of mutation records, this function
// * invalidates nodes which have changed children by deleting the ContentLength
// * property.
// *
// * This function should be used in conjunction with the getPatch() function
// * below.
// */
//function invalidate(root: Node, records: Array<MutationRecord>): void {
//	let invalidated = false;
//	for (let i = 0; i < records.length; i++) {
//		const record = records[i];
//		let target = record.target;
//		// TODO: handle non-contenteditable widgets
//		if (target === root) {
//			invalidated = true;
//			continue;
//		} else if (
//			typeof target[ContentLength] === "undefined" ||
//			!root.contains(target)
//		) {
//			continue;
//		}
//
//		for (; target !== root; target = target.parentNode!) {
//			if (typeof target[ContentLength] === "undefined") {
//				break;
//			}
//
//			target[ContentLength] = undefined;
//			invalidated = true;
//		}
//	}
//
//	if (invalidated) {
//		root[ContentLength] = undefined;
//	}
//}
//
///**
// * TODO: THIS FUNCTION DOES NOT WORK. This function has a 5-star difficulty
// * rating. Attempt at your peril, Brian.
// *
// * Given an observed root node whose elements have invalidated or unassigned
// * ContentLength properties, create a patch.
// */
//export function getPatch(root: Node): Patch {
//	const content = root[Content];
//	if (!content) {
//		throw new Error("Unknown root");
//	}
//
//	let hasNewline = false, inserted = "", offset = 0;
//	const invalidated: Array<any> = [];
//	const insertSizes: Array<number> = [];
//	const deleteSizes: Array<number> = [];
//	walk(root, {
//		pre(node) {
//			if (node !== root && typeof node[Content] !== "undefined") {
//				throw new Error("Cannot observe nodes within a content observer");
//			}
//
//			if (typeof node[ContentOffset] === "number") {
//				// TODO: DO WE NEED Math.abs HERE?
//				//const missing = Math.abs(offset - node[ContentOffset]!);
//				const missing = offset - node[ContentOffset]!;
//				if (missing > 0) {
//					console.log(node, offset, node[ContentOffset]);
//				}
//
//				Subseq.pushSegment(deleteSizes, missing, true);
//				Subseq.pushSegment(insertSizes, missing, false);
//			}
//
//			node[ContentOffset] = offset;
//			if (typeof node[ContentLength] === "number") {
//				const length = node[ContentLength]!;
//				Subseq.pushSegment(deleteSizes, length, false);
//				Subseq.pushSegment(insertSizes, length, false);
//				offset += length;
//				return true; // Skip descending into this node
//			} else if (!hasNewline && offset && isBlocklikeElement(node)) {
//				offset += NEWLINE.length;
//			}
//		},
//		post(node) {
//			invalidated.push(node);
//			if (node.nodeName === "BR") {
//				hasNewline = true;
//				inserted += NEWLINE;
//				offset += NEWLINE.length;
//			} else if (node.nodeType === Node.TEXT_NODE) {
//				const content1 = (node as Text).data;
//				hasNewline = content1.endsWith(NEWLINE);
//				inserted += content1;
//				offset += content1.length;
//			} else if (
//				!hasNewline &&
//				isBlocklikeElement(node) &&
//				// TODO: We check that the any block-like elements that aren’t the root
//				// have at least one child, to deal with empty divs and such, but I am
//				// not sure about this logic. For instance, empty divs non-zero heights
//				// seem to record as a newline according to content-editable algorithms.
//				node.firstChild
//			) {
//				hasNewline = true;
//				inserted += NEWLINE;
//				offset += NEWLINE.length;
//			}
//
//			const length = offset - node[ContentOffset]!;
//			// TODO: This is wrong, probably.
//			Subseq.pushSegment(deleteSizes, length, false);
//			Subseq.pushSegment(insertSizes, length, true);
//			node[ContentLength] = length;
//		},
//	});
//
//	if (
//		typeof root[ContentLength] === "number" &&
//		!hasNewline &&
//		isBlocklikeElement(root)
//	) {
//		hasNewline = true;
//		inserted += NEWLINE;
//		offset += NEWLINE.length;
//		if (root.nodeType === Node.ELEMENT_NODE) {
//			(root as Element).setAttribute("content-length", root[ContentLength]!.toString());
//		}
//	}
//
//	root[Content] = content;
//	return Patch.synthesize(new Subseq([]), "", new Subseq([]));
//}

/**
 * Retrieves the next sibling of the current node, or the next sibling of the
 * current node’s parent. Will continue searching upwards until a next sibling
 * is found or we reached the root of the true.
 */
function getNextNode(root: Node, node: Node): Node | null {
	const walker = document.createTreeWalker(
		root,
		NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
	);
	for (let currentNode: Node | null = node; currentNode !== null; ) {
		currentNode = walker.nextSibling();
		if (currentNode === null) {
			currentNode = walker.parentNode();
		} else {
			return currentNode;
		}
	}

	return null;
}

export type NodeOffset = [Node | null, number];

// TODO: Should we use null when the editable is not focused, or should we use -1?
// TODO: Should we allow descending ranges for cursors? ([5, 0] to indicate a
// selection whose focus node and offset appear before the anchor node and
// offset).
export type Cursor = [number, number] | number;

// TODO: Should we be exporting this???
export function indexFromNodeOffset(
	root: Node,
	node: Node | null,
	offset: number,
): number {
	if (
		node === null ||
		!root.contains(node) ||
		typeof node[ContentOffset] === "undefined"
	) {
		return -1;
	} else if (node.nodeType === Node.TEXT_NODE) {
		return node[ContentOffset]! + offset;
	}

	if (offset >= node.childNodes.length) {
		// In Firefox, when inserting a soft newline, a BR element is inserted, the
		// selection node is set to the parent node of the BR, and the selection
		// offset is set to the length of the childNodes.
		const nextNode = getNextNode(root, node);
		if (nextNode === null || typeof nextNode[ContentOffset] === "undefined") {
			// TODO: return the length of the content
			return root[Content]!.length;
		}

		return nextNode[ContentOffset]!;
	} else if (offset < 0 || typeof node.childNodes[offset] === "undefined") {
		return node[ContentOffset]!;
	}

	return node.childNodes[offset][ContentOffset]!;
}

function getNodeLength(node: Node): number {
	return node.nodeType === Node.TEXT_NODE
		? (node as Text).data.length
		: node.childNodes.length;
}

// TODO: Figure out how this function should be called and exported.
export function nodeOffsetFromIndex(root: Node, index: number): NodeOffset {
	if (typeof root[Content] === "undefined") {
		throw new Error("Unknown node");
	}

	if (index < 0 || index > root[Content]!.length) {
		return [null, 0];
	}

	const walker = document.createTreeWalker(
		root,
		NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
	);

	for (
		let currentNode = walker.firstChild();
		currentNode !== null;
		currentNode = walker.currentNode
	) {
		const offset = currentNode[ContentOffset];
		if (offset === undefined) {
			throw new Error("Unknown node");
		} else if (index === offset) {
			if (currentNode.nodeName === "BR") {
				// Firefox has trouble when selections reference BR elements.
				const previousSibling = walker.previousSibling();
				if (previousSibling === null || previousSibling.nodeName === "BR") {
					const parentNode = currentNode.parentNode!;
					const offset = Array.from(parentNode.childNodes).indexOf(
						currentNode as ChildNode,
					);
					return [parentNode, offset];
				}

				return [
					previousSibling,
					getNodeLength(previousSibling as Text | Element),
				];
			}

			return [currentNode, 0];
		} else if (index < offset) {
			const previousSibling = walker.previousSibling();
			if (previousSibling === null) {
				return [walker.parentNode(), 0];
			} else if (previousSibling.nodeType === Node.TEXT_NODE) {
				const offset1 = index - previousSibling[ContentOffset]!;
				return [previousSibling, offset1];
			} else if (walker.firstChild() === null) {
				return [
					previousSibling,
					getNodeLength(previousSibling as Text | Element),
				];
			}
		} else if (walker.nextSibling() === null) {
			if (currentNode.nodeType === Node.TEXT_NODE) {
				return [
					currentNode,
					Math.min(index - offset, getNodeLength(currentNode as Text)),
				];
			} else if (walker.firstChild() === null) {
				return [currentNode, getNodeLength(currentNode as Text | Element)];
			}
		}
	}

	return [null, 0];
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

	const anchor = indexFromNodeOffset(
		root,
		selection.anchorNode,
		selection.anchorOffset,
	);

	if (focus === anchor || focus === -1 || anchor === -1) {
		return focus;
	}

	return [anchor, focus];
}

export function setSelection(
	selection: Selection,
	root: Node,
	cursor: Cursor,
): void {
	const anchor = typeof cursor === "number" ? cursor : cursor[0];
	const focus = typeof cursor === "number" ? cursor : cursor[1];
	if (anchor === focus) {
		const [node, offset] = nodeOffsetFromIndex(root, focus);
		if (selection.focusNode !== node || selection.focusOffset !== offset) {
			selection.collapse(node, offset);
		}

		return;
	}

	const range = selection.getRangeAt(0);
	const [anchorNode, anchorOffset] = nodeOffsetFromIndex(root, anchor);
	const [focusNode, focusOffset] = nodeOffsetFromIndex(root, focus);
	if (anchorNode) {
		range.setStart(anchorNode, anchorOffset);
	}

	if (focusNode) {
		range.setEnd(focusNode, focusOffset);
	}
}
