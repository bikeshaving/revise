import { Document, Revision, Snapshot } from "./document";

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
