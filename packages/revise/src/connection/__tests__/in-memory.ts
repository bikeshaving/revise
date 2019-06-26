import { Checkpoint, Revision } from "../../connection";
import { InMemoryConnection } from "../in-memory";

describe("InMemoryConnection", () => {
  test("revisions", async () => {
    const conn = new InMemoryConnection();
    const revisions: Revision[] = [
      { patch: "a", client: "client1", local: 0, received: -1, version: 0 },
      { patch: "b", client: "client1", local: 1, received: -1, version: 1 },
      { patch: "c", client: "client1", local: 2, received: -1, version: 2 },
    ];
    await conn.sendRevisions("doc1", revisions);
    const revisions1 = await conn.fetchRevisions("doc1");
    expect(revisions).toEqual(revisions1);
  });

  test("checkpoints", async () => {
    const conn = new InMemoryConnection();
    await conn.sendRevisions("doc1", [
      { patch: "hi", client: "client1", local: 0, received: -1, version: 0 },
      { patch: "hi", client: "client1", local: 1, received: -1, version: 1 },
    ]);
    const checkpointA: Checkpoint = { snapshot: "hi", version: 2 };
    await conn.sendCheckpoint("doc1", checkpointA);
    const checkpointB: Checkpoint = { snapshot: "hello", version: 3 };
    await expect(
      conn.sendCheckpoint("doc1", checkpointB),
    ).rejects.toBeDefined();

    await conn.sendRevisions("doc1", [
      { patch: "hello", client: "client1", local: 2, received: 2, version: 2 },
    ]);
    await conn.sendCheckpoint("doc1", checkpointB);
    const checkpointC: Checkpoint = { snapshot: "uhhh", version: 1 };
    await conn.sendCheckpoint("doc1", checkpointC);
    const checkpointA1 = await conn.fetchCheckpoint("doc1", 2);
    const checkpointB1 = await conn.fetchCheckpoint("doc1");
    const checkpointC1 = await conn.fetchCheckpoint("doc1", 1);
    expect(checkpointA).toEqual(checkpointA1);
    expect(checkpointB).toEqual(checkpointB1);
    expect(checkpointC).toEqual(checkpointC1);
    await expect(conn.fetchCheckpoint("doc1", 0)).resolves.toBeUndefined();
  });

  test("subscribe", async () => {
    const conn = new InMemoryConnection();
    const subscription = conn.subscribe("doc", 0);
    const revisions: Promise<Revision[]> = (async () => {
      let revisions: Revision[] = [];
      for await (const revisions1 of subscription) {
        revisions = revisions.concat(revisions1);
      }
      return revisions;
    })();
    const revisions1: Revision[] = [
      { patch: "a", client: "client1", local: 0, received: -1, version: 0 },
      { patch: "b", client: "client1", local: 1, received: -1, version: 1 },
    ];
    await conn.sendRevisions("doc", revisions1);
    const revisions2 = [
      { patch: "c", client: "client1", local: 2, received: -1, version: 2 },
    ];
    await conn.sendRevisions("doc", revisions2);
    conn.close();
    await expect(revisions).resolves.toEqual(revisions1.concat(revisions2));
  });
});
