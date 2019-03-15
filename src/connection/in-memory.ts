import { Channel, FixedBuffer } from "../channel";
import { Connection } from "../connection";
import { INITIAL_SNAPSHOT, Snapshot, Revision } from "../replica";
import { findLast } from "../utils";

export interface InMemoryConnectionItem {
  clients: Record<string, number>;
  snapshots: Snapshot[];
  revisions: Revision[];
  channels: Set<Channel<Revision[]>>;
}

export class InMemoryConnection implements Connection {
  protected items: Record<string, InMemoryConnectionItem> = {};

  async fetchSnapshot(id: string, start?: number): Promise<Snapshot> {
    const snapshots: Snapshot[] | undefined =
      this.items[id] && this.items[id].snapshots;
    if (snapshots == null || !snapshots.length) {
      return INITIAL_SNAPSHOT;
    } else if (start == null) {
      return snapshots[snapshots.length - 1];
    }
    return (
      findLast(snapshots, (snapshot) => snapshot.version <= start) ||
      snapshots[0]
    );
  }

  // TODO: handle negative indexes
  async fetchRevisions(
    id: string,
    start?: number,
    end?: number,
  ): Promise<Revision[]> {
    const item = this.items[id];
    if (item == null) {
      return [];
    }
    return item.revisions.slice(start, end);
  }

  async sendSnapshot(id: string, snapshot: Snapshot): Promise<void> {
    const item = this.items[id];
    if (item == null) {
      this.items[id] = {
        clients: {},
        snapshots: [snapshot],
        revisions: [],
        channels: new Set(),
      };
      return;
    }
    const { snapshots } = item;
    // TODO: use binary search or a quick sort algorithm
    // https://stackoverflow.com/questions/1344500/efficient-way-to-insert-a-number-into-a-sorted-array-of-numbers
    snapshots.push(snapshot);
    snapshots.sort((a, b) => a.version - b.version);
  }

  // TODO: don’t mutate here so we can error all or nothing
  protected saveRevision(id: string, rev: Revision): Revision | undefined {
    const item = this.items[id];
    if (item == null) {
      if (rev.local !== 0) {
        throw new Error("Unknown document");
      }
      rev = { ...rev, global: 0 };
      this.items[id] = {
        clients: { [rev.client]: 0 },
        snapshots: [],
        revisions: [rev],
        channels: new Set(),
      };
      return rev;
    }
    const { clients, revisions } = item;
    const local = clients[rev.client] == null ? -1 : clients[rev.client];
    // TODO: reject rev if latest is too far off global version
    // TODO: reject if we don’t have a recent-enough snapshot
    if (rev.local > local + 1) {
      // TODO: figure out how to allow repair
      throw new Error("Missing revision");
    } else if (rev.local < local + 1) {
      return;
    }
    rev = { ...rev, global: revisions.length };
    revisions.push(rev);
    clients[rev.client] = rev.local;
    return rev;
  }

  // TODO: run this in a transaction
  async sendRevisions(id: string, revisions: Revision[]): Promise<void> {
    const revisions1: Revision[] = [];
    for (const rev of revisions) {
      const rev1 = this.saveRevision(id, rev);
      if (rev1) {
        revisions1.push(rev1);
      }
    }
    const { channels } = this.items[id];
    await Promise.all(
      Array.from(channels).map(async (channel) => {
        try {
          await channel.put(revisions1);
        } catch (err) {
          // TODO: do something more???
          channel.close();
        }
      }),
    );
  }

  async subscribe(
    id: string,
    start: number,
  ): Promise<AsyncIterable<Revision[]>> {
    let item = this.items[id];
    // TODO: stop throwing you piece of shit
    if (item == null) {
      item = this.items[id] = {
        clients: {},
        snapshots: [],
        revisions: [],
        channels: new Set(),
      };
    }
    const { channels } = item;
    const channel = new Channel(new FixedBuffer<Revision[]>(100));
    const revisions = await this.fetchRevisions(id, start);
    if (revisions.length) {
      channel.put(revisions);
    }
    channels.add(channel);
    channel.onclose = () => {
      channels.delete(channel);
    };
    return channel;
  }
}
