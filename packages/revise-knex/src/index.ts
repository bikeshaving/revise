import Knex from "knex";
import { InMemoryPubSub, PubSub } from "@channel/pubsub";
import {
  Checkpoint,
  Connection,
  Message,
} from "@createx/revise/lib/connection";

interface MessageRow {
  doc_id: string;
  client_id: string;
  local: number;
  received: number;
  version: number;
  data: string;
}

export class KnexConnection implements Connection {
  constructor(
    protected knex: Knex,
    protected pubsub: PubSub<Message[]> = new InMemoryPubSub(),
  ) {}

  async fetchCheckpoint(
    _id: string,
    _start?: number,
  ): Promise<Checkpoint | undefined> {
    // TODO
    return undefined;
  }

  async fetchMessages(
    id: string,
    start?: number,
    end?: number,
  ): Promise<Message[] | undefined> {
    if (start != null && start < 0) {
      throw new RangeError(`start (${start}) cannot be less than 0`);
    } else if (end != null && end < 0) {
      throw new RangeError(`end (${end}) cannot be less than 0`);
    } else if (start != null && end != null && end <= start) {
      throw new RangeError(`end (${end}) cannot be less than start (${start})`);
    }
    let query = this.knex("revise_message")
      .where("doc_id", id)
      .orderBy("version", "asc");
    if (start != null) {
      query = query.where("version", ">=", start);
    }
    if (end != null) {
      query = query.where("version", "<", end);
    }
    return (await query).map((row: MessageRow) => ({
      client: row.client_id,
      local: row.local,
      received: row.received,
      version: row.version,
      data: row.data,
    }));
  }

  async sendCheckpoint(_id: string, _checkpoint: Checkpoint): Promise<void> {
    // TODO
  }

  async sendMessages(id: string, messages: Message[]): Promise<void> {
    const clients: Set<string> = new Set();
    for (const message of messages) {
      clients.add(message.client);
    }
    await this.knex.transaction(async (trx) => {
      let { version } = await this.knex("revise_message")
        .transacting(trx)
        .max("version as version")
        .where("doc_id", id)
        .first();
      version = version == null ? -1 : version;
      const locals: Record<string, number> = {};
      {
        const rows: MessageRow[] = await this.knex("revise_message")
          .transacting(trx)
          .where("doc_id", id)
          .whereIn("client_id", Array.from(clients))
          .groupBy("client_id")
          .select("client_id")
          .max("local as local");
        for (const row of rows) {
          locals[row.client_id] = row.local;
        }
      }
      const rows: MessageRow[] = [];
      let i = 0;
      for (const message of messages) {
        const local =
          locals[message.client] == null ? -1 : locals[message.client];
        if (message.local > local + 1) {
          throw new Error("Missing message");
        } else if (message.local < local + 1) {
          continue;
        } else {
          locals[message.client] = local + 1;
        }
        rows.push({
          doc_id: id,
          client_id: message.client,
          data: message.data,
          local: message.local,
          received: message.received,
          version: version + 1 + i++,
        });
      }
      await this.knex("revise_message")
        .transacting(trx)
        .insert(rows);
    });
  }

  async *subscribe(
    id: string,
    _start?: number,
  ): AsyncIterableIterator<Message[]> {
    yield* this.pubsub.subscribe(id);
  }
}
