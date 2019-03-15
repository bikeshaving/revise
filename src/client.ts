import { Connection } from "./connection";
import { Replica } from "./replica";

export interface ClientItem {
  replica: Replica;
  sent: number;
}

export class Client {
  protected items: Record<string, ClientItem> = {};
  protected pending: Record<string, Promise<Replica>> = {};
  constructor(public id: string, public connection: Connection) {}

  async fetchReplica(id: string): Promise<Replica> {
    if (this.items[id]) {
      return this.items[id].replica;
    }
    const snapshot = await this.connection.fetchSnapshot(id);
    const revisions = await this.connection.fetchRevisions(
      id,
      // TODO: make initial snapshot version 0 so we don’t have to do this
      snapshot.version < 0 ? undefined : snapshot.version,
    );
    const replica = Replica.from(this.id, snapshot, revisions);
    this.items[id] = { replica, sent: -1 };
    delete this.pending[id];
    return replica;
  }

  getReplica(id: string): Promise<Replica> {
    this.pending[id] = this.pending[id] || this.fetchReplica(id);
    return this.pending[id];
  }

  // TODO: cancel from outside loop?
  async listen(id: string): Promise<void> {
    const replica = await this.getReplica(id);
    const subscription = await this.connection.subscribe(id, replica.latest);
    for await (const revisions of subscription) {
      for (const rev of revisions) {
        // TODO: ERROR HANDLING
        replica.ingest(rev);
      }
    }
  }

  // TODO: wait for pending sendRevisions.......
  async sync(id: string): Promise<void> {
    const replica = await this.getReplica(id);
    const item = this.items[id];
    const pending = replica.pending;
    if (pending.length) {
      const local = pending[pending.length - 1].local;
      if (local > item.sent) {
        await this.connection.sendRevisions(
          id,
          pending.slice(item.sent - local),
        );
      }
      item.sent = local;
    }
  }
}
