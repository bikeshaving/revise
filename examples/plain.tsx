import type {Context} from "@b9g/crank";
import {renderer} from "@b9g/crank/dom";
import {Editable, EditableState} from "@b9g/crankeditable";

function* PlainEditable(this: Context) {
  const state = new EditableState({
    value: `Hello World!
The whole document is one text node.
Newlines live in the text itself, so there is nothing to key.
`,
  });
  for (const {} of this) {
    yield (
      <Editable state={state} onstatechange={() => this.refresh()}>
        <pre class="editable" contenteditable="plaintext-only" spellcheck="false">
          {state.value}
        </pre>
      </Editable>
    );
  }
}

renderer.render(<PlainEditable />, document.body);
