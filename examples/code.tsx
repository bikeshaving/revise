import type {Context, Element} from "@b9g/crank";
import {renderer} from "@b9g/crank/dom";
import {Editable, EditableState} from "@b9g/crankeditable";

const KW = /\b(function|const|let|var|return|if|else|for|while|class|import|export|from|new|typeof)\b/g;

function highlight(line: string): (Element | string)[] {
  const result: (Element | string)[] = [];
  let lastIndex = 0;
  for (const match of line.matchAll(KW)) {
    const index = match.index!;
    if (index > lastIndex) result.push(line.slice(lastIndex, index));
    result.push(<span style="color: #c084fc">{match[0]}</span>);
    lastIndex = index + match[0].length;
  }
  if (lastIndex < line.length) result.push(line.slice(lastIndex));
  return result;
}

function* CodeEditable(this: Context) {
  const state = new EditableState({
    value: `function greet(name) {
  return 'Hello, ' + name;
}

const message = greet('World');
console.log(message);
`,
  });
  for (const {} of this) {
    const lines = state.value.split("\n");
    if (lines[lines.length - 1] === "") lines.pop();
    let cursor = 0;
    yield (
      <Editable state={state} onstatechange={() => this.refresh()}>
        <pre class="editable" contenteditable="true" spellcheck="false">
          {lines.map((line) => {
            const key = state.keyer.keyAt(cursor);
            cursor += line.length + 1;
            return (
              <div key={key}>
                <code>{line ? highlight(line) : null}</code>
                <br />
              </div>
            );
          })}
        </pre>
      </Editable>
    );
  }
}

renderer.render(<CodeEditable />, document.body);
