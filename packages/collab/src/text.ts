import { Client } from "./client";
import { PatchBuilder } from "./patch";
import { Replica } from "./replica";
import { Revision } from "./revision";
import { Channel, FixedBuffer } from "@collabjs/channel";

// TODO: call client.sync and client.listen and create a lifecycle
export class CollabText {
  protected puts: ((rev: Revision) => Promise<void>)[] = [];
  constructor(
    public readonly id: string,
    protected readonly client: Client,
    protected readonly replica: Replica,
  ) {
    this.listen();
  }

  static async initialize(id: string, client: Client): Promise<CollabText> {
    const replica = await client.getReplica(id);
    return new CollabText(id, client, replica);
  }

  async listen(): Promise<void> {
    for await (const message of this.client.subscribe(this.id)) {
      const patch = this.replica.patchAt(message.global!);
      for (const put of this.puts) {
        put({ ...message.revision, patch });
      }
    }
  }

  subscribe(): AsyncIterableIterator<Revision> {
    return new Channel<Revision>((put) => {
      this.puts.push(put);
    }, new FixedBuffer(1024));
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
