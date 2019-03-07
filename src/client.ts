import { Replica, Revision, Snapshot } from "./Replica";

export interface Connection {
  fetchSnapshot(id: string, min?: number): Promise<Snapshot>;
  fetchRevisions(id: string, from?: number, to?: number): Promise<Revision[]>;
  sendSnapshot(id: string, snapshot: Snapshot): Promise<Snapshot>;
  sendRevisions(id: string, revisions: Revision[]): Promise<Revision[]>;
  updates(id: string, from?: number): Promise<AsyncIterable<Revision[]>>;
}

export class Client {
  protected documents: Record<string, Replica> = {};
  constructor(public id: string, public connection: Connection) {}

  async sync(): Promise<void> {
    await Promise.all(
      Object.keys(this.documents).map(async (id) => {
        const pending = this.documents[id] && this.documents[id].pending;
        if (pending && pending.length) {
          // TODO: error recovery
          await this.connection.sendRevisions(id, pending);
        }
      }),
    );
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

  async createDocument(id: string, initial?: string): Promise<Replica> {
    const doc = Replica.create(this.id, initial);
    this.documents[id] = doc;
    return doc;
  }

  async getDocument(id: string): Promise<Replica> {
    if (this.documents[id]) {
      return this.documents[id];
    }
    const snapshot = await this.connection.fetchSnapshot(id);
    const revisions = await this.connection.fetchRevisions(
      id,
      snapshot.version,
    );
    const doc = Replica.from(this.id, snapshot, revisions);
    this.documents[id] = doc;
    return doc;
  }
}
