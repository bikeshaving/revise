import type {Context, Element} from "@b9g/crank";
import {renderer} from "@b9g/crank/dom";
import {Editable, EditableState} from "@b9g/crankeditable";

const PATTERN = /(#\w+)|(@\w+)|(https?:\/\/[^\s]+)/g;

function highlightSocial(text: string): (Element | string)[] {
  const result: (Element | string)[] = [];
  let lastIndex = 0;
  for (const match of text.matchAll(PATTERN)) {
    const index = match.index!;
    if (index > lastIndex) result.push(text.slice(lastIndex, index));
    const value = match[0];
    let color: string, href: string;
    if (match[1]) {
      color = "#c084fc";
      href = "https://example.com/tags/" + value.slice(1);
    } else if (match[2]) {
      color = "#60a5fa";
      href = "https://example.com/" + value.slice(1);
    } else {
      color = "#34d399";
      href = value;
    }
    result.push(
      <a href={href} target="_blank" rel="noopener"
        style={"color: " + color + "; text-decoration: underline"}>{value}</a>
    );
    lastIndex = index + value.length;
  }
  if (lastIndex < text.length) result.push(text.slice(lastIndex));
  return result;
}

function* SocialEditable(this: Context) {
  const state = new EditableState({
    value: `Check out #revise by @bikeshaving
Visit https://revise.js.org
#javascript #editing @everyone
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
                {line ? highlightSocial(line) : <br />}
              </div>
            );
          })}
        </div>
      </Editable>
    );
  }
}

renderer.render(<SocialEditable />, document.body);
