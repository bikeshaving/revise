import * as Knex from "knex";
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

async function fetchMessages(
  query: Knex.QueryBuilder,
  id: string,
  start?: number,
  end?: number,
): Promise<Message[]> {
  query = query.where("doc_id", id).orderBy("version", "asc");
  if (start != null) {
    query = query.where("version", ">=", start);
  }
  if (end != null) {
    query = query.where("version", "<", end);
  }
  const rows: MessageRow[] = await query;
  return rows.map((row) => ({
    client: row.client_id,
    local: row.local,
    received: row.received,
    version: row.version,
    data: JSON.parse(row.data),
  }));
}

async function fetchLocals(
  query: Knex.QueryBuilder,
  id: string,
  clients: string[],
): Promise<Record<string, number>> {
  const result: Record<string, number> = {};
  const rows: MessageRow[] = await query
    .where("doc_id", id)
    .whereIn("client_id", clients)
    .groupBy("client_id")
    .select("client_id")
    .max("local as local");
  for (const row of rows) {
    result[row.client_id] = row.local;
  }
  return result;
}

function createRows(
  id: string,
  messages: Message[],
  version: number,
  locals: Record<string, number>,
): MessageRow[] {
  const result: MessageRow[] = [];
  let i = 0;
  for (const message of messages) {
    const local = locals[message.client] == null ? -1 : locals[message.client];
    if (message.local > local + 1) {
      throw new Error("Missing message");
    } else if (message.local < local + 1) {
      continue;
    } else {
      locals[message.client] = local + 1;
    }
    i++;
    result.push({
      doc_id: id,
      client_id: message.client,
      data: JSON.stringify(message.data),
      local: message.local,
      received: message.received,
      version: version + i,
    });
  }
  return result;
}

export class KnexConnection implements Connection {
  protected closed = false;
  constructor(
    protected knex: Knex,
    protected pubsub: PubSub<number> = new InMemoryPubSub(),
  ) {}

  async fetchCheckpoint(): Promise<undefined> {
    // TODO
    return;
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
      throw new RangeError(
        `end (${end}) cannot be less than or equal to start (${start})`,
      );
    }
    return fetchMessages(this.knex("revise_message"), id, start, end);
  }

  async sendCheckpoint(_id: string, _checkpoint: Checkpoint): Promise<void> {
    // TODO
  }

  async sendMessages(id: string, messages: Message[]): Promise<void> {
    const clients: Set<string> = new Set();
    for (const message of messages) {
      clients.add(message.client);
    }

    let version: number;
    let inserted = false;
    await this.knex.transaction(async (trx) => {
      ({ version } = await this.knex("revise_message")
        .transacting(trx)
        .where("doc_id", id)
        .max("version as version")
        .first());
      version = version == null ? -1 : version;
      const locals = await fetchLocals(
        this.knex("revise_message").transacting(trx),
        id,
        Array.from(clients),
      );
      const rows = createRows(id, messages, version, locals);
      if (rows.length) {
        await this.knex("revise_message")
          .transacting(trx)
          .insert(rows);
        version += rows.length;
        inserted = true;
      }
    });
    if (inserted) {
      await this.pubsub.publish(id, version!);
    }
  }

  async *subscribe(
    id: string,
    start: number = 0,
  ): AsyncIterableIterator<Message[]> {
    if (start < 0) {
      throw new RangeError("start cannot be less than 0");
    }
    const messages = await this.fetchMessages(id, start);
    if (messages != null && messages.length) {
      yield messages;
      start = messages[messages.length - 1].version! + 1;
    }
    for await (const end of this.pubsub.subscribe(id)) {
      if (end >= start) {
        const messages = await this.fetchMessages(id, start);
        if (messages != null && messages.length) {
          yield messages;
        }
        start = end + 1;
      }
    }
  }

  close(): void {
    if (this.closed) {
      return;
    }
    this.closed = true;
    this.pubsub.close();
  }
}
