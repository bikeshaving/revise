import {
  clear,
  count,
  difference,
  empty,
  expand,
  full,
  interleave,
  merge,
  union,
  shrink,
  shuffle,
  split,
  Subseq,
} from "./subseq";
import { factor, Patch, synthesize } from "./patch";

export interface Snapshot {
  visible: string;
  hidden: string;
  hiddenSeq: Subseq;
  version: number;
}

export interface Revision {
  patch: Patch;
  client: string;
  priority?: number;
  global?: number;
  local: number;
  latest: number;
}

export function compare(rev1: Revision, rev2: Revision): number {
  const { priority: priority1 = 0, client: client1 } = rev1;
  const { priority: priority2 = 0, client: client2 } = rev2;
  if (priority1 < priority2) {
    return -1;
  } else if (priority1 > priority2) {
    return 1;
  } else if (client1 < client2) {
    return -1;
  } else if (client1 > client2) {
    return 1;
  }
  return 0;
}

export function rebase(
  rev: Revision,
  revisions: Revision[],
  hiddenSeq: Subseq,
): [Revision, Revision[]] {
  let { inserted, insertSeq, deleteSeq } = factor(rev.patch);
  const revisions1: Revision[] = [];
  for (const rev1 of revisions) {
    const comp = compare(rev, rev1);
    if (comp === 0) {
      throw new Error("Concurrent edits same client and priority");
    }
    let {
      inserted: inserted1,
      insertSeq: insertSeq1,
      deleteSeq: deleteSeq1,
    } = factor(rev1.patch);
    deleteSeq1 = difference(deleteSeq1, deleteSeq);
    deleteSeq1 = expand(deleteSeq1, insertSeq);
    deleteSeq = expand(deleteSeq, insertSeq1);
    if (comp < 0) {
      [insertSeq, insertSeq1] = interleave(insertSeq, insertSeq1);
    } else {
      [insertSeq1, insertSeq] = interleave(insertSeq1, insertSeq);
    }
    revisions1.push({
      ...rev1,
      patch: synthesize({
        inserted: inserted1,
        insertSeq: insertSeq1,
        deleteSeq: deleteSeq1,
      }),
    });
  }
  deleteSeq = difference(deleteSeq, hiddenSeq);
  rev = { ...rev, patch: synthesize({ inserted, insertSeq, deleteSeq }) };
  return [rev, revisions1];
}

export function summarize(revisions: Revision[], client?: string): Subseq {
  if (!revisions.length) {
    throw new Error("Empty revisions");
  }
  const rev = revisions[0];
  let { insertSeq } = factor(rev.patch);
  if (rev.client === client) {
    insertSeq = clear(insertSeq);
  }
  for (const rev of revisions.slice(1)) {
    const { insertSeq: insertSeq1 } = factor(rev.patch);
    insertSeq = expand(insertSeq, insertSeq1, {
      union: client !== rev.client,
    });
  }
  return insertSeq;
}

// TODO: remove all references to clients in Document and rename to Replica and create a more user-friendly Document to expose to developers
// TODO: add or cache factored patches to improve performance
export class Document {
  constructor(
    // TODO: document doesn’t need to know its own id
    public id: string,
    // TODO: document doesn’t need to know its own client
    public client: Client,
    public snapshot: Snapshot,
    // TODO: make revisions a sparse array
    public revisions: Revision[],
    public latest = -1,
    public local = 0,
  ) {}

  static create(id: string, client: Client, initial: string = ""): Document {
    const snapshot: Snapshot = {
      visible: initial,
      hidden: "",
      hiddenSeq: empty(initial.length),
      version: 0,
    };
    const rev: Revision = {
      patch: synthesize({ inserted: initial, insertSeq: full(initial.length) }),
      client: client.id,
      priority: 0,
      local: 0,
      latest: -1,
    };
    return new Document(id, client, snapshot, [rev]);
  }

  static from(
    id: string,
    client: Client,
    snapshot: Snapshot,
    revisions: Revision[] = [],
  ): Document {
    const doc = new Document(id, client, snapshot, [], snapshot.version);
    for (const rev of revisions) {
      doc.ingest(rev);
    }
    return doc;
  }

  hiddenSeqAt(version: number): Subseq {
    let hiddenSeq = this.snapshot.hiddenSeq;
    const revisions = this.revisions.slice(version + 1).reverse();
    for (const rev of revisions) {
      const { insertSeq, deleteSeq } = factor(rev.patch);
      hiddenSeq = shrink(hiddenSeq, insertSeq);
      hiddenSeq = difference(hiddenSeq, deleteSeq);
    }
    return hiddenSeq;
  }

  snapshotAt(version: number): Snapshot {
    if (version >= this.revisions.length - 1) {
      return this.snapshot;
    }
    let { visible, hidden, hiddenSeq } = this.snapshot;
    const insertSeq = summarize(this.revisions.slice(version + 1));
    let merged = merge(hidden, visible, hiddenSeq);
    [, merged] = split(merged, insertSeq);
    const hiddenSeq1 = this.hiddenSeqAt(version);
    [hidden, visible] = split(merged, hiddenSeq1);
    return { visible, hidden, hiddenSeq: hiddenSeq1, version };
  }

  patchAt(version: number): Patch {
    const snapshot = this.snapshotAt(version);
    const rev =
      this.revisions[version] || this.revisions[this.revisions.length - 1];
    let { inserted, insertSeq, deleteSeq } = factor(rev.patch);
    deleteSeq = expand(deleteSeq, insertSeq);
    const hiddenSeq = difference(snapshot.hiddenSeq, deleteSeq);
    insertSeq = shrink(insertSeq, hiddenSeq);
    deleteSeq = shrink(shrink(deleteSeq, hiddenSeq), insertSeq);
    return synthesize({ inserted, insertSeq, deleteSeq });
  }

  clone(client: Client = this.client): Document {
    return new Document(
      this.id,
      client,
      { ...this.snapshot },
      this.revisions.slice(),
      this.latest,
    );
  }

  apply(rev: Revision, snapshot: Snapshot = this.snapshot): Snapshot {
    let { inserted, insertSeq, deleteSeq } = factor(rev.patch);
    let { visible, hidden, hiddenSeq } = snapshot;

    if (count(deleteSeq, true) > 0) {
      const hiddenSeq1 = union(hiddenSeq, deleteSeq);
      [hidden, visible] = shuffle(hidden, visible, hiddenSeq, hiddenSeq1);
      hiddenSeq = hiddenSeq1;
    }

    if (inserted.length) {
      hiddenSeq = expand(hiddenSeq, insertSeq);
      const insertSeq1 = shrink(insertSeq, hiddenSeq);
      visible = merge(inserted, visible, insertSeq1);
    }

    return { visible, hidden, hiddenSeq, version: snapshot.version + 1 };
  }

  edit(
    patch: Patch,
    priority?: number,
    version: number = this.revisions.length - 1,
  ): void {
    if (version < 0 || version > this.revisions.length - 1) {
      throw new Error("version out of range");
    }
    let { inserted, insertSeq, deleteSeq } = factor(patch);
    const hiddenSeq = this.hiddenSeqAt(version);
    [, insertSeq] = interleave(hiddenSeq, insertSeq);
    deleteSeq = expand(deleteSeq, hiddenSeq);
    let rev: Revision = {
      patch: synthesize({ inserted, insertSeq, deleteSeq }),
      client: this.client.id,
      priority,
      local: this.local,
      latest: this.latest,
    };
    [rev] = rebase(
      rev,
      this.revisions.slice(version + 1),
      this.snapshot.hiddenSeq,
    );
    this.snapshot = this.apply(rev);
    this.revisions.push(rev);
    this.client.save(this.id);
  }

  revert(version: number): void {
    const [rev, ...revisions] = this.revisions.slice(version);
    let { insertSeq: deleteSeq, deleteSeq: insertSeq } = factor(rev.patch);
    insertSeq = expand(insertSeq, deleteSeq);
    const insertSeq1 = summarize(revisions);
    deleteSeq = expand(deleteSeq, insertSeq1);
    insertSeq = expand(insertSeq, insertSeq1);
    const { visible, hidden, hiddenSeq } = this.snapshot;
    const [inserted] = split(merge(hidden, visible, hiddenSeq), insertSeq);
    [, insertSeq] = interleave(insertSeq, insertSeq);
    const rev1: Revision = {
      patch: synthesize({ inserted, insertSeq, deleteSeq }),
      client: this.client.id,
      local: this.local,
      latest: this.latest,
    };
    this.snapshot = this.apply(rev1);
    this.revisions.push(rev1);
    this.client.save(this.id);
  }

  ingest(rev: Revision): void {
    // TODO: move this logic to clients?
    if (rev.global == null) {
      throw new Error("Missing version");
    } else if (this.latest < rev.latest || this.latest + 1 < rev.global) {
      // TODO: attempt repair
      throw new Error("Missing revision");
    } else if (rev.global <= this.latest) {
      return;
    } else if (rev.client === this.client.id) {
      this.local++;
      this.latest = rev.global;
      return;
    }
    let latest = Math.max(rev.latest, 0);
    for (let v = this.latest; v >= latest; v--) {
      if (rev.client === this.revisions[v].client) {
        latest = v;
        break;
      }
    }
    let { inserted, insertSeq, deleteSeq } = factor(rev.patch);
    if (rev.latest > -1 && rev.latest < latest) {
      const revisions = this.revisions.slice(rev.latest + 1, latest + 1);
      // TODO: cache or memoize this for performance
      const insertSeq1 = summarize(revisions, rev.client);
      insertSeq = expand(insertSeq, insertSeq1);
      deleteSeq = expand(deleteSeq, insertSeq1);
    }
    rev = { ...rev, patch: synthesize({ inserted, insertSeq, deleteSeq }) };
    let revisions = this.revisions.slice(latest + 1, this.latest + 1);
    [rev] = rebase(rev, revisions, this.hiddenSeqAt(this.latest));
    revisions = this.revisions.slice(this.latest + 1);
    this.revisions.splice(this.latest + 1, revisions.length, rev);
    [rev, revisions] = rebase(rev, revisions, this.snapshot.hiddenSeq);
    this.revisions = this.revisions.concat(revisions);
    this.snapshot = this.apply(rev);
    this.latest = rev.global!;
  }

  get pending(): Revision[] {
    return this.revisions.slice(this.latest + 1).map((rev, i) => ({
      ...rev,
      local: this.local + i,
      latest: this.latest,
    }));
  }
}

export interface Connection {
  fetchSnapshot(id: string, min?: number): Promise<Snapshot>;
  fetchRevisions(id: string, from?: number, to?: number): Promise<Revision[]>;
  sendSnapshot(id: string, snapshot: Snapshot): Promise<Snapshot>;
  sendRevisions(id: string, revisions: Revision[]): Promise<Revision[]>;
  updates(id: string, from?: number): Promise<AsyncIterable<Revision[]>>;
}

export class Client {
  protected documents: Record<string, Document> = {};
  protected pending: Set<string> = new Set();
  protected pollTimeout: any;
  protected saveResolves: (() => void)[] = [];
  constructor(public id: string, public connection: Connection) {
    this.poll();
  }

  save(id: string, options: { force?: boolean } = {}): Promise<void> {
    this.pending.add(id);
    if (options.force) {
      return this.sync();
    }
    return this.whenSynced();
  }

  async sync(): Promise<void> {
    if (this.pending.size) {
      await Promise.all(
        Array.from(this.pending).map(async (id) => {
          const doc = this.documents[id];
          if (doc) {
            // TODO: error recovery
            await this.connection.sendRevisions(id, doc.pending);
          }
          this.pending.delete(id);
        }),
      );
      this.saveResolves.forEach((resolve) => resolve());
      this.saveResolves = [];
    }
  }

  whenSynced(): Promise<void> {
    if (this.pending.size) {
      return new Promise((resolve) => {
        this.saveResolves.push(resolve);
      });
    }
    return Promise.resolve();
  }

  hasPending(): boolean {
    return !!this.pending.size;
  }

  protected pollInternal = async () => {
    await this.sync();
    this.pollTimeout = setTimeout(this.pollInternal, 4000);
  };

  poll(): void {
    if (this.pollTimeout) {
      return;
    }
    this.pollInternal();
  }

  // TODO: when to connect to the document?
  async connect(id: string): Promise<void> {
    const doc = this.documents[id];
    if (doc == null) {
      throw new Error("Unknown document");
    }
    const updates = await this.connection.updates(id, doc.snapshot.version);
    for await (const revisions of updates) {
      for (const rev of revisions) {
        doc.ingest(rev);
      }
    }
  }

  async createDocument(id: string, initial?: string): Promise<Document> {
    const doc = Document.create(id, this, initial);
    this.documents[id] = doc;
    this.save(doc.id, { force: true });
    return doc;
  }

  async getDocument(id: string): Promise<Document> {
    if (this.documents[id]) {
      return this.documents[id];
    }
    const snapshot = await this.connection.fetchSnapshot(id);
    const revisions = await this.connection.fetchRevisions(
      id,
      snapshot.version,
    );
    const doc = Document.from(id, this, snapshot, revisions);
    this.documents[id] = doc;
    return doc;
  }
}

import { Channel, FixedBuffer } from "./channel";

export class InMemoryStorage implements Connection {
  protected clientVersionsById: Record<string, Record<string, number>> = {};
  protected snapshotsById: Record<string, Snapshot[]> = {};
  protected revisionsById: Record<string, Revision[]> = {};
  protected channelsById: Record<string, Channel<Revision[]>[]> = {};

  async fetchRevisions(
    id: string,
    from?: number,
    to?: number,
  ): Promise<Revision[]> {
    if (this.clientVersionsById[id] == null) {
      throw new Error("Unknown document");
    }
    if (from == null) {
      const snapshots = this.snapshotsById[id];
      if (snapshots.length) {
        from = snapshots[snapshots.length - 1].version + 1;
      } else {
        from = 0;
      }
    }
    return this.revisionsById[id].slice(from, to);
  }

  async fetchSnapshot(id: string, min?: number): Promise<Snapshot> {
    if (this.clientVersionsById[id] == null) {
      throw new Error("Unknown document");
    }
    const snapshots = this.snapshotsById[id];
    if (snapshots == null || !snapshots.length) {
      return { visible: "", hidden: "", hiddenSeq: [], version: -1 };
    } else if (min == null) {
      return snapshots[snapshots.length - 1];
    }
    for (let i = snapshots.length - 1; i > 0; i--) {
      const snapshot = snapshots[i];
      if (snapshot.version <= min) {
        return snapshot;
      }
    }
    return snapshots[0];
  }

  saveRevision(id: string, rev: Revision): Revision {
    const clientVersions: Record<string, number> = this.clientVersionsById[id];
    if (clientVersions == null) {
      if (rev.local !== 0) {
        throw new Error("Unknown document");
      }
      this.clientVersionsById[id] = {};
      this.clientVersionsById[id][rev.client] = rev.local;
      rev = { ...rev, global: 0 };
      this.revisionsById[id] = [rev];
      this.snapshotsById[id] = [];
      this.channelsById[id] = [];
      return rev;
    }
    const expectedLocalVersion =
      clientVersions[rev.client] == null ? 0 : clientVersions[rev.client] + 1;
    // TODO: reject rev if latest is too far off current version
    // TODO: reject if we don’t have a recent-enough snapshot
    if (rev.local > expectedLocalVersion) {
      throw new Error("Missing rev");
    } else if (rev.local < expectedLocalVersion) {
      if (rev.global === 0 && rev.client !== this.revisionsById[id][0].client) {
        throw new Error("Document already exists");
      }
      return rev;
    }
    rev = { ...rev, global: this.revisionsById[id].length };
    this.revisionsById[id].push(rev);
    clientVersions[rev.client] = rev.local;
    return rev;
  }

  // TODO: run this in a transaction
  async sendRevisions(id: string, revisions: Revision[]): Promise<Revision[]> {
    revisions = revisions.map((rev) => this.saveRevision(id, rev));
    this.channelsById[id].map(async (channel, i) => {
      try {
        await channel.put(revisions);
      } catch (err) {
        channel.close();
        this.channelsById[id].splice(i, 1);
      }
    });
    return revisions;
  }

  async sendSnapshot(id: string, snapshot: Snapshot): Promise<Snapshot> {
    if (this.clientVersionsById[id] == null) {
      throw new Error("Unknown document");
    }
    const snapshots = this.snapshotsById[id];
    if (!snapshots.length) {
      snapshots.push(snapshot);
      return snapshot;
    }
    for (let i = snapshots.length - 1; i > 0; i--) {
      const snapshot1 = snapshots[i];
      if (snapshot1.version === snapshot.version) {
        return snapshot;
      } else if (snapshot1.version < snapshot.version) {
        snapshots.splice(i + 1, 0, snapshot);
        return snapshot;
      }
    }
    snapshots.unshift(snapshot);
    return snapshot;
  }

  async updates(id: string, from?: number): Promise<AsyncIterable<Revision[]>> {
    if (this.clientVersionsById[id] == null) {
      throw new Error("Unknown document");
    }
    let channels: Channel<Revision[]>[] = this.channelsById[id];
    const channel = new Channel(new FixedBuffer<Revision[]>(1000));
    channels.push(channel);
    channel.onclose = () => {
      const i = channels.indexOf(channel);
      if (i > -1) {
        channels.splice(i, 1);
      }
    };
    if (from != null) {
      const revisions = await this.fetchRevisions(id, from);
      channel.put(revisions);
    }
    return channel;
  }

  async close(id: string): Promise<void> {
    if (this.clientVersionsById[id] == null) {
      throw new Error("Unknown document");
    }
    await Promise.all(this.channelsById[id].map((channel) => channel.close()));
    this.channelsById[id] = [];
  }
}
