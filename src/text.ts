import { Client } from "./client";
import { Replica } from "./replica";
import { PatchBuilder } from "./patch";

// TODO: call client.sync and client.listen and create a lifecycle
export class CollabText {
  constructor(
    protected id: string,
    protected client: Client,
    protected replica: Replica,
  ) {}

  static async initialize(id: string, client: Client): Promise<CollabText> {
    const replica = await client.getReplica(id);
    return new CollabText(id, client, replica);
  }

  get text(): string {
    return this.replica.snapshot.visible;
  }

  replace(start: number, end: number, inserted: string): void {
    const builder = new PatchBuilder(this.text.length);
    builder.replace(start, end, inserted);
    this.replica.edit(builder.patch!);
  }
}
