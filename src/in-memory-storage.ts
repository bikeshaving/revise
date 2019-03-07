import { Channel, FixedBuffer } from "./channel";
import { Connection } from "./client";
import { Snapshot, Revision } from "./document";

export class InMemoryStorage implements Connection {
  protected clientVersionsById: Record<string, Record<string, number>> = {};
  protected snapshotsById: Record<string, Snapshot[]> = {};
  protected revisionsById: Record<string, Revision[]> = {};
  protected channelsById: Record<string, Channel<Revision[]>[]> = {};

  async fetchRevisions(
    id: string,
    from?: number,
    to?: number,
  ): Promise<Revision[]> {
    if (this.clientVersionsById[id] == null) {
      throw new Error("Unknown document");
    }
    if (from == null) {
      const snapshots = this.snapshotsById[id];
      if (snapshots.length) {
        from = snapshots[snapshots.length - 1].version + 1;
      } else {
        from = 0;
      }
    }
    return this.revisionsById[id].slice(from, to);
  }

  async fetchSnapshot(id: string, min?: number): Promise<Snapshot> {
    if (this.clientVersionsById[id] == null) {
      throw new Error("Unknown document");
    }
    const snapshots = this.snapshotsById[id];
    if (snapshots == null || !snapshots.length) {
      return { visible: "", hidden: "", hiddenSeq: [], version: -1 };
    } else if (min == null) {
      return snapshots[snapshots.length - 1];
    }
    for (let i = snapshots.length - 1; i > 0; i--) {
      const snapshot = snapshots[i];
      if (snapshot.version <= min) {
        return snapshot;
      }
    }
    return snapshots[0];
  }

  saveRevision(id: string, rev: Revision): Revision {
    const clientVersions: Record<string, number> = this.clientVersionsById[id];
    if (clientVersions == null) {
      if (rev.local !== 0) {
        throw new Error("Unknown document");
      }
      this.clientVersionsById[id] = {};
      this.clientVersionsById[id][rev.client] = rev.local;
      rev = { ...rev, global: 0 };
      this.revisionsById[id] = [rev];
      this.snapshotsById[id] = [];
      this.channelsById[id] = [];
      return rev;
    }
    const expectedLocalVersion =
      clientVersions[rev.client] == null ? 0 : clientVersions[rev.client] + 1;
    // TODO: reject rev if latest is too far off current version
    // TODO: reject if we don’t have a recent-enough snapshot
    if (rev.local > expectedLocalVersion) {
      throw new Error("Missing rev");
    } else if (rev.local < expectedLocalVersion) {
      if (rev.global === 0 && rev.client !== this.revisionsById[id][0].client) {
        throw new Error("Document already exists");
      }
      return rev;
    }
    rev = { ...rev, global: this.revisionsById[id].length };
    this.revisionsById[id].push(rev);
    clientVersions[rev.client] = rev.local;
    return rev;
  }

  // TODO: run this in a transaction
  async sendRevisions(id: string, revisions: Revision[]): Promise<Revision[]> {
    revisions = revisions.map((rev) => this.saveRevision(id, rev));
    this.channelsById[id].map(async (channel, i) => {
      try {
        await channel.put(revisions);
      } catch (err) {
        channel.close();
        this.channelsById[id].splice(i, 1);
      }
    });
    return revisions;
  }

  async sendSnapshot(id: string, snapshot: Snapshot): Promise<Snapshot> {
    if (this.clientVersionsById[id] == null) {
      throw new Error("Unknown document");
    }
    const snapshots = this.snapshotsById[id];
    if (!snapshots.length) {
      snapshots.push(snapshot);
      return snapshot;
    }
    for (let i = snapshots.length - 1; i > 0; i--) {
      const snapshot1 = snapshots[i];
      if (snapshot1.version === snapshot.version) {
        return snapshot;
      } else if (snapshot1.version < snapshot.version) {
        snapshots.splice(i + 1, 0, snapshot);
        return snapshot;
      }
    }
    snapshots.unshift(snapshot);
    return snapshot;
  }

  async updates(id: string, from?: number): Promise<AsyncIterable<Revision[]>> {
    if (this.clientVersionsById[id] == null) {
      throw new Error("Unknown document");
    }
    let channels: Channel<Revision[]>[] = this.channelsById[id];
    const channel = new Channel(new FixedBuffer<Revision[]>(1000));
    channels.push(channel);
    channel.onclose = () => {
      const i = channels.indexOf(channel);
      if (i > -1) {
        channels.splice(i, 1);
      }
    };
    if (from != null) {
      const revisions = await this.fetchRevisions(id, from);
      channel.put(revisions);
    }
    return channel;
  }

  async close(id: string): Promise<void> {
    if (this.clientVersionsById[id] == null) {
      throw new Error("Unknown document");
    }
    await Promise.all(this.channelsById[id].map((channel) => channel.close()));
    this.channelsById[id] = [];
  }
}
