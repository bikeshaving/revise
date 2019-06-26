import * as Knex from "knex";
import { InMemoryPubSub, PubSub } from "@channel/pubsub";
import {
  Checkpoint,
  Connection,
  Revision,
} from "@createx/revise/lib/connection";

interface RevisionRow {
  doc_id: string;
  client_id: string;
  local: number;
  received: number;
  version: number;
  patch: string;
}

async function fetchRevisions(
  query: Knex.QueryBuilder,
  id: string,
  start?: number,
  end?: number,
): Promise<Revision[]> {
  query = query.where("doc_id", id).orderBy("version", "asc");
  if (start != null) {
    query = query.where("version", ">=", start);
  }
  if (end != null) {
    query = query.where("version", "<", end);
  }
  const rows: RevisionRow[] = await query;
  return rows.map((row) => ({
    client: row.client_id,
    local: row.local,
    received: row.received,
    version: row.version,
    // TODO: serialize/deserialize
    patch: JSON.parse(row.patch),
  }));
}

async function fetchLocals(
  query: Knex.QueryBuilder,
  id: string,
  clients: string[],
): Promise<Record<string, number>> {
  const result: Record<string, number> = {};
  const rows: RevisionRow[] = await query
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
  revisions: Revision[],
  version: number,
  locals: Record<string, number>,
): RevisionRow[] {
  const result: RevisionRow[] = [];
  let i = 0;
  for (const rev of revisions) {
    const local = locals[rev.client] == null ? -1 : locals[rev.client];
    if (rev.local > local + 1) {
      throw new Error("Missing rev");
    } else if (rev.local < local + 1) {
      continue;
    } else {
      locals[rev.client] = local + 1;
    }
    i++;
    result.push({
      doc_id: id,
      client_id: rev.client,
      // TODO: serialize/deserialize
      patch: JSON.stringify(rev.patch),
      local: rev.local,
      received: rev.received,
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

  async fetchRevisions(
    id: string,
    start?: number,
    end?: number,
  ): Promise<Revision[] | undefined> {
    if (start != null && start < 0) {
      throw new RangeError(`start (${start}) cannot be less than 0`);
    } else if (end != null && end < 0) {
      throw new RangeError(`end (${end}) cannot be less than 0`);
    } else if (start != null && end != null && end <= start) {
      throw new RangeError(
        `end (${end}) cannot be less than or equal to start (${start})`,
      );
    }
    return fetchRevisions(this.knex("revise_revision"), id, start, end);
  }

  async sendCheckpoint(_id: string, _checkpoint: Checkpoint): Promise<void> {
    // TODO
  }

  async sendRevisions(id: string, revisions: Revision[]): Promise<void> {
    const clients: Set<string> = new Set();
    for (const rev of revisions) {
      clients.add(rev.client);
    }

    let version: number;
    let inserted = false;
    await this.knex.transaction(async (trx) => {
      ({ version } = (await this.knex("revise_revision")
        .transacting(trx)
        .where("doc_id", id)
        .max("version as version")
        .first()) || { version: -1 });
      version = version == null ? -1 : version;
      const locals = await fetchLocals(
        this.knex("revise_revision").transacting(trx),
        id,
        Array.from(clients),
      );
      const rows = createRows(id, revisions, version, locals);
      if (rows.length) {
        await this.knex("revise_revision")
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
  ): AsyncIterableIterator<Revision[]> {
    if (start < 0) {
      throw new RangeError("start cannot be less than 0");
    }
    const revisions = await this.fetchRevisions(id, start);
    if (revisions != null && revisions.length) {
      yield revisions;
      start = revisions[revisions.length - 1].version! + 1;
    }
    for await (const end of this.pubsub.subscribe(id)) {
      if (end >= start) {
        const revisions = await this.fetchRevisions(id, start);
        if (revisions != null && revisions.length) {
          yield revisions;
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
