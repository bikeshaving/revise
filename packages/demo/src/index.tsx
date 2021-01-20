import type { Child, Children, Context } from '@bikeshaving/crank/crank.js';
import { Copy, createElement, Fragment, Raw } from '@bikeshaving/crank/crank.js';
import { renderer } from '@bikeshaving/crank/dom.js';
import Prism from 'prismjs';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-latex';
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

function parse(content: string): Array<Child> {
  const lines = splitLines(Prism.tokenize(content, Prism.languages.latex));
  return printLines(lines);
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
    <div>{line.length ? printTokens(line) : <br />}</div>
  ));
}

// TODO: Pass in old lines and mutate that array rather than creating a new one.
function renderLines(content: string): Array<Child> {
  const lines = content.split(/\r\n|\r|\n/);
  if (/\r\n|\r|\n$/.test(content)) {
    lines.pop();
  }

  //return content;
  // We’re using these return values to test different rendering strategies.
  return lines.flatMap((line) => [line, <br />]);
  //return lines.flatMap((line) => [<span>{line}</span>, <br />]);
  //return lines.flatMap((line) =>
  //  line ? [<span>{line}</span>, <br />] : <br />,
  //);
  //return lines.flatMap((line) => line ? [Array.from(line).map((char) => <span>{char}</span>), <br />] : <br />);
  // This is the most well-behaved way to divide lines.
  //return lines.map((line) => <div>{line || <br />}</div>);
  //return lines.map((line) => <div>{line || "\n"}</div>);
  //return lines.map((line) => <div>{line}<br /></div>);
  //return lines.map((line) => <div>{line}{"\n"}</div>);
}

function* Editable(this: Context, { children }: any) {
  let content = '\n';
  let cursor: Cursor = -1;
  let operations: string | undefined;
  let el: any;
  const observer = new ContentObserver(
    ({ type, content: content1, cursor: cursor1 }) => {
      switch (type) {
        case "selectionchange":
          cursor = cursor1;
          content = content1;
          this.refresh();
          break;
        case "mutation": {
          const points = [cursor, cursor1].flat(1);
          // TODO: do we really need the low point or do we just need the lowest
          // index from cursor1
          const low = Math.min.apply(null, points);
          // TODO: use high?
          //const high = Math.max.apply(null, points);
          const patch = Patch.diff(content, content1, low);
          operations = JSON.stringify(patch.operations(), null, 2);
          content = content1;
          cursor = cursor1;
          observer.repairCursor(() => this.refresh());
          break;
        }
      }
    },
  );

  this.schedule(() => {
    observer.observe(el!);
    this.refresh();
  });

  //let initial = true;
  try {
    for ({} of this) {
      yield (
        <div class="editor">
          {/*
          <div
            crank-ref={(el1: Node) => (el = el1)}
            contenteditable="true"
            spellcheck={false}
          >
            {parse(content)}
          </div>
          */}
          <div
            crank-ref={(el1: Node) => (el = el1)}
            contenteditable="true"
            spellcheck={false}
          >
            {renderLines(content)}
          </div>
          <div>HTML: <pre>{el && el.innerHTML}</pre></div>
          <div>Content: <pre>{JSON.stringify(content)}</pre></div>
          <div>Cursor: <pre>{JSON.stringify(cursor)}</pre></div>
          <div>Operations: <pre>{operations}</pre></div>
        </div>
      );
      //initial = false;
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
