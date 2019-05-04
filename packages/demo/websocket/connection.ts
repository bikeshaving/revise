import {
  Checkpoint,
  Connection,
  Message,
} from "@collabjs/collab/lib/connection";
import { Channel, DroppingBuffer } from "@channel/channel";
import { messageEvents } from "./channel";
import { Action } from "./actions";

interface Request {
  resolve(value?: any): void;
  reject(reason: any): void;
  persist: boolean;
}

export class WebSocketConnection implements Connection {
  protected buffer: Action[] = [];
  protected requests: Request[] = [];
  protected nextRequestId = 0;
  constructor(protected socket: WebSocket) {
    this.listen(socket);
  }

  protected async listen(socket: WebSocket): Promise<void> {
    socket.onopen = () => {
      if (this.buffer.length) {
        for (const action of this.buffer) {
          // TODO: handle rejection
          this.send(action);
        }
        this.buffer = [];
      }
    };
    try {
      for await (const ev of messageEvents(socket)) {
        const action: Action = JSON.parse(ev.data);
        // TODO: validate action
        const req = this.requests[action.reqId];
        if (req == null) {
          continue;
        } else if (!req.persist) {
          delete this.requests[action.reqId];
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
    } catch (err) {
      console.error(err);
      //TODO: do something
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
      return;
    }
    return new Promise((resolve, reject) => {
      this.requests[action.reqId] = { resolve, reject, persist: false };
    });
  }

  // TODO: handle negative indexes?
  fetchMessages(
    id: string,
    start?: number,
    end?: number,
  ): Promise<Message[] | undefined> {
    return this.send({
      type: "fm",
      id,
      start,
      end,
      reqId: this.nextRequestId++,
    });
  }

  sendMessages(id: string, messages: Message[]): Promise<void> {
    return this.send({
      type: "sm",
      id,
      messages,
      reqId: this.nextRequestId++,
    });
  }

  fetchCheckpoint(id: string, start?: number): Promise<Checkpoint | undefined> {
    return this.send({
      type: "fc",
      id,
      start,
      reqId: this.nextRequestId++,
    });
  }

  sendCheckpoint(id: string, checkpoint: Checkpoint): Promise<void> {
    return this.send({
      type: "sc",
      id,
      checkpoint,
      reqId: this.nextRequestId++,
    });
  }

  subscribe(id: string, start: number): Channel<Message[]> {
    return new Channel<Message[]>(async (resolve, reject, stop) => {
      const action: Action = {
        type: "sub",
        id,
        start,
        reqId: this.nextRequestId++,
      };
      let canceled = false;
      stop.then(() => (canceled = true));
      await Promise.race([this.send(action), stop]);
      if (!canceled) {
        this.requests[action.reqId] = { resolve, reject, persist: true };
      }
      await stop;
      delete this.requests[action.reqId];
    }, new DroppingBuffer(1000));
  }
}
