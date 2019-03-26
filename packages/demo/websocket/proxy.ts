import { Action } from "./actions";
import { Connection } from "@collabjs/collab/lib/connection";
// TODO: return Promise<void> which rejects if there’s an error and resolves if the socket is closed
export function proxy(conn: Connection, socket: WebSocket): void {
  socket.addEventListener("message", async (ev) => {
    let message: any;
    message = JSON.parse(ev.data);
    switch (message.type) {
      case "fetchMilestone": {
        const milestone = await conn.fetchMilestone(message.id, message.start);
        const message1: Action = {
          type: "sendMilestone",
          id: message.id,
          requestId: message.requestId,
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
        const message1: Action = {
          type: "sendMessages",
          id: message.id,
          requestId: message.requestId,
          messages,
        };
        socket.send(JSON.stringify(message1));
        break;
      }
      case "sendMilestone": {
        await conn.sendMilestone(message.id, message.milestone);
        const message1: Action = {
          type: "acknowledge",
          id: message.id,
          requestId: message.requestId,
        };
        socket.send(JSON.stringify(message1));
        break;
      }
      case "sendMessages": {
        await conn.sendMessages(message.id, message.milestone);
        const message1: Action = {
          type: "acknowledge",
          id: message.id,
          requestId: message.requestId,
        };
        socket.send(JSON.stringify(message1));
        break;
      }
    }
  });
}
