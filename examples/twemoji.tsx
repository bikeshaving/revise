import type {Context, Element} from "@b9g/crank";
import {renderer} from "@b9g/crank/dom";
import {Editable, EditableState, ContentAreaElement} from "@b9g/crankeditable";
import {parse as parseEmoji} from "@twemoji/parser";

if (!customElements.get("content-area")) {
  customElements.define("content-area", ContentAreaElement);
}

function renderTwemoji(text: string): (Element | string)[] {
  const entities = parseEmoji(text);
  if (!entities.length) return [text];
  const result: (Element | string)[] = [];
  let lastIndex = 0;
  for (const entity of entities) {
    const [start, end] = entity.indices;
    if (start > lastIndex) result.push(text.slice(lastIndex, start));
    result.push(
      <img
        data-content={entity.text}
        src={entity.url}
        alt={entity.text}
        draggable={false}
        style="height:1.2em;width:1.2em;vertical-align:middle;display:inline-block"
      />
    );
    lastIndex = end;
  }
  if (lastIndex < text.length) result.push(text.slice(lastIndex));
  return result;
}

function* TwemojiEditable(this: Context) {
  const state = new EditableState({
    value: `Hello World! 👋
Revise.js is 🔥🔥🔥
Type some emoji: 😎❤️🚀
`,
  });
  for (const {} of this) {
    const lines = state.value.split("\n");
    if (lines[lines.length - 1] === "") lines.pop();
    let cursor = 0;
    yield (
      <Editable state={state} onstatechange={() => this.refresh()}>
        <div class="editable" contenteditable="true" spellcheck="false">
          {lines.map((line) => {
            const key = state.keyer.keyAt(cursor);
            cursor += line.length + 1;
            return (
              <div key={key}>
                {line ? renderTwemoji(line) : <br />}
              </div>
            );
          })}
        </div>
      </Editable>
    );
  }
}

renderer.render(<TwemojiEditable />, document.body);
