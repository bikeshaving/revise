import { Client } from "./client";
import { PatchBuilder } from "./patch";
import { Replica } from "./replica";
import { Revision } from "./revision";

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

  async *subscribe(): AsyncIterableIterator<Revision> {
    for await (const message of this.client.subscribe(this.id)) {
      const patch = this.replica.patchAt(message.global!);
      yield { ...message.revision, patch };
    }
  }

  get text(): string {
    return this.replica.snapshot.visible;
  }

  replace(start: number, end: number, inserted: string): void {
    const builder = new PatchBuilder(this.text.length);
    builder.replace(start, end, inserted);
    this.replica.edit(builder.patch!);
    this.client.save(this.id);
  }
}
