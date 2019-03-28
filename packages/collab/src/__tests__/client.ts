import { InMemoryConnection } from "../connection/in-memory";
import { Client } from "../client";
describe("Client", () => {
  describe("sync", () => {
    test("syncing without ingesting messages", async () => {
      const conn = new InMemoryConnection();
      const sendMessages = jest.spyOn(conn, "sendMessages");
      // TODO: abstract replica stuff for better testing
      const client = new Client("id1", conn);
      const replica = await client.getReplica("doc1");
      replica.edit(["hello world", 0]);
      replica.edit([0, 11, "!", 11]);
      await client.sync("doc1");
      await client.sync("doc1");
      replica.edit([0, 5, 6, 12]);
      replica.edit([11]);
      await client.sync("doc1");
      const messages1 = replica.revisions.slice(0, 2).map((revision, i) => ({
        revision,
        client: "id1",
        local: 0 + i,
        latest: -1,
      }));
      expect(sendMessages).nthCalledWith(1, "doc1", messages1);
      const messages2 = replica.revisions.slice(2).map((revision, i) => ({
        revision,
        client: "id1",
        local: 2 + i,
        latest: -1,
      }));
      expect(sendMessages).nthCalledWith(2, "doc1", messages2);
    });

    test("syncing and ingesting messages", async () => {
      const conn = new InMemoryConnection();
      const sendMessages = jest.spyOn(conn, "sendMessages");
      // TODO: abstract replica stuff for better testing
      const client = new Client("id1", conn);
      const replica = await client.getReplica("doc1");
      replica.edit(["hello world", 0]);
      replica.edit([0, 11, "!", 11]);
      replica.edit([0, 5, 6, 12]);
      await client.sync("doc1");
      await client.sync("doc1");
      const messages = await conn.fetchMessages("doc1");
      for (const message of messages!) {
        replica.ingest(message.revision, message.latest);
      }
      await client.sync("doc1");
      replica.edit([11]);
      await client.sync("doc1");
      const messages1 = replica.revisions.slice(0, 3).map((revision, i) => ({
        revision,
        client: "id1",
        local: 0 + i,
        latest: -1,
      }));
      expect(sendMessages).nthCalledWith(1, "doc1", messages1);
      const messages2 = replica.revisions.slice(3).map((revision, i) => ({
        revision,
        client: "id1",
        local: 3 + i,
        latest: 2,
      }));
      expect(sendMessages).nthCalledWith(2, "doc1", messages2);
    });
  });
});
