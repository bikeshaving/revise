import type { Child, Children, Context } from '@bikeshaving/crank/crank.js';
import { Copy, createElement, Fragment, Raw } from '@bikeshaving/crank/crank.js';
import { renderer } from '@bikeshaving/crank/dom.js';
import Prism from 'prismjs';
import 'prismjs/components/prism-typescript';
import type { Token } from 'prismjs';
// @ts-ignore
Prism.manual = true;
import { splitLines } from './prism-utils';
import 'prismjs/themes/prism-tomorrow.css';
import './index.css';
import type {Cursor} from '@bikeshaving/revise/content-observer.js';
import {
  ContentObserver,
  indexFromNodeOffset,
  nodeOffsetFromIndex,
  setSelection,
} from '@bikeshaving/revise/content-observer.js';
import {Patch} from '@bikeshaving/revise/patch.js';

// TODO: Pass in old lines and mutate that array rather than creating a new one.
function getLines(content: string): Array<Child> {
  const lines = content.split(/\r\n|\r|\n/);
  if (/\r\n|\r|\n$/.test(content)) {
    lines.pop();
  }

  //return content;
  // We’re using these return values to test different rendering strategies.
  //return lines.flatMap((line) => [line, <br />]);
  //return lines.flatMap((line) => [<span>{line}</span>, <br />]);
  //return lines.flatMap((line) =>
  //	line ? [<span>{line}</span>, <br />] : <br />,
  //);
  //return lines.flatMap((line) => line ? [Array.from(line).map((char) => <span>{char}</span>), <br />] : <br />);
  // This is the most well-behaved way to divide lines.
  return lines.map((line) => <div>{line || <br />}</div>);
  //return lines.map((line) => <div>{line || "\n"}</div>);
  //return lines.map((line) => <div>{line}<br /></div>);
  //return lines.map((line) => <div>{line}{"\n"}</div>);
}

function printTokens(tokens: Array<Token | string>): Array<Child> {
  const result: Array<Child> = [];
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (typeof token === 'string') {
      result.push(token);
    } else {
      const children = Array.isArray(token.content)
        ? printTokens(token.content)
        : token.content;
      result.push(<span class={'token ' + token.type}>{children}</span>);
    }
  }

  return result;
}

function printLines(lines: Array<Array<Token | string>>): Array<Child> {
  return lines.map((line) => (
    <div class="token line">
      <code>{line.length ? printTokens(line) : <br />}</code>
    </div>
  ));
}

function parse(content: string): Array<Child> {
  const lines = splitLines(Prism.tokenize(content, Prism.languages.typescript));
  return printLines(lines);
}

/**
 * Get the length of the common prefix of two strings.
 */
function commonPrefixLength(text1: string, text2: string) {
  const min = Math.min(text1.length, text2.length);
  for (let l = 0; l < min; l++) {
    if (text1[l] !== text2[l]) {
      return l;
    }
  }
  return min;
}

/**
 * Get the length of the common suffix of two strings.
 */
function commonSuffixLength(text1: string, text2: string) {
  const min = Math.min(text1.length, text2.length);
  for (let l = 0, l1 = text1.length - 1, l2 = text2.length - 1; l < min; l++) {
    if (text1[l1 - l] !== text2[l2 - l]) {
      return l;
    }
  }

  return min;
}

// TODO: this should be a method of last resort when no cursor is available.
function diff(text1: string, text2: string): Patch {
  let prefix = commonPrefixLength(text1, text2);
  let suffix = commonSuffixLength(text1, text2);
  // We recompute prefix/suffix against sliced strings because there might be
  // overlap in the case of edits to strings with repeated characters.
  //
  // TODO: Maybe we should bias towards the end in this case?
  if (prefix < suffix) {
    prefix = commonPrefixLength(
      text1.slice(0, text1.length - suffix),
      text2.slice(0, text2.length - suffix),
    );
  } else {
    suffix = commonSuffixLength(
      text1.slice(prefix),
      text2.slice(prefix),
    );
  }

  return Patch.build(
    text1,
    text2.slice(prefix, text2.length - suffix),
    prefix,
    text1.length - suffix,
  );
}

function* Editable(this: Context, { children }: any) {
  let content = '\n';
  let cursor: Cursor = -1;
  let el: any;
  const observer = new ContentObserver(
    ({ type, content: content1, cursor: cursor1 }) => {
      if (type === "selectionchange") {
        cursor = cursor1;
        return;
      }

      if (content === content1) {
        // TODO: Maybe the ContentObserver could provide a method to do this.
        const selection = document.getSelection();
        if (selection) {
          setSelection(selection, el, cursor);
        }
      } else {
        const patch = diff(content, content1);
        console.log(patch.parts, [patch.deleted]);
        content = content1;
        cursor = cursor1;
      }

      this.refresh();
    },
  );

  this.schedule(() => {
    observer.observe(el!);
    this.refresh();
  });

  try {
    for ({} of this) {
      //yield (
      //  <div class="editor">
      //    <pre
      //      crank-ref={(el1: Node) => (el = el1)}
      //      class="language-js"
      //      contenteditable="true"
      //      spellcheck={false}
      //    >
      //      <span />
      //      {parse(content)}
      //    </pre>
      //  </div>
      //);
      yield (
        <div class="editor">
          <div
            crank-ref={(el1: Node) => (el = el1)}
            contenteditable="true"
            spellcheck={false}
          >{getLines(content)}</div>
          <pre>{el && el.innerHTML}</pre>
          <pre>{JSON.stringify(content)}</pre>
        </div>
      );
    }
  } finally {
    observer.disconnect();
  }
}

function App() {
  return (
    <div class="app">
      <Editable />
    </div>
  );
}

renderer.render(<App />, document.getElementById('root')!);
