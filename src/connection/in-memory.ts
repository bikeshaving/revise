import { Channel, FixedBuffer } from "../channel";
import { Connection, Message, Milestone } from "../connection";
import { findLast } from "../utils";

interface InMemoryConnectionItem {
  channels: Set<Channel<Message[]>>;
  clients: Record<string, number>;
  messages: Message[];
  milestones: Milestone[];
}

function cloneItem(item: InMemoryConnectionItem): InMemoryConnectionItem {
  return {
    channels: new Set(item.channels),
    clients: { ...item.clients },
    messages: item.messages.slice(),
    milestones: item.milestones.slice(),
  };
}

export class InMemoryConnection implements Connection {
  protected items: Record<string, InMemoryConnectionItem> = {};

  fetchMilestone(id: string, before?: number): Promise<Milestone | undefined> {
    const milestones: Milestone[] | undefined =
      this.items[id] && this.items[id].milestones;
    if (milestones == null || !milestones.length) {
      return Promise.resolve(undefined);
    } else if (before == null) {
      return Promise.resolve(milestones[milestones.length - 1]);
    }
    return Promise.resolve(
      findLast(milestones, (milestone) => milestone.version <= before),
    );
  }

  // TODO: handle negative indexes?
  fetchMessages(
    id: string,
    start?: number,
    end?: number,
  ): Promise<Message[] | undefined> {
    const item = this.items[id];
    if (item == null) {
      return Promise.resolve(undefined);
    }
    return Promise.resolve(item.messages.slice(start, end));
  }

  sendMilestone(id: string, milestone: Milestone): Promise<void> {
    const item = this.items[id];
    if (
      (item == null && milestone.version !== 0) ||
      milestone.version > item.messages.length
    ) {
      return Promise.reject(new Error("Missing message"));
    }
    // TODO: use binary search to insert
    // https://stackoverflow.com/questions/1344500/efficient-way-to-insert-a-number-into-a-sorted-array-of-numbers
    item.milestones.push(milestone);
    item.milestones.sort((a, b) => a.version - b.version);
    return Promise.resolve(undefined);
  }

  sendMessages(id: string, messages: Message[]): Promise<void> {
    let item = this.items[id];
    if (item == null) {
      item = {
        channels: new Set(),
        clients: {},
        messages: [],
        milestones: [],
      };
    } else {
      item = cloneItem(item);
    }
    const start = item.messages.length;
    for (const message of messages) {
      const expected =
        (item.clients[message.client] == null
          ? -1
          : item.clients[message.client]) + 1;
      if (message.local > expected) {
        return Promise.reject(new Error("Missing message"));
      } else if (message.local < expected) {
        continue;
      }
      item.clients[message.client] = message.local;
      item.messages.push({
        ...message,
        global: item.messages.length,
      });
    }
    this.items[id] = item;
    return Promise.all(
      Array.from(item.channels).map(async (channel) => {
        try {
          await channel.put(item.messages.slice(start));
        } catch (err) {
          // TODO: do something more???
          channel.close();
        }
      }),
    ).then(() => {});
  }

  subscribe(id: string, start: number): Promise<AsyncIterable<Message[]>> {
    let item = this.items[id];
    if (item == null) {
      item = this.items[id] = {
        channels: new Set(),
        clients: {},
        messages: [],
        milestones: [],
      };
    }
    const channel = new Channel(new FixedBuffer<Message[]>(100));
    const messages = item.messages.slice(start);
    if (messages.length) {
      channel.put(messages);
    }
    item.channels.add(channel);
    channel.onclose = () => {
      item.channels.delete(channel);
    };
    return Promise.resolve(channel);
  }
}
