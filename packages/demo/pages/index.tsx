import * as React from "react";

import * as uuid from "uuid/v4";
import { WebSocketConnection } from "../websocket/connection";
import { Client } from "@collabjs/collab/lib/client";
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
      if (change.origin === "setValue") {
        return;
      }
      const start = cm.indexFromPos(change.from);
      const end = start + cm.getRange(change.from, change.to).length;
      const inserted = change.text.join("\n");
      text!.replace(start, end, inserted);
    }
    CollabText.initialize("doc1", client).then((collabText) => {
      text = collabText;
      cm.setValue(collabText.text);
      cm.on("beforeChange", handleBeforeChange);
      cm.setOption("readOnly", false);
    });
    return () => {
      cm.off("beforeChange", handleBeforeChange);
    };
  }, []);
  return <div ref={editorNode} />;
}

export default function IndexPage() {
  return <Editor />;
}
