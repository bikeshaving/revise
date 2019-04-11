import { InMemoryPubSub } from "@channel/pubsub";
import { throttler, Token } from "@channel/limiters";
import { Connection, Message } from "./connection";
// TODO: parameterize this or something
import { Replica } from "./replica";

export interface ClientItem {
  replica: Promise<Replica>;
  subscription?: AsyncIterator<Message[]>;
  inflight?: Promise<void>;
}

export class Client {
  protected items: Record<string, ClientItem> = {};
  protected pubsub = new InMemoryPubSub<Message>();
  protected throttle: AsyncIterableIterator<Token>;
  protected closed = false;

  // TODO: allow clients to be populated with replicas which have been persisted locally
  constructor(
    public readonly id: string,
    protected readonly connection: Connection,
    options: { wait?: number } = {},
  ) {
    const { wait = 3000 } = options;
    this.throttle = throttler(wait);
  }

  protected async fetchReplica(id: string): Promise<Replica> {
    if (this.items[id]) {
      return this.items[id].replica;
    }
    const checkpoint = await this.connection.fetchCheckpoint(id);
    let replica: Replica;
    // TODO: paramaterize Replica constructor
    if (checkpoint == null) {
      replica = new Replica(this.id);
    } else {
      replica = new Replica(this.id, checkpoint.version, checkpoint.data);
    }
    const messages = await this.connection.fetchMessages(
      id,
      checkpoint == null ? 0 : checkpoint.version + 1,
    );
    for (const message of messages || []) {
      replica.ingest(message);
    }
    return replica;
  }

  getReplica(id: string): Promise<Replica> {
    if (this.items[id] == null) {
      this.items[id] = { replica: this.fetchReplica(id) };
    }
    return this.items[id].replica;
  }

  async connect(id: string): Promise<void> {
    if (this.items[id] != null && this.items[id].subscription != null) {
      throw new Error("Unknown id");
    }
    try {
      const replica = await this.getReplica(id);
      const subscription = this.connection.subscribe(id, replica.received + 1);
      this.items[id].subscription = subscription;
      for await (const messages of subscription) {
        for (let message of messages) {
          // TODO: consider the following cases
          // message.latest > replica.received
          // message.latest > message.version
          if (message.version == null) {
            throw new Error("message missing version");
          } else if (message.version > replica.received + 1) {
            throw new Error("TODO: attempt repair");
          } else if (message.version < replica.received + 1) {
            continue;
          }
          // TODO: figure out what to publish when and where in the pipeline
          this.pubsub.publish(id, replica.ingest(message));
        }
      }
    } catch (err) {
      this.disconnect(id, err);
    }
  }

  disconnect(id: string, reason?: any): void {
    this.pubsub.unpublish(id, reason);
    if (this.items[id] == null || this.items[id].subscription == null) {
      return;
    }
    this.items[id].subscription!.return!();
    delete this.items[id].subscription;
  }

  subscribe(id: string): AsyncIterableIterator<Message> {
    this.connect(id);
    return this.pubsub.subscribe(id);
  }

  enqueueSave(id: string): void {
    if (this.closed) {
      throw new Error("Client is closed");
    }
    this.save(id);
  }

  // TODO: send checkpoints!!!
  async save(id: string, options: { force?: boolean } = {}): Promise<void> {
    if (this.closed) {
      throw new Error("Client is closed");
    }
    const replica = await this.getReplica(id);
    const item = this.items[id];
    await item.inflight;
    if (!options.force) {
      await this.throttle.next();
    }
    const pending = replica.pending();
    if (pending.length) {
      item.inflight = this.connection.sendMessages(id, pending);
    }
    return item.inflight;
  }

  close(reason?: any): void {
    this.closed = true;
    this.pubsub.close(reason);
    this.throttle.return!();
  }
}
