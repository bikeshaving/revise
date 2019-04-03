import { Client } from "./client";
import { build } from "./patch";
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
    const patch = build(start, end, inserted, this.text.length);
    this.replica.edit(patch);
    // TODO: how do we throttle this call
    this.client.save(this.id);
  }
}
