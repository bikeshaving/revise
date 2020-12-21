// TODO: stop hardcoding this so we can have \r\n documents???
const NEWLINE = '\n';

/**
 * The length of the contents of a node. Only set on the root DOM node.
 */
export const ContentLength = Symbol.for('revise.ContentLength');

/**
 * The length of the contents of all nodes before this node, relative to the
 * parent.
 */
export const ContentOffset = Symbol.for('revise.ContentOffset');

declare global {
  interface Node {
    [ContentOffset]?: number | undefined;
    [ContentLength]?: number | undefined;
  }
}

// TODO: Mutations in non-contenteditable widgets should be ignored.
// TODO: Mutations in nested contenteditables should be ignored.
// TODO: Figure out how to limit the amount of work we need to do with
// getContent by actually reading mutation records themselves.
// TODO: Figure out what records we should emit.
// TODO: Integrate with an undo stack of some kind.
// TODO: Multiple targets.
export interface ContentRecord {
  target: Node;
  content: string;
  cursor: number;
}

export class ContentObserver {
  _target: Node | null;
  _mutationObserver: MutationObserver;
  constructor(callback: (record: ContentRecord) => unknown) {
    this._target = null;
    this._mutationObserver = new MutationObserver((records) => {
      const target = this._target!;
      const content = getContent(target);
      const selection = window.getSelection()!;
      const cursor = getIndexFromPosition(
        target,
        selection.focusNode,
        selection.focusOffset,
      );
      callback({ target, content, cursor });
    });
  }

  observe(target: Node) {
    this._target = target;
    getContent(target);
    this._mutationObserver.observe(target, {
      subtree: true,
      childList: true,
      characterData: true,
      characterDataOldValue: true,
    });
  }

  disconnect() {
    this._target = null;
    this._mutationObserver.disconnect();
  }
}

const NEWLINE_ELEMENTS = new Set([
  'ADDRESS',
  'ARTICLE',
  'ASIDE',
  'BLOCKQUOTE',
  'CAPTION',
  'DETAILS',
  'DIALOG',
  'DD',
  'DIV',
  'DL',
  'DT',
  'FIELDSET',
  'FIGCAPTION',
  'FIGURE',
  'FOOTER',
  'FORM',
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'HEADER',
  'HGROUP',
  'HR',
  'LI',
  'MAIN',
  'NAV',
  'OL',
  'P',
  'PRE',
  'SECTION',
  'TABLE',
  'TR',
  'UL',
]);

function isNewlineElement(node: Node): node is Element {
  return (
    node.nodeType === Node.ELEMENT_NODE && NEWLINE_ELEMENTS.has(node.nodeName)
  );
}

const walkers = new WeakMap<Node, TreeWalker>();
function getOrCreateWalker(node: Node): TreeWalker {
  let walker = walkers.get(node);
  if (!walker) {
    walker = document.createTreeWalker(
      node,
      NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
    );

    walkers.set(node, walker);
  }

  walker.currentNode = node;
  return walker;
}

function getContent(rootNode: Node): string {
  const walker = getOrCreateWalker(rootNode);
  let content = '';
  const seen = new Set<Node>([]);
  for (
    let currentNode: Node | null = walker.currentNode, hasNewline = false;
    currentNode !== null;
    currentNode = walker.nextSibling() || walker.parentNode()
  ) {
    for (
      ;
      currentNode.nodeType !== Node.TEXT_NODE && !seen.has(currentNode);
      currentNode = walker.currentNode
    ) {
      seen.add(currentNode);
      if (!hasNewline && content.length && isNewlineElement(currentNode)) {
        content += NEWLINE;
        hasNewline = true;
      }

      currentNode[ContentOffset] = content.length;
      if (walker.firstChild() === null) {
        break;
      }
    }

    if (currentNode.nodeType === Node.TEXT_NODE) {
      currentNode[ContentOffset] = content.length;
      const data = (currentNode as Text).data;
      content += data;
      hasNewline = data.endsWith(NEWLINE);
    } else if (currentNode.nodeName === 'BR') {
      content += NEWLINE;
      hasNewline = true;
    }

    if (!hasNewline && isNewlineElement(currentNode)) {
      content += NEWLINE;
      hasNewline = true;
    }
  }

  rootNode[ContentLength] = content.length;
  return content;
}

/**
 * Retrieves the next sibling of the current node, or the next sibling of the
 * current node’s parent. Will continue searching upwards until a next sibling
 * is found or we reached the root of the true.
 */
function getNextNode(rootNode: Node, node: Node): Node | null {
  const walker = getOrCreateWalker(rootNode);
  walker.currentNode = node;
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

type Cursor = [number, number] | number | null;

function getIndexFromPosition(
  rootNode: Node,
  node: Node | null,
  offset: number,
): number {
  if (
    node === null ||
    !rootNode.contains(node) ||
    typeof node[ContentOffset] === 'undefined'
  ) {
    return -1;
  } else if (node.nodeType === Node.TEXT_NODE) {
    return node[ContentOffset]! + offset;
  }

  if (offset >= node.childNodes.length) {
    // In Firefox, when inserting a soft newline, a BR element is inserted, the
    // selection node is set to the parent node of the BR, and the selection
    // offset is set to the length of the childNodes.
    const nextNode = getNextNode(rootNode, node);
    if (nextNode === null || typeof nextNode[ContentOffset] === 'undefined') {
      // TODO: return the length of the content
      return rootNode[ContentLength]!;
    }

    return nextNode[ContentOffset]!;
  } else if (offset < 0 || typeof node.childNodes[offset] === 'undefined') {
    return node[ContentOffset]!;
  }

  return node.childNodes[offset][ContentOffset]!;
}

function getNodeLength(node: Text | Element): number {
  return node.nodeType === Node.TEXT_NODE
    ? (node as Text).data.length
    : node.childNodes.length;
}

// TODO: Should this be exported???
export function getPositionFromIndex(
  rootNode: Node,
  index: number,
): [Node | null, number] {
  if (typeof rootNode[ContentLength] === 'undefined') {
    throw new Error('Unknown node');
  }

  if (index < 0 || index > rootNode[ContentLength]!) {
    return [null, 0];
  }

  const walker = getOrCreateWalker(rootNode);
  for (
    let currentNode = walker.firstChild();
    currentNode !== null;
    currentNode = walker.currentNode
  ) {
    const offset = currentNode[ContentOffset];
    if (offset === undefined) {
      throw new Error('Unknown node');
    } else if (index === offset) {
      if (currentNode.nodeName === 'BR') {
        // Firefox has trouble when selections reference BR elements.
        const previousSibling = walker.previousSibling();
        if (previousSibling === null || previousSibling.nodeName === 'BR') {
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
