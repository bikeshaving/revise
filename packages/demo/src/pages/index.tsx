import * as React from "react";
import * as uuid from "uuid/v4";
import { operations, Patch } from "@collabjs/collab/lib/patch";
import { Version } from "@collabjs/collab/lib/replica";
import { Client } from "@collabjs/collab/lib/client";
import { CollabText } from "@collabjs/collab/lib/text";
import { WebSocketConnection } from "@collabjs/collab/lib/connection/websocket";

let CodeMirror: any;
if (typeof window !== "undefined") {
  CodeMirror = require("codemirror");
  require("codemirror/lib/codemirror.css");
}

function apply(cm: CodeMirror.Editor & CodeMirror.Doc, patch: Patch): void {
  let tally = 0;
  cm.operation(() => {
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
    let version: Version;
    function handleChange(
      cm: CodeMirror.Editor & CodeMirror.Doc,
      change: CodeMirror.EditorChangeCancellable,
    ): void {
      if (change.origin === "setValue" || change.origin === "collab") {
        return;
      }
      const start = cm.indexFromPos(change.from);
      const end = cm.indexFromPos(change.to);
      const inserted = change.text.join("\n");
      const update = text.replace(start, end, inserted, version);
      version = { commit: update.commit, change: update.change };
    }
    CollabText.initialize("doc1", client).then(async (text1) => {
      text = text1;
      console.log(text);
      const value = text.value;
      version = { commit: value.commit, change: value.change };
      cm.setValue(value.text);
      cm.setOption("readOnly", false);
      cm.on("beforeChange", handleChange);
      for await (const _ of text.subscribe()) {
        const update = text.updateSince(version);
        version = { commit: update.commit, change: update.change };
        if (update.patch != null) {
          apply(cm, update.patch);
        }
      }
    });
    return () => cm.off("beforeChange", handleChange);
  }, []);
  return <div ref={editor} />;
}

export default function IndexPage() {
  return <Editor />;
}
