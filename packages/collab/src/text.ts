import { Message } from "./connection";
import { Client } from "./client";
import { build } from "./patch";
import { Replica } from "./replica";

export class CollabText {
  constructor(
    public readonly id: string,
    protected readonly client: Client,
    protected readonly replica: Replica,
  ) {}

  static async initialize(id: string, client: Client): Promise<CollabText> {
    const replica = await client.getReplica(id);
    return new CollabText(id, client, replica);
  }

  subscribe(): AsyncIterableIterator<Message> {
    return this.client.subscribe(this.id);
  }

  get text(): string {
    // TODO: respect the law of demeter
    return this.replica.snapshot.visible;
  }

  replace(start: number, end: number, inserted: string): void {
    const patch = build(start, end, inserted, this.text.length);
    this.replica.edit(patch);
    this.client.enqueueSave(this.id);
  }
}
