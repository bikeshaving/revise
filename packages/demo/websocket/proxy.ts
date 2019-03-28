import { Action } from "./actions";
import { Connection } from "@collabjs/collab/lib/connection";

// TODO: return a more useful value, maybe make this a class.
export function proxy(conn: Connection, socket: WebSocket): void {
  socket.addEventListener("message", async (ev) => {
    let message: any;
    try {
      message = JSON.parse(ev.data);
    } catch (err) {
      console.error(err);
    }
    switch (message.type) {
      case "fetchMilestone": {
        const milestone = await conn.fetchMilestone(message.id, message.start);
        const message1: Action = {
          type: "sendMilestone",
          id: message.id,
          reqId: message.reqId,
          milestone,
        };
        socket.send(JSON.stringify(message1));
        break;
      }
      case "fetchMessages": {
        const messages = await conn.fetchMessages(
          message.id,
          message.start,
          message.end,
        );
        const action: Action = {
          type: "sendMessages",
          id: message.id,
          reqId: message.reqId,
          messages,
        };
        socket.send(JSON.stringify(action));
        break;
      }
      case "sendMilestone": {
        await conn.sendMilestone(message.id, message.milestone);
        const action: Action = {
          type: "acknowledge",
          id: message.id,
          reqId: message.reqId,
        };
        socket.send(JSON.stringify(action));
        break;
      }
      case "sendMessages": {
        await conn.sendMessages(message.id, message.messages);
        const action: Action = {
          type: "acknowledge",
          id: message.id,
          reqId: message.reqId,
        };
        socket.send(JSON.stringify(action));
        break;
      }
      case "subscribe": {
        // TODO:
        break;
      }
    }
  });
}
