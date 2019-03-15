import { InMemoryConnection } from "../in-memory";
import { Replica, Revision } from "../../replica";

describe("InMemoryConnection", () => {
  test("send and fetch revisions", async () => {
    const doc = new Replica("client1");
    doc.edit(["hello world", 0]);
    doc.edit([0, 11, "!", 11]);
    doc.edit(["goodbye", 5, 12]);
    const connection = new InMemoryConnection();
    await connection.sendRevisions("doc1", doc.pending);
    const revisions = await connection.fetchRevisions("doc1");
    const revisions1 = doc.revisions.map((rev, global) => ({ ...rev, global }));
    expect(revisions).toEqual(revisions1);
  });

  test("send and fetch snapshots 1", async () => {
    const doc = new Replica("client1");
    doc.edit(["hello world", 0]);
    doc.edit([0, 11, "!", 11]);
    const connection = new InMemoryConnection();
    await connection.sendRevisions("doc1", doc.pending);
    connection.sendSnapshot("doc1", doc.snapshotAt(0));
    connection.sendSnapshot("doc1", doc.snapshotAt(1));
    const snapshot0 = await connection.fetchSnapshot("doc1", 0);
    const snapshot1 = await connection.fetchSnapshot("doc1");
    expect(snapshot0).toEqual(doc.snapshotAt(0));
    expect(snapshot1).toEqual(doc.snapshotAt(1));
  });

  test("send and fetch snapshots 2", async () => {
    const doc = new Replica("client1");
    doc.edit(["hello world", 0]);
    doc.edit([0, 11, "!", 11]);
    const connection = new InMemoryConnection();
    await connection.sendRevisions("doc1", doc.pending);
    connection.sendSnapshot("doc1", doc.snapshotAt(1));
    connection.sendSnapshot("doc1", doc.snapshotAt(0));
    const snapshot0 = await connection.fetchSnapshot("doc1", 0);
    const snapshot1 = await connection.fetchSnapshot("doc1");
    expect(snapshot0).toEqual(doc.snapshotAt(0));
    expect(snapshot1).toEqual(doc.snapshotAt(1));
  });

  test("subscribe", async () => {
    const doc = new Replica("client1");
    const connection = new InMemoryConnection();
    const subscription = await connection.subscribe("doc", 0);
    const revisions: Promise<Revision[]> = (async () => {
      let revisions: Revision[] = [];
      let global = 0;
      for await (const revisions1 of subscription) {
        revisions = revisions.concat(revisions1);
        for (const rev of revisions) {
          doc.ingest({ ...rev, global });
          global += 1;
        }
        if (global === 3) {
          break;
        }
      }
      return revisions;
    })();
    doc.edit(["hello world", 0]);
    doc.edit([0, 11, "!", 11]);
    doc.edit(["H", 1, 6, "W", 7, 12]);
    await connection.sendRevisions("doc", doc.pending);
    await expect(revisions).resolves.toEqual(doc.revisions);
  });
});
