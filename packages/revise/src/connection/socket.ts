import { Channel, ChannelBuffer } from "@channel/channel";
import { Checkpoint, Connection, Message } from "./index";

export interface AbstractAction {
  type: string;
  id: string;
  reqId: number;
}

export interface AcknowledgeAction extends AbstractAction {
  type: "ack";
}

export interface FetchCheckpointAction extends AbstractAction {
  type: "fc";
  start?: number;
}

export interface FetchMessagesAction extends AbstractAction {
  type: "fm";
  start?: number;
  end?: number;
}

export interface SendCheckpointAction extends AbstractAction {
  type: "sc";
  checkpoint: Checkpoint;
}

export interface SendMessagesAction extends AbstractAction {
  type: "sm";
  messages: Message[];
}

export interface SubscribeAction extends AbstractAction {
  type: "sub";
  start?: number;
}

export interface ErrorAction extends AbstractAction {
  type: "err";
  name: string;
  message: string;
}

export type Action =
  | AcknowledgeAction
  | ErrorAction
  | FetchCheckpointAction
  | FetchMessagesAction
  | SendCheckpointAction
  | SendMessagesAction
  | SubscribeAction;

export type Socket = WebSocket | RTCDataChannel;

export function listen<T = any>(
  socket: Socket,
  buffer?: ChannelBuffer<T>,
): Channel<T> {
  return new Channel(async (push, stop) => {
    const handleMessage = (ev: any) => push(ev.data);
    const handleError = () => stop(new Error("Socket Error"));
    const handleClose = () => stop();
    socket.addEventListener("message", handleMessage);
    socket.addEventListener("error", handleError);
    socket.addEventListener("close", handleClose);
    await stop;
    socket.close();
    socket.removeEventListener("message", handleMessage);
    socket.removeEventListener("error", handleError);
    socket.removeEventListener("close", handleClose);
  }, buffer);
}

type Hook = (action: Action) => Promise<void> | void;

export class SocketProxy {
  private hooks: Set<Hook> = new Set();
  constructor(private socket: Socket, private conn: Connection) {}

  private send(action: Action): void {
    // TODO: serialize hook
    this.socket.send(JSON.stringify(action));
  }

  private async fetchCheckpoint(action: FetchCheckpointAction): Promise<void> {
    const { id, reqId, start } = action;
    const checkpoint = await this.conn.fetchCheckpoint(id, start);
    if (checkpoint == null) {
      this.send({ type: "ack", id, reqId });
    } else {
      this.send({ type: "sc", id, reqId, checkpoint });
    }
  }

  private async fetchMessages(action: FetchMessagesAction): Promise<void> {
    const { id, reqId, start, end } = action;
    const messages = await this.conn.fetchMessages(id, start, end);
    if (messages == null) {
      this.send({ type: "ack", id, reqId });
    } else {
      this.send({ type: "sm", id, reqId, messages });
    }
  }

  private async sendCheckpoint(action: SendCheckpointAction): Promise<void> {
    const { id, reqId, checkpoint } = action;
    await this.conn.sendCheckpoint(id, checkpoint);
    this.send({ type: "ack", id, reqId });
  }

  private async sendMessages(action: SendMessagesAction): Promise<void> {
    const { id, reqId, messages } = action;
    await this.conn.sendMessages(id, messages);
    this.send({ type: "ack", id, reqId });
  }

  private async subscribe(action: SubscribeAction): Promise<void> {
    const { id, reqId, start } = action;
    this.send({ type: "ack", id, reqId });
    for await (const messages of this.conn.subscribe(id, start)) {
      if (messages != null) {
        this.send({ type: "sm", id, reqId, messages });
      }
    }
    this.send({ type: "ack", id, reqId });
  }

  private sendError(action: Action, err: unknown): void {
    const { id, reqId } = action;
    let name = "Error";
    let message = "Unknown error";
    if (err instanceof Error) {
      ({ name, message } = err);
    }
    this.send({ type: "err", id, reqId, name, message });
  }

  async connect(): Promise<void> {
    for await (const data of listen(this.socket)) {
      // TODO: handle parsing/validation errors
      let action: Action = JSON.parse(data);
      try {
        for (const hook of this.hooks) {
          await hook(action);
        }
        switch (action.type) {
          case "fc": {
            await this.fetchCheckpoint(action);
            break;
          }
          case "fm": {
            await this.fetchMessages(action);
            break;
          }
          case "sc": {
            await this.sendCheckpoint(action);
            break;
          }
          case "sm": {
            await this.sendMessages(action);
            break;
          }
          case "sub": {
            this.subscribe(action).catch((err) => this.sendError(action, err));
            break;
          }
          default: {
            throw new Error(`Invalid action type: ${action.type}`);
          }
        }
      } catch (err) {
        this.sendError(action, err);
      }
    }
    return this.conn.close();
  }

  addHook(hook: Hook): void {
    this.hooks.add(hook);
  }

  removeHook(hook: Hook): void {
    this.hooks.delete(hook);
  }

  close(): void {
    this.socket.close();
  }
}

interface Procedure {
  type: "procedure";
  resolve(value?: any): void;
  reject(reason: any): void;
  promise: Promise<any>;
}

interface Subscription {
  type: "subscription";
  push(value: any): void;
  stop(reason?: any): void;
}

type Request = Procedure | Subscription;

export enum SocketConnectionState {
  CONNECTING,
  OPEN,
  CLOSED,
}

export class SocketConnection implements Connection {
  private buffer: Action[] = [];
  private reqs: Request[] = [];
  private nextReqId = 0;
  private state = SocketConnectionState.CONNECTING;
  constructor(private socket: Socket) {
    socket.addEventListener("open", () => {
      this.state = SocketConnectionState.OPEN;
      for (const action of this.buffer) {
        this.send(action);
      }
      this.buffer = [];
    });
    this.connect()
      .then(() => this.close())
      .catch((err) => this.close(err));
  }

  private async connect(): Promise<void> {
    for await (const data of listen(this.socket)) {
      // TODO: validate action
      // TODO: deserialize hook
      const action: Action = JSON.parse(data);
      const req = this.reqs[action.reqId];
      if (req == null) {
        continue;
      } else if (req.type === "procedure") {
        delete this.reqs[action.reqId];
      }
      switch (action.type) {
        case "ack": {
          if (req.type === "procedure") {
            req.resolve();
          } else {
            req.stop();
            delete this.reqs[action.reqId];
          }
          break;
        }
        case "err": {
          if (req.type === "procedure") {
            req.reject(new Error(action.message));
          } else {
            req.stop(new Error(action.message));
          }
          break;
        }
        case "sm": {
          if (req.type === "procedure") {
            req.resolve(action.messages);
          } else {
            req.push(action.messages);
          }
          break;
        }
        case "sc": {
          if (req.type === "procedure") {
            req.resolve(action.checkpoint);
          } else {
            req.stop(new Error("Invalid value received"));
          }
          break;
        }
        default: {
          const error = new Error(`Invalid action type: ${action.type}`);
          if (req.type === "procedure") {
            req.reject(error);
          } else {
            req.stop(error);
          }
        }
      }
    }
  }

  private async send(action: Action): Promise<any> {
    if (this.state >= SocketConnectionState.CLOSED) {
      throw new Error("Connection closed");
    } else if (this.state >= SocketConnectionState.OPEN) {
      // TODO: serialize hook
      this.socket.send(JSON.stringify(action));
    } else {
      this.buffer.push(action);
    }

    const req = this.reqs[action.reqId];
    if (req != null) {
      if (req.type === "subscription") {
        throw new Error("Procedure expected for reqId but subscription found");
      }
      return req.promise;
    }

    let resolve: (value: any) => void;
    let reject: (err: any) => void;
    const promise = new Promise((resolve1, reject1) => {
      resolve = resolve1;
      reject = reject1;
    });
    this.reqs[action.reqId] = {
      type: "procedure",
      resolve: resolve!,
      reject: reject!,
      promise,
    };
    return promise;
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
    const chan = new Channel<Message[]>(async (push, stop) => {
      if (this.state >= SocketConnectionState.CLOSED) {
        throw new Error("Connection closed");
      }
      const action: Action = {
        type: "sub",
        id,
        reqId: this.nextReqId++,
        start,
      };
      await Promise.race([this.send(action), stop]);
      this.reqs[action.reqId] = { type: "subscription", push, stop };
      await stop;
      delete this.reqs[action.reqId];
    }, buffer);
    return chan;
  }

  close(err?: any): void {
    if (this.state >= SocketConnectionState.CLOSED) {
      return;
    }
    this.state = SocketConnectionState.CLOSED;
    this.socket.close();
    for (const req of this.reqs) {
      if (req != null) {
        if (req.type === "subscription") {
          req.stop(err);
        } else {
          req.reject(err || new Error("Connection closed"));
        }
      }
    }
    this.reqs = [];
  }
}
