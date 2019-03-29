import { Action } from "./actions";
import { Connection } from "@collabjs/collab/lib/connection";

// TODO: return a more useful value, maybe make this a class.
export function link(conn: Connection, socket: WebSocket): void {
  // TODO: error handling
  socket.addEventListener("message", async (ev) => {
    let message: Action = JSON.parse(ev.data);
    switch (message.type) {
      case "fetchMilestone": {
        const milestone = await conn.fetchMilestone(message.id, message.start);
        let action: Action;
        if (milestone == null) {
          action = {
            type: "sendNothing",
            id: message.id,
            reqId: message.reqId,
          };
        } else {
          action = {
            type: "sendMilestone",
            id: message.id,
            reqId: message.reqId,
            milestone,
          };
        }
        socket.send(JSON.stringify(action));
        break;
      }
      case "fetchMessages": {
        const messages = await conn.fetchMessages(
          message.id,
          message.start,
          message.end,
        );
        let action: Action;
        if (messages == null) {
          action = {
            type: "sendNothing",
            id: message.id,
            reqId: message.reqId,
          };
        } else {
          action = {
            type: "sendMessages",
            id: message.id,
            reqId: message.reqId,
            messages,
          };
        }
        socket.send(JSON.stringify(action));
        break;
      }
      case "sendMilestone": {
        await conn.sendMilestone(message.id, message.milestone!);
        const action: Action = {
          type: "acknowledge",
          id: message.id,
          reqId: message.reqId,
        };
        socket.send(JSON.stringify(action));
        break;
      }
      case "sendMessages": {
        await conn.sendMessages(message.id, message.messages!);
        const action: Action = {
          type: "acknowledge",
          id: message.id,
          reqId: message.reqId,
        };
        socket.send(JSON.stringify(action));
        break;
      }
      case "subscribe": {
        const subscription = await conn.subscribe(message.id, message.start);
        const action: Action = {
          type: "subscribe",
          id: message.id,
          reqId: message.reqId,
          start: message.start,
        };
        socket.send(JSON.stringify(action));
        for await (const messages of subscription) {
          try {
            const action: Action = {
              type: "sendMessages",
              id: message.id,
              reqId: message.reqId,
              messages,
            };
            socket.send(JSON.stringify(action));
          } catch (err) {
            break;
          }
        }
        break;
      }
    }
  });
}
