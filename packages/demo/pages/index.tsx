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
  const editor = React.useRef(null);
  React.useEffect(() => {
    const socket = new WebSocket("ws://localhost:3000/collab");
    const conn = new WebSocketConnection(socket);
    const client = new Client(uuid(), conn);
    const cm = CodeMirror(editor.current, {
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
      const end = cm.indexFromPos(change.to);
      const inserted = change.text.join("\n");
      text.replace(start, end, inserted);
    }
    CollabText.initialize("doc1", client).then(async (text1) => {
      text = text1;
      console.log(text);
      cm.setValue(text.text);
      cm.on("beforeChange", handleBeforeChange);
      cm.setOption("readOnly", false);
      for await (const patch of text.remote()) {
        console.log(patch);
        cm.operation(() => {
          let tally = 0;
          for (const op of operations(patch)) {
            switch (op.type) {
              case "insert": {
                const start = cm.posFromIndex(op.start + tally);
                cm.replaceRange(op.inserted, start, start, "collab");
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
        });
      }
    });
    return () => cm.off("beforeChange", handleBeforeChange);
  }, []);
  return <div ref={editor} />;
}

export default function IndexPage() {
  return <Editor />;
}
