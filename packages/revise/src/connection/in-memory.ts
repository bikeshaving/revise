import { InMemoryPubSub } from "@channel/pubsub";
import { Checkpoint, Connection, Message } from "../connection";
import { findLast } from "../utils";

interface InMemoryConnectionItem {
  checkpoints: Checkpoint[];
  clients: Record<string, number>;
  messages: Message[];
}

function cloneItem(item: InMemoryConnectionItem): InMemoryConnectionItem {
  return {
    checkpoints: item.checkpoints.slice(),
    clients: { ...item.clients },
    messages: item.messages.slice(),
  };
}

export class InMemoryConnection implements Connection {
  protected pubsub = new InMemoryPubSub<number>();
  protected items: Record<string, InMemoryConnectionItem> = {};

  async fetchCheckpoint(
    id: string,
    before?: number,
  ): Promise<Checkpoint | undefined> {
    const checkpoints: Checkpoint[] | undefined =
      this.items[id] && this.items[id].checkpoints;
    if (checkpoints == null || !checkpoints.length) {
      return;
    } else if (before == null) {
      return checkpoints[checkpoints.length - 1];
    }
    return findLast(checkpoints, (checkpoint) => checkpoint.version <= before);
  }

  async fetchMessages(
    id: string,
    start?: number,
    end?: number,
  ): Promise<Message[] | undefined> {
    const item = this.items[id];
    if (start != null && start < 0) {
      throw new RangeError(`start (${start}) cannot be less than 0`);
    } else if (end != null && end < 0) {
      throw new RangeError(`end (${end}) cannot be less than 0`);
    } else if (start != null && end != null && end <= start) {
      throw new RangeError(`end (${end}) cannot be less than start (${start})`);
    } else if (item == null) {
      return;
    }
    return item.messages.slice(start, end);
  }

  async sendCheckpoint(id: string, checkpoint: Checkpoint): Promise<void> {
    const item = this.items[id];
    if (
      (item == null && checkpoint.version !== 0) ||
      checkpoint.version > item.messages.length
    ) {
      throw new Error("Missing message");
    }
    // TODO: maybe use binary search to insert
    // https://stackoverflow.com/questions/1344500/efficient-way-to-insert-a-number-into-a-sorted-array-of-numbers
    item.checkpoints.push(checkpoint);
    item.checkpoints.sort((a, b) => a.version - b.version);
  }

  async sendMessages(id: string, messages: Message[]): Promise<void> {
    let item = this.items[id];
    if (item == null) {
      item = {
        clients: {},
        messages: [],
        checkpoints: [],
      };
    } else {
      item = cloneItem(item);
    }
    this.items[id] = item;
    let version: number | undefined;
    for (const message of messages) {
      const expectedLocal =
        (item.clients[message.client] == null
          ? -1
          : item.clients[message.client]) + 1;
      if (message.local > expectedLocal) {
        throw new Error("Missing message");
      } else if (message.local < expectedLocal) {
        continue;
      } else {
        item.clients[message.client] = message.local;
      }
      version = item.messages.length;
      item.messages.push({ ...message, version });
    }
    if (version != null) {
      this.pubsub.publish(id, version);
    }
  }

  async *subscribe(
    id: string,
    start: number = 0,
  ): AsyncIterableIterator<Message[]> {
    if (start < 0) {
      throw new RangeError("start cannot be less than 0");
    }
    const messages = await this.fetchMessages(id, start);
    if (messages != null && messages.length) {
      yield messages;
      start = messages[messages.length - 1].version! + 1;
    }
    for await (const end of this.pubsub.subscribe(id)) {
      if (end >= start) {
        const messages = await this.fetchMessages(id, start);
        if (messages != null && messages.length) {
          yield messages;
        }
        start = end + 1;
      }
    }
  }
}
