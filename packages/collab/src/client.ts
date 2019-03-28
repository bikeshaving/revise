import { Connection, Message } from "./connection";
import { Replica } from "./replica";

export interface ClientItem {
  replica: Promise<Replica>;
  // TODO: maybe move sent to replica to replica.
  sent: number;
  inflight?: Promise<void>;
}

export class Client {
  protected items: Record<string, ClientItem> = {};

  constructor(
    public readonly id: string,
    protected readonly connection: Connection,
  ) {}

  protected async fetchReplica(id: string): Promise<Replica> {
    if (this.items[id]) {
      return this.items[id].replica;
    }
    const milestone = await this.connection.fetchMilestone(id);
    let replica: Replica;
    let version: number;
    // TODO: put replica instantiation in a callback or something
    if (milestone == null) {
      replica = new Replica(this.id);
      version = -1;
    } else {
      replica = new Replica(this.id, milestone.snapshot, [], milestone.version);
      version = milestone.version;
    }
    const messages = await this.connection.fetchMessages(id, version + 1);
    for (const message of messages || []) {
      replica.ingest(message.revision, message.latest);
    }
    return replica;
  }

  getReplica(id: string): Promise<Replica> {
    if (this.items[id] == null) {
      this.items[id] = { replica: this.fetchReplica(id), sent: -1 };
    }
    return this.items[id].replica;
  }

  async listen(id: string, cancel?: Promise<any>): Promise<void> {
    const replica = await this.getReplica(id);
    const subscription = await this.connection.subscribe(
      id,
      replica.latest + 1,
    );
    // TODO: Preemptively cancel by calling this.return if it’s defined. This will probably mean we have to return AsyncIterableIterator from connection.subscribe, or maybe I’ll just return channel I dunno.
    let cancelled = false;
    cancel && cancel.then(() => (cancelled = true));
    for await (const messages of subscription) {
      if (cancelled) {
        break;
      }
      for (const message of messages) {
        // TODO: consider the following cases
        // message.latest > replica.latest
        // message.latest > message.global
        if (message.global == null) {
          throw new Error("message missing global version");
        } else if (message.global > replica.latest + 1) {
          throw new Error("TODO: attempt repair");
        } else if (message.global < replica.latest + 1) {
          continue;
        }
        replica.ingest(message.revision, message.latest);
      }
    }
  }

  // TODO: rename to save because sync implies we’re pulling remote changes.
  // TODO: send milestones!!!
  // TODO: freeze sent revisions
  async sync(id: string): Promise<void> {
    const replica = await this.getReplica(id);
    const item = this.items[id];
    const pending = replica.pending;
    if (replica.local + pending.length > item.sent + 1) {
      const messages: Message[] = replica.pending
        .map((revision, i) => ({
          revision,
          client: this.id,
          local: replica.local + i,
          latest: replica.latest,
        }))
        .slice(item.sent + 1 - replica.local);
      item.sent = messages[messages.length - 1].local;
      item.inflight = this.connection.sendMessages(id, messages);
    }
    return item.inflight || Promise.resolve();
  }
}
