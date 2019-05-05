import { Message } from "./connection";
import { Client } from "./client";
import { build, Patch } from "./patch";
import { Replica, Update, Version } from "./replica";

export interface Value extends Version {
  text: string;
}

export class CollabText {
  static async initialize(id: string, client: Client): Promise<CollabText> {
    const replica = await client.getReplica(id);
    return new CollabText(id, client, replica);
  }

  constructor(
    public readonly id: string,
    protected readonly client: Client,
    protected readonly replica: Replica,
  ) {}

  get text(): string {
    return this.replica.snapshotAt().visible;
  }

  get value(): Value {
    const version = this.replica.currentVersion;
    return { ...version, text: this.text };
  }

  edit(patch: Patch, version?: Version): Update {
    this.client.enqueueSave(this.id);
    return this.replica.edit(patch, version);
  }

  replace(
    from: number,
    to: number,
    inserted: string,
    version?: Version,
  ): Update {
    const snapshot = this.replica.snapshotAt(version);
    const patch = build(from, to, inserted, snapshot.visible.length);
    return this.edit(patch, version);
  }

  subscribe(): AsyncIterableIterator<Message> {
    return this.client.subscribe(this.id);
  }

  updateSince(version: Version): Update {
    return this.replica.updateSince(version);
  }
}
