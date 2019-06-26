import { InMemoryConnection } from "../connection/in-memory";
import { Client } from "../client";
describe("Client", () => {
  describe("sync", () => {
    test("typechecks", () => {
      Client;
    });

    // TODO: remove specific replica stuff for better testing
    test.skip("syncing without ingesting revisions", async () => {
      const conn = new InMemoryConnection();
      const sendRevisions = jest.spyOn(conn, "sendRevisions");
      const client = new Client("id1", conn);
      const replica = await client.getReplica("doc1");
      replica.edit(["hello world", 0]);
      replica.edit([0, 11, "!", 11]);
      await client.save("doc1", { force: true });
      replica.edit([0, 5, 6, 12]);
      replica.edit([11]);
      await client.save("doc1");
      // @ts-ignore
      const revisions1 = replica["revisions"].slice(0, 2).map((data, i) => ({
        data,
        client: "id1",
        local: 0 + i,
        received: -1,
      }));
      expect(sendRevisions).toHaveBeenNthCalledWith(1, "doc1", revisions1);
      // @ts-ignore
      const revisions2 = replica["revisions"].slice(2).map((data, i) => ({
        data,
        client: "id1",
        local: 2 + i,
        received: -1,
      }));
      expect(sendRevisions).toHaveBeenNthCalledWith(2, "doc1", revisions2);
      client.close();
    });

    test.skip("syncing and ingesting revisions", async () => {
      const conn = new InMemoryConnection();
      const sendRevisions = jest.spyOn(conn, "sendRevisions");
      // TODO: abstract replica stuff for better testing
      const client = new Client("id1", conn);
      const replica = await client.getReplica("doc1");
      replica.edit(["hello world", 0]);
      replica.edit([0, 11, "!", 11]);
      replica.edit([0, 5, 6, 12]);
      await client.save("doc1", { force: true });
      const revisions = await conn.fetchRevisions("doc1");
      expect(revisions).toBeDefined();
      for (const revision of revisions!) {
        replica.ingest(revision);
      }
      await client.save("doc1", { force: true });
      replica.edit([11]);
      await client.save("doc1", { force: true });
      // @ts-ignore
      const revisions1 = replica["revisions"].slice(0, 3).map((data, i) => ({
        data,
        client: "id1",
        local: 0 + i,
        received: -1,
      }));
      expect(sendRevisions).toHaveBeenNthCalledWith(1, "doc1", revisions1);
      // @ts-ignore
      const revisions2 = replica["revisions"].slice(3).map((data, i) => ({
        data,
        client: "id1",
        local: 3 + i,
        received: 2,
      }));
      expect(sendRevisions).toHaveBeenNthCalledWith(2, "doc1", revisions2);
      client.close();
    });
  });
});
