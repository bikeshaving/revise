import { Channel, FixedBuffer } from "../channel";
import { Connection, Message, Milestone } from "../connection";

export class WebSocketConnection implements Connection {
  constructor(protected socket: WebSocket) {}

  fetchMilestone(): Promise<Milestone | undefined> {
    return Promise.resolve(undefined);
  }

  // TODO: handle negative indexes?
  fetchMessages(): Promise<Message[] | undefined> {
    return Promise.resolve(undefined);
  }

  sendMilestone(): Promise<void> {
    return Promise.resolve();
  }

  sendMessages(): Promise<void> {
    return Promise.resolve();
  }

  subscribe(): Promise<AsyncIterableIterator<Message[]>> {
    const channel = new Channel(new FixedBuffer<Message[]>(100));
    return Promise.resolve(channel);
  }
}
