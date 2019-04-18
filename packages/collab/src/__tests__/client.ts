import { InMemoryConnection } from "../connection/in-memory";
import { Client } from "../client";
describe("Client", () => {
  describe("sync", () => {
    // TODO: remove specific replica stuff for better testing
    test.skip("syncing without ingesting messages", async () => {
      const conn = new InMemoryConnection();
      const sendMessages = jest.spyOn(conn, "sendMessages");
      const client = new Client("id1", conn);
      const replica = await client.getReplica("doc1");
      replica.edit(["hello world", 0]);
      replica.edit([0, 11, "!", 11]);
      await client.save("doc1", { force: true });
      replica.edit([0, 5, 6, 12]);
      replica.edit([11]);
      await client.save("doc1");
      // @ts-ignore
      const messages1 = replica["revisions"].slice(0, 2).map((data, i) => ({
        data,
        client: "id1",
        local: 0 + i,
        received: -1,
      }));
      expect(sendMessages).nthCalledWith(1, "doc1", messages1);
      // @ts-ignore
      const messages2 = replica["revisions"].slice(2).map((data, i) => ({
        data,
        client: "id1",
        local: 2 + i,
        received: -1,
      }));
      expect(sendMessages).nthCalledWith(2, "doc1", messages2);
      client.close();
    });

    test.skip("syncing and ingesting messages", async () => {
      const conn = new InMemoryConnection();
      const sendMessages = jest.spyOn(conn, "sendMessages");
      // TODO: abstract replica stuff for better testing
      const client = new Client("id1", conn);
      const replica = await client.getReplica("doc1");
      replica.edit(["hello world", 0]);
      replica.edit([0, 11, "!", 11]);
      replica.edit([0, 5, 6, 12]);
      await client.save("doc1", { force: true });
      const messages = await conn.fetchMessages("doc1");
      expect(messages).toBeDefined();
      for (const message of messages!) {
        replica.ingest(message);
      }
      await client.save("doc1", { force: true });
      replica.edit([11]);
      await client.save("doc1", { force: true });
      // @ts-ignore
      const messages1 = replica["revisions"].slice(0, 3).map((data, i) => ({
        data,
        client: "id1",
        local: 0 + i,
        received: -1,
      }));
      expect(sendMessages).nthCalledWith(1, "doc1", messages1);
      // @ts-ignore
      const messages2 = replica["revisions"].slice(3).map((data, i) => ({
        data,
        client: "id1",
        local: 3 + i,
        received: 2,
      }));
      expect(sendMessages).nthCalledWith(2, "doc1", messages2);
      client.close();
    });
  });
});
