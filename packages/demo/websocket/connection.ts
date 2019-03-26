import {
  Connection,
  Message,
  Milestone,
} from "@collabjs/collab/lib/connection";
import { Action } from "./actions";

export class WebSocketConnection implements Connection {
  protected buffer: Action[] = [];
  protected requests: [(value?: any) => void, (reason: any) => void][] = [];
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
    switch (message.action) {
      case "sendMessages": {
        const request = this.requests[message.requestId];
        delete this.requests[message.requestId];
        if (!request) {
          return;
        }
        const [resolve] = request;
        resolve(message.messages);
        break;
      }
      case "sendMilestone": {
        const request = this.requests[message.requestId];
        delete this.requests[message.requestId];
        if (!request) {
          return;
        }
        const [resolve] = request;
        resolve(message.milestone);
        break;
      }
      case "acknowledge": {
        const request = this.requests[message.requestId];
        delete this.requests[message.requestId];
        if (!request) {
          return;
        }
        const [resolve] = request;
        resolve();
        break;
      }
    }
  }

  protected send(action: Action): void {
    if (this.socket.readyState === WebSocket.CONNECTING) {
      this.buffer.push(action);
      return;
    } else if (
      this.socket.readyState === WebSocket.CLOSING ||
      this.socket.readyState === WebSocket.CLOSED
    ) {
      throw new Error("WebSocket is closed or closing 🤮");
    }
    const serialized = JSON.stringify(action);
    this.socket.send(serialized);
  }

  fetchMilestone(id: string, start?: number): Promise<Milestone | undefined> {
    const action: Action = {
      type: "fetchMilestone",
      id,
      start,
      requestId: this.nextRequestId++,
    };
    this.send(action);
    return new Promise((resolve, reject) => {
      this.requests[action.requestId] = [resolve, reject];
    });
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
      requestId: this.nextRequestId++,
    };
    this.send(action);
    return new Promise((resolve, reject) => {
      this.requests[action.requestId] = [resolve, reject];
    });
  }

  sendMilestone(id: string, milestone: Milestone): Promise<void> {
    const action: Action = {
      type: "sendMilestone",
      id,
      milestone,
      requestId: this.nextRequestId++,
    };
    this.send(action);
    return new Promise((resolve, reject) => {
      this.requests[action.requestId] = [resolve, reject];
    });
  }

  sendMessages(id: string, messages: Message[]): Promise<void> {
    const action: Action = {
      type: "sendMessages",
      id,
      messages,
      requestId: this.nextRequestId++,
    };
    this.send(action);
    return new Promise((resolve, reject) => {
      this.requests[action.requestId] = [resolve, reject];
    });
  }

  subscribe(id: string): Promise<AsyncIterable<Message[]>> {
    const action: Action = {
      type: "subscribe",
      id,
      requestId: this.nextRequestId++,
    };
    this.send(action);
    return new Promise((resolve, reject) => {
      this.requests[action.requestId] = [resolve, reject];
    });
  }
}
