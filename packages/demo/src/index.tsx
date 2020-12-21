import type { Child, Children, Context } from '@bikeshaving/crank/crank.js';
import { Copy, createElement, Raw } from '@bikeshaving/crank/crank.js';
import { renderer } from '@bikeshaving/crank/dom.js';
import Prism from 'prismjs';
import 'prismjs/components/prism-typescript';
import type { Token } from 'prismjs';
// @ts-ignore
Prism.manual = true;
import { splitLines } from './prism-utils';
import 'prismjs/themes/prism-tomorrow.css';
import './index.css';
import {ContentObserver, getPositionFromIndex} from './content-observer';

function getChildren(content: string): Children {
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
          selection.collapse(node, offset);
        }
      } else {
        content = content1;
        cursor = cursor1;
        document.execCommand('undo');
        this.refresh();
      }
    },
  );

  this.schedule((el1: Element) => {
    el = el1;
    observer.observe(el);
  });

  try {
    for ({} of this) {
      yield (
        <div class="editor">
          <pre class="editor language-js" contenteditable="true">
            {parse(content)}
          </pre>
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
