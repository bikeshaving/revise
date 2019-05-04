import { Connection } from "@collabjs/collab/lib/connection";
import {
  Action,
  FetchCheckpoint,
  FetchMessages,
  SendCheckpoint,
  SendMessages,
  Subscribe,
} from "./actions";
import { messageEvents } from "./channel";

function send(socket: WebSocket, action: Action): void {
  socket.send(JSON.stringify(action));
}

async function fetchCheckpoint(
  conn: Connection,
  socket: WebSocket,
  action: FetchCheckpoint,
): Promise<void> {
  const checkpoint = await conn.fetchCheckpoint(action.id, action.start);
  if (checkpoint == null) {
    send(socket, { type: "ack", id: action.id, reqId: action.reqId });
  } else {
    send(socket, {
      type: "sc",
      id: action.id,
      reqId: action.reqId,
      checkpoint,
    });
  }
}

async function fetchMessages(
  conn: Connection,
  socket: WebSocket,
  action: FetchMessages,
): Promise<void> {
  const messages = await conn.fetchMessages(
    action.id,
    action.start,
    action.end,
  );
  if (messages == null) {
    send(socket, { type: "ack", id: action.id, reqId: action.reqId });
  } else {
    send(socket, { type: "sm", id: action.id, reqId: action.reqId, messages });
  }
}

async function sendCheckpoint(
  conn: Connection,
  socket: WebSocket,
  action: SendCheckpoint,
): Promise<void> {
  await conn.sendCheckpoint(action.id, action.checkpoint!);
  send(socket, {
    type: "ack",
    id: action.id,
    reqId: action.reqId,
  });
}

async function sendMessages(
  conn: Connection,
  socket: WebSocket,
  action: SendMessages,
): Promise<void> {
  await conn.sendMessages(action.id, action.messages!);
  send(socket, { type: "ack", id: action.id, reqId: action.reqId });
}

async function subscribe(
  conn: Connection,
  socket: WebSocket,
  action: Subscribe,
): Promise<void> {
  send(socket, { type: "ack", id: action.id, reqId: action.reqId });
  const subscription = conn.subscribe(action.id, action.start);
  for await (const messages of subscription) {
    send(socket, { type: "sm", id: action.id, reqId: action.reqId, messages });
  }
}

// TODO: return a more useful value, maybe make this a class.
export async function link(conn: Connection, socket: WebSocket): Promise<void> {
  for await (const ev of messageEvents(socket)) {
    try {
      const action: Action = JSON.parse(ev.data);
      switch (action.type) {
        case "fc": {
          await fetchCheckpoint(conn, socket, action);
          break;
        }
        case "fm": {
          await fetchMessages(conn, socket, action);
          break;
        }
        case "sc": {
          await sendCheckpoint(conn, socket, action);
          break;
        }
        case "sm": {
          await sendMessages(conn, socket, action);
          break;
        }
        case "sub": {
          subscribe(conn, socket, action);
          break;
        }
        default: {
          throw new Error(`Invalid action type: ${action.type}`);
        }
      }
    } catch (err) {
      console.error(err);
      socket.close();
    }
  }
}
