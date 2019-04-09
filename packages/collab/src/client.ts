import { InMemoryPubSub } from "@channel/pubsub";
import { throttler, Token } from "@channel/limiters";
import { Connection, Message } from "./connection";
// TODO: parameterize this or something
import { Replica } from "./replica";

export interface ClientItem {
  replica: Promise<Replica>;
  // TODO: move sent to replica.
  sent: number;
  subscription?: AsyncIterator<Message[]>;
  inflight?: Promise<void>;
}

export class Client {
  protected items: Record<string, ClientItem> = {};
  protected pubsub = new InMemoryPubSub<Message>();
  protected tokens: AsyncIterableIterator<Token>;
  protected closed = false;

  // TODO: allow clients to be populated with replicas which have been persisted locally
  constructor(
    public readonly id: string,
    protected readonly connection: Connection,
    options: { wait?: number } = {},
  ) {
    const { wait = 3000 } = options;
    this.tokens = throttler(wait);
  }

  protected async fetchReplica(id: string): Promise<Replica> {
    if (this.items[id]) {
      return this.items[id].replica;
    }
    const milestone = await this.connection.fetchMilestone(id);
    let replica: Replica;
    // TODO: put replica instantiation in a callback or something
    if (milestone == null) {
      replica = new Replica(this.id);
    } else {
      replica = new Replica(this.id, milestone.version, milestone.snapshot);
    }
    const messages = await this.connection.fetchMessages(
      id,
      replica.latest + 1,
    );
    for (const message of messages || []) {
      replica.ingest(message.revision, message.latest);
    }
    return replica;
  }

  getReplica(id: string): Promise<Replica> {
    if (this.items[id] == null) {
      this.items[id] = {
        replica: this.fetchReplica(id),
        sent: -1,
      };
    }
    return this.items[id].replica;
  }

  async connect(id: string): Promise<void> {
    if (this.items[id] != null && this.items[id].subscription != null) {
      throw new Error("Unknown id");
    }
    try {
      const replica = await this.getReplica(id);
      const subscription = this.connection.subscribe(id, replica.latest + 1);
      this.items[id].subscription = subscription;
      for await (const messages of subscription) {
        for (let message of messages) {
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
          const revision = replica.ingest(message.revision, message.latest);
          this.pubsub.publish(id, {
            ...message,
            latest: replica.latest - 1,
            revision,
          });
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

  // TODO: send milestones!!!
  async save(id: string, options: { force?: boolean } = {}): Promise<void> {
    if (this.closed) {
      throw new Error("Client is closed");
    } else if (!options.force) {
      await this.tokens.next();
    }
    const replica = await this.getReplica(id);
    const item = this.items[id];
    const pending = replica.pending();
    if (replica.local + pending.length > item.sent + 1) {
      const messages: Message[] = pending
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
    return item.inflight;
  }

  // TODO: reopen clients?
  close(reason?: any): void {
    this.closed = true;
    this.pubsub.close(reason);
    this.tokens.return!();
  }
}
