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
import {ContentObserver, getPositionFromIndex} from '@bikeshaving/revise/content-observer.js';

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

function* Editable(this: Context, { children }: any) {
  let content = '\n';
  let cursor = -1;
  let el: any;
  const observer = new ContentObserver(
    ({ content: content1, cursor: cursor1 }) => {
      if (content === content1) {
        const selection = window.getSelection();
        if (selection) {
          const [node, offset] = getPositionFromIndex(el, cursor);
          if (
            selection.focusNode !== node || selection.focusOffset !== offset
          ) {
            // TODO: This triggers a layout shift. We should do it in a requestAnimationFrame callback or something.
            selection.collapse(node, offset);
          }
        }
      } else {
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

  let initial = true;
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
        </div>
      );

      initial = false;
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
