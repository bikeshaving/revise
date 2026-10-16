import type {Context} from "@b9g/crank";
import {renderer} from "@b9g/crank/dom";
import {Editable, EditableState} from "@b9g/crankeditable";

function* SimpleEditable(this: Context) {
  const state = new EditableState({
    value: `Hello World!
Try typing here.
Undo with Ctrl/Cmd+Z.
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
            return <div key={key}>{line || <br />}</div>;
          })}
        </pre>
      </Editable>
    );
  }
}

renderer.render(<SimpleEditable />, document.body);
