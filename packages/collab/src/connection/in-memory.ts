import { InMemoryPubSub } from "@collabjs/channel";
import { Connection, Message, Milestone } from "../connection";
import { findLast } from "../utils";

interface InMemoryConnectionItem {
  clients: Record<string, number>;
  messages: Message[];
  milestones: Milestone[];
}

function cloneItem(item: InMemoryConnectionItem): InMemoryConnectionItem {
  return {
    clients: { ...item.clients },
    messages: item.messages.slice(),
    milestones: item.milestones.slice(),
  };
}

export class InMemoryConnection implements Connection {
  protected pubsub = new InMemoryPubSub<number>();
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

  fetchMessages(
    id: string,
    start?: number,
    end?: number,
  ): Promise<Message[] | undefined> {
    const item = this.items[id];
    if (item == null) {
      return Promise.resolve(undefined);
    } else if (start != null && start < 0) {
      throw new RangeError("start cannot be negative");
    } else if (end != null && end < 0) {
      throw new RangeError("end cannot be negative");
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
    return Promise.resolve();
  }

  sendMessages(id: string, messages: Message[]): Promise<void> {
    let item = this.items[id];
    if (item == null) {
      item = {
        clients: {},
        messages: [],
        milestones: [],
      };
    } else {
      item = cloneItem(item);
    }
    this.items[id] = item;
    let global: number | undefined;
    for (const message of messages) {
      const expected =
        (item.clients[message.client] == null
          ? -1
          : item.clients[message.client]) + 1;
      if (message.local > expected) {
        return Promise.reject(new Error("TODO: repair"));
      } else if (message.local < expected) {
        continue;
      }
      item.clients[message.client] = message.local;
      global = item.messages.length;
      item.messages.push({ ...message, global });
    }
    if (global != null) {
      return this.pubsub.publish(id, global);
    }
    return Promise.resolve();
  }

  async *subscribe(
    id: string,
    start: number = 0,
  ): AsyncIterableIterator<Message[]> {
    if (start < 0) {
      throw new RangeError("start cannot be less than 0");
    }
    for await (const latest of this.pubsub.subscribe(id)) {
      if (latest + 1 > start) {
        const messages = await this.fetchMessages(id, start, latest + 1);
        if (messages != null && messages.length) {
          yield messages;
        }
        start = latest + 1;
      }
    }
  }
}
