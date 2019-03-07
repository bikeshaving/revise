import { InMemoryStorage } from "../in-memory-storage";
import { Document, Revision } from "../document";

describe("InMemoryStorage", () => {
  describe("sendRevisions", () => {
    test("send and fetch revisions", async () => {
      const doc = Document.create("client1", "hello world");
      const storage = new InMemoryStorage();
      doc.edit([0, 11, "!", 11]);
      doc.edit(["goodbye", 5, 12]);
      const revisions = await storage.sendRevisions("doc1", doc.pending);
      const revisions1 = await storage.fetchRevisions("doc1");
      expect(revisions).toEqual(revisions1);
    });

    test("send and fetch snapshots", async () => {
      const doc = Document.create("client1", "hello world");
      const storage = new InMemoryStorage();
      doc.edit([0, 11, "!", 11]);
      await storage.sendRevisions("doc1", doc.pending);
      storage.sendSnapshot("doc1", doc.snapshotAt(0));
      storage.sendSnapshot("doc1", doc.snapshotAt(1));
      const snapshot0 = await storage.fetchSnapshot("doc1", 0);
      const snapshot1 = await storage.fetchSnapshot("doc1");
      expect(snapshot0).toEqual(doc.snapshotAt(0));
      expect(snapshot1).toEqual(doc.snapshotAt(1));
      const revisions = await storage.fetchRevisions("doc1");
      expect(revisions).toEqual([]);
    });
  });

  describe("updates", () => {
    test("subscribe", async () => {
      const doc = Document.create("client1", "hello world");
      const storage = new InMemoryStorage();
      storage.sendRevisions("doc1", doc.pending);
      const updates = await storage.updates("doc1");
      const revisions: Promise<Revision[]> = (async () => {
        let revisions: Revision[] = [];
        let global = 0;
        for await (const revisions1 of updates) {
          revisions = revisions.concat(revisions1);
          for (const rev of revisions) {
            doc.ingest({ ...rev, global });
            global += 1;
          }
        }
        return revisions;
      })();
      doc.edit([0, 11, "!", 11]);
      doc.edit(["H", 1, 6, "W", 7, 12]);
      storage.sendRevisions("doc1", doc.pending);
      storage.close("doc1");
      expect(storage["channelsById"]["doc1"]).toEqual([]);
      await expect(revisions).resolves.toEqual(doc.revisions);
    });
  });
});
