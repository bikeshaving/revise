import { Client } from "../client";
import { InMemoryStorage } from "../in-memory-storage";

describe("Client", () => {
  describe("saves", () => {
    test("save", async () => {
      const storage = new InMemoryStorage();
      const client = new Client("id1", storage);
      const doc = await client.createDocument("doc1", "hello world");
      doc.edit([0, 11, "!", 11]);
      doc.edit([0, 11, 12]);
      const revisions = doc.pending.map((rev, global) => ({ ...rev, global }));
      await client.save(doc.id, { force: true });
      await expect(storage.fetchRevisions(doc.id)).resolves.toEqual(revisions);
    });
  });
});
