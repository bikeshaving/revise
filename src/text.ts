import { Client } from "./client";
import { Replica } from "./replica";
import { PatchBuilder } from "./patch";

// TODO: call client.sync and client.listen and create a lifecycle
export class CollabText {
  public closed: boolean = false;
  constructor(
    public readonly id: string,
    protected readonly client: Client,
    protected readonly replica: Replica,
  ) {
    this.client
      .listen(id)
      .then(() => {
        this.close();
      })
      .catch((err) => {
        this.error(err);
      });
  }

  static async initialize(id: string, client: Client): Promise<CollabText> {
    const replica = await client.getReplica(id);
    return new CollabText(id, client, replica);
  }

  get text(): string {
    return this.replica.snapshot.visible;
  }

  replace(start: number, end: number, inserted: string): void {
    if (this.closed) {
      throw new Error("CollabText closed");
    }
    const builder = new PatchBuilder(this.text.length);
    builder.replace(start, end, inserted);
    this.replica.edit(builder.patch!);
    this.client.sync(this.id).catch((err) => {
      this.error(err);
    });
  }

  error(_reason: any): void {
    this.close();
  }

  close(): void {
    this.closed = true;
  }
}
