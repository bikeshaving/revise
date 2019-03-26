import { Channel, FixedBuffer } from "@collabjs/channel";
import { Connection, Message, Milestone } from "../connection";

export interface WebSocketAction {
  action: string;
  id: string;
}

export interface FetchMilestone extends WebSocketAction {
  action: "fetchMilestone";
  start?: number;
}

export interface FetchMessages extends WebSocketAction {
  action: "fetchMessages";
  start?: number;
  end?: number;
}

export interface SendMilestone extends WebSocketAction {
  action: "sendMilestone";
  milestone: Milestone;
}

export interface SendMessages extends WebSocketAction {
  action: "sendMessages";
  messages: Message[];
}

export interface Subscribe extends WebSocketAction {
  action: "subscribe";
}

export class WebSocketConnection implements Connection {
  constructor(protected socket: WebSocket) {
    this.listen(socket);
  }

  protected async listen(_socket: WebSocket): Promise<void> {
    // const channel = new WebSocketChannel(socket);
    // try {
    //   for await (const message of channel) {
    //     const parsedMessage = JSON.parse(message);
    //   }
    // } catch (err) {
    //   console.log(err);
    // }
  }

  protected send(action: WebSocketAction): Promise<void> {
    const serialized = JSON.stringify(action);
    this.socket.send(serialized);
    return Promise.resolve();
  }

  fetchMilestone(id: string, start?: number): Promise<Milestone | undefined> {
    const action = { action: "fetchMilestone", id, start };
    this.send(action);
    return Promise.resolve(undefined);
  }

  // TODO: handle negative indexes?
  fetchMessages(
    id: string,
    start?: number,
    end?: number,
  ): Promise<Message[] | undefined> {
    const action = { action: "fetchMessages", id, start, end };
    this.send(action);
    return Promise.resolve(undefined);
  }

  sendMilestone(id: string, milestone: Milestone): Promise<void> {
    const action = { action: "sendMilestone", id, milestone };
    this.send(action);
    return Promise.resolve();
  }

  sendMessages(id: string, messages: Message[]): Promise<void> {
    const action = { action: "sendMessages", id, messages };
    this.send(action);
    return Promise.resolve();
  }

  subscribe(id: string): Promise<AsyncIterable<Message[]>> {
    const action = { action: "subscribe", id };
    this.send(action);
    const channel = new Channel(() => {}, new FixedBuffer<Message[]>(100));
    return Promise.resolve(channel);
  }
}
