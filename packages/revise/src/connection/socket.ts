import { Channel, ChannelBuffer } from "@channel/channel";
import { Checkpoint, Connection, Message } from "./index";
import {
  Action,
  FetchCheckpoint,
  FetchMessages,
  SendCheckpoint,
  SendMessages,
  Subscribe,
} from "./actions";

export type Socket = WebSocket | RTCDataChannel;

export function listen(
  socket: Socket,
  buffer?: ChannelBuffer<any>,
): Channel<any> {
  return new Channel(async (push, close, stop) => {
    socket.onmessage = (ev) => push(ev.data);
    socket.onerror = () => close(new Error("Socket Error"));
    socket.onclose = () => close();
    await stop;
    socket.close();
  }, buffer);
}

function send(socket: Socket, action: Action): void {
  socket.send(JSON.stringify(action));
}

async function fetchCheckpoint(
  conn: Connection,
  socket: Socket,
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
  socket: Socket,
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
  socket: Socket,
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
  socket: Socket,
  action: SendMessages,
): Promise<void> {
  await conn.sendMessages(action.id, action.messages!);
  send(socket, { type: "ack", id: action.id, reqId: action.reqId });
}

async function subscribe(
  conn: Connection,
  socket: Socket,
  action: Subscribe,
): Promise<void> {
  send(socket, { type: "ack", id: action.id, reqId: action.reqId });
  for await (const messages of conn.subscribe(action.id, action.start)) {
    send(socket, { type: "sm", id: action.id, reqId: action.reqId, messages });
  }
}

export async function proxy(conn: Connection, socket: Socket): Promise<void> {
  const channel = listen(socket);
  for await (const data of channel) {
    const action: Action = JSON.parse(data);
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
        subscribe(conn, socket, action).then(() => channel.return());
        // TODO: cause link to throw or something
        //.catch((err) => channe.throw(err));
        break;
      }
      default: {
        throw new Error(`Invalid action type: ${action.type}`);
      }
    }
  }
}

interface Request {
  resolve(value?: any): void;
  reject(reason: any): void;
  persist: boolean;
}

export class SocketConnection implements Connection {
  protected opened = false;
  protected buffer: Action[] = [];
  protected reqs: Request[] = [];
  protected nextReqId = 0;
  constructor(protected socket: Socket) {
    // TODO: handle errors
    socket.onopen = () => {
      this.opened = true;
      for (const action of this.buffer) {
        // TODO: handle this.send rejecting
        this.send(action);
      }
      this.buffer = [];
    };
    // TODO: catch err;
    this.connect(socket);
  }

  protected async connect(socket: Socket): Promise<void> {
    for await (const data of listen(socket)) {
      const action: Action = JSON.parse(data);
      // TODO: validate action
      const req = this.reqs[action.reqId];
      if (req == null) {
        continue;
      } else if (!req.persist) {
        delete this.reqs[action.reqId];
      }
      switch (action.type) {
        case "ack": {
          req.resolve();
          break;
        }
        case "sm": {
          req.resolve(action.messages);
          break;
        }
        case "sc": {
          req.resolve(action.checkpoint);
          break;
        }
        default: {
          req.reject(Error(`Invalid action type: ${action.type}`));
          break;
        }
      }
    }
  }

  protected async send(action: Action): Promise<any> {
    if (!this.opened) {
      this.buffer.push(action);
    } else {
      const serialized = JSON.stringify(action);
      this.socket.send(serialized);
    }
    if (this.reqs[action.reqId] != null) {
      return;
    }
    return new Promise((resolve, reject) => {
      this.reqs[action.reqId] = { resolve, reject, persist: false };
    });
  }

  fetchCheckpoint(id: string, start?: number): Promise<Checkpoint | undefined> {
    return this.send({ type: "fc", id, reqId: this.nextReqId++, start });
  }

  fetchMessages(
    id: string,
    start?: number,
    end?: number,
  ): Promise<Message[] | undefined> {
    return this.send({ type: "fm", id, reqId: this.nextReqId++, start, end });
  }

  sendCheckpoint(id: string, checkpoint: Checkpoint): Promise<void> {
    return this.send({ type: "sc", id, reqId: this.nextReqId++, checkpoint });
  }

  sendMessages(id: string, messages: Message[]): Promise<void> {
    return this.send({ type: "sm", id, reqId: this.nextReqId++, messages });
  }

  subscribe(
    id: string,
    start: number,
    buffer?: ChannelBuffer<Message[]>,
  ): Channel<Message[]> {
    return new Channel<Message[]>(async (resolve, reject, stop) => {
      const action: Action = {
        type: "sub",
        id,
        reqId: this.nextReqId++,
        start,
      };
      await Promise.race([this.send(action), stop]);
      this.reqs[action.reqId] = { resolve, reject, persist: true };
      await stop;
      delete this.reqs[action.reqId];
    }, buffer);
  }
}
