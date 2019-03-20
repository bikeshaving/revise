import { Connection, Message } from "./connection";
import { Replica } from "./replica";

export interface ClientItem {
  replica: Promise<Replica>;
}

export class Client {
  protected items: Record<string, ClientItem> = {};

  constructor(
    public readonly id: string,
    public readonly connection: Connection,
  ) {}

  async fetchReplica(id: string): Promise<Replica> {
    if (this.items[id]) {
      return this.items[id].replica;
    }
    const milestone = await this.connection.fetchMilestone(id);
    let replica: Replica;
    let version: number;
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
      this.items[id] = { replica: this.fetchReplica(id) };
    }
    return this.items[id].replica;
  }

  // TODO: cancel from outside loop?
  async listen(id: string): Promise<void> {
    const replica = await this.getReplica(id);
    const subscription = await this.connection.subscribe(
      id,
      replica.latest + 1,
    );
    for await (const messages of subscription) {
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

  // TODO: have only one in-flight group of messages at a time
  // TODO: send milestones!!!
  // TODO: freeze sent revisions
  // TODO: catch sendMessage errors
  async sync(id: string): Promise<void> {
    const replica = await this.getReplica(id);
    if (replica.pending.length) {
      const messages: Message[] = replica.pending.map((revision, i) => ({
        revision,
        client: this.id,
        local: replica.local + i,
        latest: replica.latest,
      }));
      await this.connection.sendMessages(id, messages);
    }
  }
}
