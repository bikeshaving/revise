import { InMemoryStorage } from "../in-memory-storage";
import { Document, Revision } from "../document";
import { Client } from "../client";

describe("InMemoryStorage", () => {
  describe("sendRevisions", () => {
    test("send revision", async () => {
      const client = new Client("id1", new InMemoryStorage());
      const doc = Document.create("doc1", client, "hello world");
      const storage = new InMemoryStorage();
      doc.edit([0, 11, "!", 11]);
      doc.edit(["goodbye", 5, 12]);
      const revisions = await storage.sendRevisions(doc.id, doc.pending);
      const revisions1 = await storage.fetchRevisions(doc.id);
      expect(revisions).toEqual(revisions1);
    });

    test("send snapshot", async () => {
      const client = new Client("id1", new InMemoryStorage());
      const doc = Document.create("doc1", client, "hello world");
      const storage = new InMemoryStorage();
      doc.edit([0, 11, "!", 11]);
      await storage.sendRevisions(doc.id, doc.pending);
      storage.sendSnapshot(doc.id, doc.snapshotAt(1));
      storage.sendSnapshot(doc.id, doc.snapshotAt(0));
      const snapshot0 = await storage.fetchSnapshot(doc.id, 0);
      const snapshot1 = await storage.fetchSnapshot(doc.id);
      expect(snapshot0).toEqual(doc.snapshotAt(0));
      expect(snapshot1).toEqual(doc.snapshotAt(1));
      const revisions = await storage.fetchRevisions(doc.id);
      expect(revisions).toEqual([]);
    });
  });

  describe("updates", () => {
    test("subscribe", async () => {
      const client = new Client("id1", new InMemoryStorage());
      const doc = Document.create("doc1", client, "hello world");
      const storage = new InMemoryStorage();
      const revisions = await storage.sendRevisions(doc.id, doc.pending);
      let global = 0;
      for (const rev of revisions) {
        doc.ingest({ ...rev, global });
        global += 1;
      }
      const updates = await storage.updates(doc.id);
      const revisionsPromise: Promise<Revision[]> = (async () => {
        let revisions: Revision[] = [];
        for await (const revisions1 of updates) {
          revisions = revisions.concat(revisions1);
        }
        return revisions;
      })();
      doc.edit([0, 11, "!", 11]);
      doc.edit(["H", 1, 6, "W", 7, 12]);
      const revisions1 = await storage.sendRevisions(doc.id, doc.pending);
      for (const rev of revisions1) {
        doc.ingest({ ...rev, global });
        global += 1;
      }
      storage.close(doc.id);
      expect(storage["channelsById"][doc.id]).toEqual([]);
      await expect(revisionsPromise).resolves.toEqual(revisions1);
    });
  });

  describe("multiple clients", () => {
    test("initialize", async () => {
      const connection = new InMemoryStorage();
      const client1 = new Client("id1", connection);
      const client2 = new Client("id2", connection);
      const doc1 = await client1.createDocument("doc1", "hello world");
      await client1.sync();
      const doc2 = await client2.getDocument("doc1");
      expect(doc1.snapshot).toEqual(doc2.snapshot);
    });

    test("revisions", async () => {
      const connection = new InMemoryStorage();
      const client1 = new Client("id1", connection);
      const client2 = new Client("id2", connection);
      const doc1 = await client1.createDocument("doc1", "hello world");
      client1.connect("doc1");
      await client1.sync();
      const doc2 = await client2.getDocument("doc1");
      client2.connect("doc1");
      doc2.edit([0, 5, "_", 6, 11, "!", 11]);
      doc2.edit([0, 11, 12]);
      await client2.sync();
      expect(doc1.snapshot).toEqual(doc2.snapshot);
    });
  });
});
