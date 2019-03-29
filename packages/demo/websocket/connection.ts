import {
  Connection,
  Message,
  Milestone,
} from "@collabjs/collab/lib/connection";
import { Channel, FixedBuffer } from "@collabjs/channel";
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
    socket.onclose = (ev) => {
      console.log("close", ev);
    };
    socket.onerror = (ev) => {
      console.log("error", ev);
    };
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

  protected handleMessage(ev: MessageEvent): void {
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
      case "sendNothing": {
        request.resolve();
        break;
      }
      case "sendMessages": {
        request.resolve(message.messages);
        break;
      }
      case "sendMilestone": {
        request.resolve(message.milestone);
        break;
      }
      case "acknowledge": {
        request.resolve();
        break;
      }
      case "subscribe": {
        const channel: Channel<Message[]> = new Channel((resolve, reject) => {
          this.requests[message.reqId] = { resolve, reject, persist: true };
        }, new FixedBuffer(1024));
        request.resolve(channel);
        break;
      }
      default: {
        throw new Error(`Unknown action type: ${message.type}`);
      }
    }
  }

  protected send(action: Action): Promise<any> {
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
      return Promise.resolve();
    }
    return new Promise(
      (resolve, reject) => (this.requests[action.reqId] = { resolve, reject }),
    );
  }

  fetchMilestone(id: string, start?: number): Promise<Milestone | undefined> {
    const action: Action = {
      type: "fetchMilestone",
      id,
      start,
      reqId: this.nextRequestId++,
    };
    return this.send(action);
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

  sendMilestone(id: string, milestone: Milestone): Promise<void> {
    const action: Action = {
      type: "sendMilestone",
      id,
      milestone,
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

  subscribe(id: string, start: number): Promise<AsyncIterable<Message[]>> {
    const action: Action = {
      type: "subscribe",
      id,
      reqId: this.nextRequestId++,
      start,
    };
    return this.send(action);
  }
}
