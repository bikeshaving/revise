import { InMemoryPubSub } from "@channel/pubsub";
import { throttler, Token } from "@channel/limiters";
import { Connection, Message } from "./connection";
// TODO: parameterize this or something
import { Replica } from "./replica";

export interface ClientItem {
  replica: Promise<Replica>;
  subscription?: AsyncIterator<Message[]>;
  inflight?: Promise<void> | void;
}

export class Client {
  protected items: Record<string, ClientItem> = {};
  protected pubsub = new InMemoryPubSub<Message>();
  protected throttle: AsyncIterableIterator<Token>;
  protected closed = false;

  // TODO: allow clients to be populated with replicas which have been persisted locally
  constructor(
    public readonly id: string,
    public conn: Connection,
    options: { wait?: number } = {},
  ) {
    const { wait = 3000 } = options;
    this.throttle = throttler(wait, { cooldown: true });
  }

  protected async fetchReplica(id: string): Promise<Replica> {
    if (this.items[id]) {
      return this.items[id].replica;
    }
    const checkpoint = await this.conn.fetchCheckpoint(id);
    // TODO: paramaterize Replica constructor
    const replica = new Replica(this.id, checkpoint);
    const messages = await this.conn.fetchMessages(
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
    try {
      if (this.items[id] != null && this.items[id].subscription != null) {
        throw new Error("Unknown id");
      }
      const replica = await this.getReplica(id);
      const subscription = this.conn.subscribe(id, replica.received + 1);
      this.items[id].subscription = subscription;
      for await (const messages of subscription) {
        for (const message of messages) {
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
          replica.ingest(message);
          this.pubsub.publish(id, message);
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
    this.save(id).catch((err) => this.disconnect(id, err));
  }

  // TODO: send checkpoint
  async save(id: string, options: { force?: boolean } = {}): Promise<void> {
    if (this.closed) {
      throw new Error("Client is closed");
    }
    const { force = false } = options;
    const replica = await this.getReplica(id);
    const item = this.items[id];
    await item.inflight;
    if (!force) {
      await this.throttle.next();
    }
    const pending = replica.pending();
    if (pending.length) {
      item.inflight = this.conn.sendMessages(id, pending);
    }
    return item.inflight;
  }

  close(reason?: any): void {
    this.closed = true;
    this.pubsub.close(reason);
    this.throttle.return!();
  }
}
