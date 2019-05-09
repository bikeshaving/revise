import * as React from "react";
import * as uuid from "uuid/v4";
import { delay } from "@channel/timers";
import { build, operations, Patch } from "@createx/revise/lib/patch";
import { Version } from "@createx/revise/lib/replica";
import { Client } from "@createx/revise/lib/client";
import { CollabText } from "@createx/revise/lib/text";
import { SocketConnection } from "@createx/revise/lib/connection/socket";

let CodeMirror: any;
if (typeof window !== "undefined") {
  CodeMirror = require("codemirror");
  require("codemirror/lib/codemirror.css");
}

function apply(cm: CodeMirror.Editor & CodeMirror.Doc, patch: Patch): void {
  if (cm.getValue().length !== patch[patch.length - 1]) {
    throw new Error("Length mismatch");
  }

  let offset = 0;
  cm.operation(() => {
    for (const op of operations(patch)) {
      switch (op.type) {
        case "insert": {
          const start = cm.posFromIndex(op.start + offset);
          cm.replaceRange(op.inserted, start, start, "collab");
          offset += op.inserted.length;
          break;
        }
        case "delete": {
          const start = cm.posFromIndex(op.start + offset);
          const end = cm.posFromIndex(op.end + offset);
          cm.replaceRange("", start, end, "collab");
          offset -= op.end - op.start;
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
    const conn = new SocketConnection(socket);
    const client = new Client(uuid(), conn);
    const cm = CodeMirror(editor.current, {
      readOnly: true,
      lineWrapping: true,
      autofocus: true,
    });
    let text: CollabText;
    let version: Version;
    function handleChange(
      cm: CodeMirror.Editor & CodeMirror.Doc,
      change: CodeMirror.EditorChange,
    ): void {
      if (change.origin === "setValue" || change.origin === "collab") {
        return;
      }
      const start = cm.indexFromPos(change.from);
      const removed = change.removed.join("\n");
      const end = start + removed.length;
      const inserted = change.text.join("\n");
      const length = cm.getValue().length + removed.length - inserted.length;
      const patch = build(start, end, inserted, length);
      const update = text.edit(patch, version);
      if (update.patch != null) {
        apply(cm, update.patch);
      }
      version = { commit: update.commit, change: update.change };
    }
    CollabText.initialize("doc1", client).then(async (text1) => {
      text = text1;
      // console.log(text);
      const value = text.value;
      version = { commit: value.commit, change: value.change };
      cm.setValue(value.text);
      cm.setOption("readOnly", false);
      cm.on("change", handleChange);
      for await (const _ of text.subscribe()) {
        await delay(4000).next();
        const update = text.updateSince(version);
        version = { commit: update.commit, change: update.change };
        if (update.patch != null) {
          apply(cm, update.patch);
        }
      }
    });
    return () => cm.off("change", handleChange);
  }, []);
  return <div ref={editor} />;
}

export default function IndexPage() {
  return <Editor />;
}
