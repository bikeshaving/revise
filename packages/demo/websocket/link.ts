import { Action } from "./actions";
import { Connection } from "@collabjs/collab/lib/connection";

// TODO: return a more useful value, maybe make this a class.
export function link(conn: Connection, socket: WebSocket): void {
  async function handleMessage(ev: MessageEvent) {
    let message: Action = JSON.parse(ev.data);
    try {
      switch (message.type) {
        case "fetchCheckpoint": {
          const checkpoint = await conn.fetchCheckpoint(
            message.id,
            message.start,
          );
          let action: Action;
          if (checkpoint == null) {
            action = {
              type: "sendNothing",
              id: message.id,
              reqId: message.reqId,
            };
          } else {
            action = {
              type: "sendCheckpoint",
              id: message.id,
              reqId: message.reqId,
              checkpoint,
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
        case "sendCheckpoint": {
          await conn.sendCheckpoint(message.id, message.checkpoint!);
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
          const action: Action = {
            type: "acknowledge",
            id: message.id,
            reqId: message.reqId,
          };
          socket.send(JSON.stringify(action));
          const subscription = conn.subscribe(message.id, message.start);
          for await (const messages of subscription) {
            const action: Action = {
              type: "sendMessages",
              id: message.id,
              reqId: message.reqId,
              messages,
            };
            socket.send(JSON.stringify(action));
          }
          break;
        }
      }
    } catch (err) {
      console.log(err);
      socket.close();
    }
  }
  socket.addEventListener("message", handleMessage);
  socket.onclose = () => socket.removeEventListener("message", handleMessage);
}
