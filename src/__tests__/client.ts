import { Client } from "../client";
import { InMemoryStorage } from "../in-memory-storage";

describe.skip("Client", () => {
  describe("saves", () => {
    test("save", async () => {
      const storage = new InMemoryStorage();
      const client = new Client("client1", storage);
      const doc = await client.createDocument("doc1", "hello world");
      doc.edit([0, 11, "!", 11]);
      doc.edit([0, 11, 12]);
      const revisions = doc.pending.map((rev, global) => ({ ...rev, global }));
      await expect(storage.fetchRevisions("doc1")).resolves.toEqual(revisions);
    });
  });

  describe("multiple clients", () => {
    test("initialize", async () => {
      const connection = new InMemoryStorage();
      const client1 = new Client("client1", connection);
      const client2 = new Client("client2", connection);
      const doc1 = await client1.createDocument("doc1", "hello world");
      await client1.sync();
      const doc2 = await client2.getDocument("doc1");
      expect(doc1.snapshot).toEqual(doc2.snapshot);
    });

    test("revisions", async () => {
      const connection = new InMemoryStorage();
      const client1 = new Client("client1", connection);
      const client2 = new Client("client2", connection);
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
