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
import { factor, FactoredPatch, Patch, synthesize } from "./patch";

export interface Snapshot {
  visible: string;
  hidden: string;
  hiddenSeq: Subseq;
  version: number;
}

export interface Revision {
  patch: Patch;
  clientId: string;
  priority?: number;
  version?: number;
  localVersion: number;
  lastKnownVersion: number;
}

export interface RevisionInternal {
  patch: FactoredPatch;
  clientId: string;
  priority: number;
  localVersion: number;
}

export function compare(revision1: Revision, revision2: Revision) {
  const { priority: priority1 = 0, clientId: clientId1 } = revision1;
  const { priority: priority2 = 0, clientId: clientId2 } = revision2;
  if (priority1 < priority2) {
    return -1;
  } else if (priority1 > priority2) {
    return 1;
  } else if (clientId1 < clientId2) {
    return -1;
  } else if (clientId1 > clientId2) {
    return 1;
  }
  return 0;
}

export function rebase(
  revision: Revision,
  revisions: Revision[],
  hiddenSeq: Subseq,
): [Revision, Revision[]] {
  let { inserted, insertSeq, deleteSeq } = factor(revision.patch);
  const revisions1: Revision[] = [];
  for (const revision1 of revisions) {
    const comp = compare(revision, revision1);
    if (comp === 0) {
      throw new Error("Concurrent edits with the same client and priority");
    }
    let {
      inserted: inserted1,
      insertSeq: insertSeq1,
      deleteSeq: deleteSeq1,
    } = factor(revision1.patch);
    deleteSeq1 = expand(difference(deleteSeq1, deleteSeq), insertSeq);
    deleteSeq = expand(deleteSeq, insertSeq1);
    if (comp < 0) {
      [insertSeq, insertSeq1] = interleave(insertSeq, insertSeq1);
    } else {
      [insertSeq1, insertSeq] = interleave(insertSeq1, insertSeq);
    }
    revisions1.push({
      ...revision1,
      patch: synthesize({
        inserted: inserted1,
        insertSeq: insertSeq1,
        deleteSeq: deleteSeq1,
      }),
    });
  }
  deleteSeq = difference(deleteSeq, hiddenSeq);
  revision = {
    ...revision,
    patch: synthesize({ inserted, insertSeq, deleteSeq }),
  };
  return [revision, revisions1];
}

export function summarize(revisions: Revision[], clientId?: string): Subseq {
  if (!revisions.length) {
    throw new Error("Empty revisions");
  }
  const revision = revisions[0];
  let { insertSeq } = factor(revision.patch);
  if (revision.clientId === clientId) {
    insertSeq = clear(insertSeq);
  }
  for (const revision of revisions.slice(1)) {
    const { insertSeq: insertSeq1 } = factor(revision.patch);
    insertSeq = expand(insertSeq, insertSeq1, {
      union: clientId !== revision.clientId,
    });
  }
  return insertSeq;
}

// TODO: remove all references to clients in Document and rename to Replica
export class Document {
  // TODO: add factored patches to improve performance
  protected constructor(
    // TODO: document doesn’t need to know its own id
    public id: string,
    // TODO: document doesn’t need to know its own client
    public client: Client,
    public snapshot: Snapshot,
    // TODO: make revisions a sparse array
    public revisions: Revision[],
    public lastKnownVersion = -1,
    public localVersion = 0,
  ) {}

  static create(id: string, client: Client, initial: string = ""): Document {
    const snapshot: Snapshot = {
      visible: initial,
      hidden: "",
      hiddenSeq: empty(initial.length),
      version: 0,
    };
    const revision: Revision = {
      patch: synthesize({ inserted: initial, insertSeq: full(initial.length) }),
      clientId: client.id,
      priority: 0,
      localVersion: 0,
      lastKnownVersion: -1,
    };
    return new Document(id, client, snapshot, [revision], -1, 1);
  }

  static from(
    id: string,
    client: Client,
    snapshot: Snapshot,
    revisions: Revision[],
  ): Document {
    const doc = new Document(id, client, snapshot, [], snapshot.version);
    for (const revision of revisions) {
      doc.ingest(revision);
    }
    return doc;
  }

  hiddenSeqAt(version: number): Subseq {
    let hiddenSeq = this.snapshot.hiddenSeq;
    const revisions = this.revisions.slice(version + 1).reverse();
    for (const revision of revisions) {
      const { insertSeq, deleteSeq } = factor(revision.patch);
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
    const revision =
      this.revisions[version] || this.revisions[this.revisions.length - 1];
    let { inserted, insertSeq, deleteSeq } = factor(revision.patch);
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
      this.lastKnownVersion,
    );
  }

  apply(revision: Revision, snapshot: Snapshot = this.snapshot): Snapshot {
    let { inserted, insertSeq, deleteSeq } = factor(revision.patch);
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
    priority: number = 0,
    version: number = this.revisions.length - 1,
  ): void {
    if (version < 0 || version > this.revisions.length - 1) {
      throw new Error("Version out of range");
    }
    let { inserted, insertSeq, deleteSeq } = factor(patch);
    const hiddenSeq = this.hiddenSeqAt(version);
    [, insertSeq] = interleave(hiddenSeq, insertSeq);
    deleteSeq = expand(deleteSeq, hiddenSeq);
    let revision: Revision = {
      patch: synthesize({ inserted, insertSeq, deleteSeq }),
      clientId: this.client.id,
      priority,
      localVersion: this.localVersion,
      lastKnownVersion: this.lastKnownVersion,
    };
    [revision] = rebase(
      revision,
      this.revisions.slice(version + 1),
      this.snapshot.hiddenSeq,
    );
    this.snapshot = this.apply(revision);
    this.revisions.push(revision);
    this.localVersion++;
    this.client.save(this.id);
  }

  revert(version: number): void {
    const [revision, ...revisions] = this.revisions.slice(version);
    let { insertSeq: deleteSeq, deleteSeq: insertSeq } = factor(revision.patch);
    insertSeq = expand(insertSeq, deleteSeq);
    const insertSeq1 = summarize(revisions);
    deleteSeq = expand(deleteSeq, insertSeq1);
    insertSeq = expand(insertSeq, insertSeq1);
    const { visible, hidden, hiddenSeq } = this.snapshot;
    const [inserted] = split(merge(hidden, visible, hiddenSeq), insertSeq);
    [, insertSeq] = interleave(insertSeq, insertSeq);
    const revision1: Revision = {
      patch: synthesize({ inserted, insertSeq, deleteSeq }),
      clientId: this.client.id,
      priority: 0,
      localVersion: this.localVersion,
      lastKnownVersion: this.lastKnownVersion,
    };
    this.snapshot = this.apply(revision1);
    this.revisions.push(revision1);
    this.localVersion++;
    this.client.save(this.id);
  }

  ingest(revision: Revision): void {
    if (revision.version == null) {
      throw new Error("Missing revision version");
    } else if (
      this.lastKnownVersion + 1 < revision.version ||
      this.lastKnownVersion < revision.lastKnownVersion
    ) {
      // TODO: attempt repair
      throw new Error("Missing revision");
    } else if (revision.version <= this.lastKnownVersion) {
      return;
    } else if (revision.clientId === this.client.id) {
      this.lastKnownVersion = revision.version;
      return;
    }
    let lastKnownVersion = Math.max(revision.lastKnownVersion, 0);
    for (let v = this.lastKnownVersion; v >= lastKnownVersion; v--) {
      if (revision.clientId === this.revisions[v].clientId) {
        lastKnownVersion = v;
        break;
      }
    }
    let { inserted, insertSeq, deleteSeq } = factor(revision.patch);
    if (
      revision.lastKnownVersion > -1 &&
      revision.lastKnownVersion < lastKnownVersion
    ) {
      const revisions = this.revisions.slice(
        revision.lastKnownVersion + 1,
        lastKnownVersion + 1,
      );
      const baseInsertSeq = summarize(revisions, revision.clientId);
      insertSeq = expand(insertSeq, baseInsertSeq);
      deleteSeq = expand(deleteSeq, baseInsertSeq);
    }
    revision = {
      ...revision,
      patch: synthesize({ inserted, insertSeq, deleteSeq }),
    };
    let revisions = this.revisions.slice(
      lastKnownVersion + 1,
      this.lastKnownVersion + 1,
    );
    [revision] = rebase(
      revision,
      revisions,
      this.hiddenSeqAt(this.lastKnownVersion),
    );
    revision = { ...revision, lastKnownVersion: revision.version! };
    revisions = this.revisions.slice(this.lastKnownVersion + 1);
    this.revisions.splice(
      this.lastKnownVersion + 1,
      revisions.length,
      revision,
    );
    [revision, revisions] = rebase(
      revision,
      revisions,
      this.snapshot.hiddenSeq,
    );
    this.revisions = this.revisions.concat(revisions);
    this.snapshot = this.apply(revision);
    this.lastKnownVersion = revision.version!;
  }

  pendingRevisions(): Revision[] {
    return this.revisions.slice(this.lastKnownVersion + 1);
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
            await this.connection.sendRevisions(id, doc.pendingRevisions());
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
      for (const revision of revisions) {
        doc.ingest(revision);
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

  saveRevision(id: string, revision: Revision): Revision {
    const clientVersions: Record<string, number> = this.clientVersionsById[id];
    if (clientVersions == null) {
      if (revision.localVersion !== 0) {
        throw new Error("Unknown document");
      }
      this.clientVersionsById[id] = {};
      this.clientVersionsById[id][revision.clientId] = revision.localVersion;
      revision = { ...revision, version: 0 };
      this.revisionsById[id] = [revision];
      this.snapshotsById[id] = [];
      this.channelsById[id] = [];
      return revision;
    }
    const expectedLocalVersion =
      clientVersions[revision.clientId] == null
        ? 0
        : clientVersions[revision.clientId] + 1;
    // TODO: reject revision if lastKnownVersion is too far off current version
    // TODO: reject if we don’t have a recent-enough snapshot
    if (revision.localVersion > expectedLocalVersion) {
      throw new Error("Missing revision");
    } else if (revision.localVersion < expectedLocalVersion) {
      if (
        revision.version === 0 &&
        revision.clientId !== this.revisionsById[id][0].clientId
      ) {
        throw new Error("Document already exists");
      }
      return revision;
    }
    revision = { ...revision, version: this.revisionsById[id].length };
    this.revisionsById[id].push(revision);
    clientVersions[revision.clientId] = revision.localVersion;
    return revision;
  }

  // TODO: run this in a transaction
  async sendRevisions(id: string, revisions: Revision[]): Promise<Revision[]> {
    revisions = revisions.map((revision) => this.saveRevision(id, revision));
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
