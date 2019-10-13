import { InMemoryPubSub } from "@repeaterjs/pubsub";
import { Checkpoint, Connection, Revision } from "../connection";
import { findLast } from "../utils";

interface InMemoryConnectionItem {
  clients: Record<string, number>;
  checkpoints: Checkpoint[];
  revisions: Revision[];
}

function cloneItem(item: InMemoryConnectionItem): InMemoryConnectionItem {
  return {
    checkpoints: item.checkpoints.slice(),
    clients: { ...item.clients },
    revisions: item.revisions.slice(),
  };
}

export class InMemoryConnection implements Connection {
  private closed = false;
  private pubsub = new InMemoryPubSub<number>();
  private items: Record<string, InMemoryConnectionItem> = {};

  async fetchCheckpoint(
    id: string,
    before?: number,
  ): Promise<Checkpoint | undefined> {
    if (this.closed) {
      throw new Error("Connection closed");
    }
    const checkpoints: Checkpoint[] | undefined =
      this.items[id] && this.items[id].checkpoints;
    if (checkpoints == null || !checkpoints.length) {
      return;
    } else if (before == null) {
      return checkpoints[checkpoints.length - 1];
    }
    return findLast(checkpoints, (checkpoint) => checkpoint.version <= before);
  }

  async fetchRevisions(
    id: string,
    start?: number,
    end?: number,
  ): Promise<Revision[] | undefined> {
    if (this.closed) {
      throw new Error("Connection closed");
    } else if (start != null && start < 0) {
      throw new RangeError(`start (${start}) cannot be less than 0`);
    } else if (end != null && end < 0) {
      throw new RangeError(`end (${end}) cannot be less than 0`);
    } else if (start != null && end != null && end <= start) {
      throw new RangeError(`end (${end}) cannot be less than start (${start})`);
    }
    const item = this.items[id];
    if (item == null) {
      return;
    }
    return item.revisions.slice(start, end);
  }

  async sendCheckpoint(id: string, checkpoint: Checkpoint): Promise<void> {
    if (this.closed) {
      throw new Error("Connection closed");
    }
    const item = this.items[id];
    if (
      (item == null && checkpoint.version !== 0) ||
      checkpoint.version > item.revisions.length
    ) {
      throw new Error("Missing revision");
    }
    // TODO: maybe use binary search to insert
    // https://stackoverflow.com/questions/1344500/efficient-way-to-insert-a-number-into-a-sorted-array-of-numbers
    item.checkpoints.push(checkpoint);
    item.checkpoints.sort((a, b) => a.version - b.version);
  }

  async sendRevisions(id: string, revisions: Revision[]): Promise<void> {
    if (this.closed) {
      throw new Error("Connection closed");
    }
    let item = this.items[id];
    if (item == null) {
      item = {
        clients: {},
        checkpoints: [],
        revisions: [],
      };
    } else {
      item = cloneItem(item);
    }
    this.items[id] = item;
    let version: number | undefined;
    for (const rev of revisions) {
      const expectedLocal =
        (item.clients[rev.client] == null ? -1 : item.clients[rev.client]) + 1;
      if (rev.local > expectedLocal) {
        throw new Error("Missing revision");
      } else if (rev.local < expectedLocal) {
        continue;
      } else {
        item.clients[rev.client] = rev.local;
      }
      version = item.revisions.length;
      item.revisions.push({ ...rev, version });
    }
    if (version != null) {
      this.pubsub.publish(id, version);
    }
  }

  async *subscribe(
    id: string,
    start: number = 0,
  ): AsyncIterableIterator<Revision[]> {
    if (this.closed) {
      throw new Error("Connection closed");
    } else if (start < 0) {
      throw new RangeError("start cannot be less than 0");
    }
    const revisions = await this.fetchRevisions(id, start);
    if (revisions != null && revisions.length) {
      yield revisions;
      start = revisions[revisions.length - 1].version! + 1;
    }
    for await (const end of this.pubsub.subscribe(id)) {
      if (end >= start) {
        const revisions = await this.fetchRevisions(id, start);
        if (revisions != null && revisions.length) {
          yield revisions;
        }
        start = end + 1;
      }
    }
  }

  close(): void {
    if (this.closed) {
      return;
    }
    this.closed = true;
    this.pubsub.close();
  }
}
