import * as React from "react";
import * as uuid from "uuid/v4";
import { WebSocketConnection } from "../websocket/connection";
import { Client } from "@collabjs/collab/lib/client";
import { operations } from "@collabjs/collab/lib/patch";
import { CollabText } from "@collabjs/collab/lib/text";

let CodeMirror: any;
if (typeof window !== "undefined") {
  CodeMirror = require("codemirror");
  require("codemirror/lib/codemirror.css");
}

function Editor() {
  const editorNode = React.useRef(null);
  React.useEffect(() => {
    const socket = new WebSocket("ws://localhost:3000/collab");
    const conn = new WebSocketConnection(socket);
    const client = new Client(uuid(), conn);
    const cm = CodeMirror(editorNode.current, {
      readOnly: true,
      lineWrapping: true,
    });
    let text: CollabText;
    function handleBeforeChange(
      cm: CodeMirror.Doc,
      change: CodeMirror.EditorChangeCancellable,
    ): void {
      if (change.origin === "setValue" || change.origin === "collab") {
        return;
      }
      const start = cm.indexFromPos(change.from);
      const end = start + cm.getRange(change.from, change.to).length;
      const inserted = change.text.join("\n");
      text.replace(start, end, inserted);
    }
    CollabText.initialize("doc1", client).then(async (text1) => {
      text = text1;
      cm.setValue(text.text);
      cm.on("beforeChange", handleBeforeChange);
      cm.setOption("readOnly", false);
      for await (const rev of text.subscribe()) {
        cm.operation(() => {
          if (rev.client !== client.id) {
            let tally = 0;
            for (const op of operations(rev.patch)) {
              switch (op.type) {
                case "insert": {
                  const start = cm.posFromIndex(op.start + tally);
                  cm.replaceRange(op.inserted, start, null, "collab");
                  tally += op.inserted.length;
                  break;
                }
                case "delete": {
                  const start = cm.posFromIndex(op.start + tally);
                  const end = cm.posFromIndex(op.end + tally);
                  cm.replaceRange("", start, end, "collab");
                  tally -= op.end - op.start;
                  break;
                }
              }
            }
          }
        });
      }
    });
    return () => cm.off("beforeChange", handleBeforeChange);
  }, []);
  return <div ref={editorNode} />;
}

export default function IndexPage() {
  return <Editor />;
}
