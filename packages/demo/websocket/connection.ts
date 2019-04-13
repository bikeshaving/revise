import {
  Checkpoint,
  Connection,
  Message,
} from "@collabjs/collab/lib/connection";
import { Channel, DroppingBuffer } from "@channel/channel";
import { Action } from "./actions";

interface Request {
  resolve(value?: any): void;
  reject(reason: any): void;
  persist?: boolean;
}

export class WebSocketConnection implements Connection {
  protected buffer: Action[] = [];
  protected requests: Request[] = [];
  protected nextRequestId = 0;
  constructor(protected socket: WebSocket) {
    socket.onopen = this.handleOpen.bind(this);
    // TODO: what do we do if the socket is closed?
    socket.onclose = (ev) => console.log("close", ev);
    // TODO: what do we do if there is an error?
    socket.onerror = (ev) => console.log("error", ev);
    socket.onmessage = this.handleMessage.bind(this);
  }

  protected handleOpen(): void {
    if (this.buffer.length) {
      for (const action of this.buffer) {
        this.send(action);
      }
      this.buffer = [];
    }
  }

  protected async handleMessage(ev: MessageEvent): Promise<void> {
    let message: any;
    try {
      message = JSON.parse(ev.data);
    } catch (err) {
      console.error(err);
      return;
    }
    const request = this.requests[message.reqId];
    if (request == null) {
      return;
    } else if (!request.persist) {
      delete this.requests[message.reqId];
    }
    switch (message.type) {
      case "acknowledge":
      case "sendNothing": {
        request.resolve();
        break;
      }
      case "sendMessages": {
        request.resolve(message.messages);
        break;
      }
      case "sendCheckpoint": {
        request.resolve(message.checkpoint);
        break;
      }
      default: {
        request.reject(Error(`Unknown action type: ${message.type}`));
        break;
      }
    }
  }

  protected async send(action: Action): Promise<any> {
    if (this.socket.readyState === WebSocket.CONNECTING) {
      this.buffer.push(action);
    } else if (
      this.socket.readyState === WebSocket.CLOSING ||
      this.socket.readyState === WebSocket.CLOSED
    ) {
      throw new Error("WebSocket is closed or closing 🤮");
    } else {
      const serialized = JSON.stringify(action);
      this.socket.send(serialized);
    }
    if (this.requests[action.reqId] != null) {
      // if there is a request under action.reqId that means send is being called by handleOpen so we can ignore the returned Promise.
      return;
    }
    return new Promise(
      (resolve, reject) => (this.requests[action.reqId] = { resolve, reject }),
    );
  }

  // TODO: handle negative indexes?
  fetchMessages(
    id: string,
    start?: number,
    end?: number,
  ): Promise<Message[] | undefined> {
    const action: Action = {
      type: "fetchMessages",
      id,
      start,
      end,
      reqId: this.nextRequestId++,
    };
    return this.send(action);
  }

  sendMessages(id: string, messages: Message[]): Promise<void> {
    const action: Action = {
      type: "sendMessages",
      id,
      messages,
      reqId: this.nextRequestId++,
    };
    return this.send(action);
  }

  fetchCheckpoint(id: string, start?: number): Promise<Checkpoint | undefined> {
    const action: Action = {
      type: "fetchCheckpoint",
      id,
      start,
      reqId: this.nextRequestId++,
    };
    return this.send(action);
  }

  sendCheckpoint(id: string, checkpoint: Checkpoint): Promise<void> {
    const action: Action = {
      type: "sendCheckpoint",
      id,
      checkpoint,
      reqId: this.nextRequestId++,
    };
    return this.send(action);
  }

  subscribe(id: string, start: number): AsyncIterableIterator<Message[]> {
    return new Channel<Message[]>(async (resolve, reject, stop) => {
      const action: Action = {
        type: "subscribe",
        id,
        start,
        reqId: this.nextRequestId++,
      };
      let stopped = false;
      stop.then(() => (stopped = true));
      await Promise.race([stop, this.send(action)]);
      if (!stopped) {
        this.requests[action.reqId] = { resolve, reject, persist: true };
      }
      await stop;
      delete this.requests[action.reqId];
    }, new DroppingBuffer(1000));
  }
}
