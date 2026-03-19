import type {Context} from "@b9g/crank";
import {renderer} from "@b9g/crank/dom";
import {Editable, EditableState} from "@b9g/crankeditable";

const COLORS = [
  "#ef4444", "#f97316", "#eab308",
  "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899",
];

function* RainbowEditable(this: Context) {
  const state = new EditableState({
    value: `Hello
World
Rainbow
Text
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
            const chars = line
              ? [...line].map((char, i) => (
                  <span style={"color: " + COLORS[i % COLORS.length]}>{char}</span>
                ))
              : <br />;
            return <div key={key}>{chars}</div>;
          })}
        </div>
      </Editable>
    );
  }
}

renderer.render(<RainbowEditable />, document.body);
