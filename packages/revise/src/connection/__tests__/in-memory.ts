import { Checkpoint, Message } from "../../connection";
import { InMemoryConnection } from "../in-memory";

describe("InMemoryConnection", () => {
  test("messages", async () => {
    const conn = new InMemoryConnection();
    const messages: Message[] = [
      { data: "a", client: "client1", local: 0, received: -1 },
      { data: "b", client: "client1", local: 1, received: -1 },
      { data: "c", client: "client1", local: 2, received: -1 },
    ];
    await conn.sendMessages("doc1", messages);
    const messages1 = await conn.fetchMessages("doc1");
    const messages2 = messages.map((message, version) => ({
      ...message,
      version,
    }));
    expect(messages2).toEqual(messages1);
  });

  test("checkpoints", async () => {
    const conn = new InMemoryConnection();
    await conn.sendMessages("doc1", [
      { data: "hi", client: "client1", local: 0, received: -1 },
      { data: "hi", client: "client1", local: 1, received: -1 },
    ]);
    const checkpointA: Checkpoint = { data: "hi", version: 2 };
    await conn.sendCheckpoint("doc1", checkpointA);
    const checkpointB: Checkpoint = { data: "hello", version: 3 };
    await expect(
      conn.sendCheckpoint("doc1", checkpointB),
    ).rejects.toBeDefined();

    await conn.sendMessages("doc1", [
      { data: "hello", client: "client1", local: 2, received: 2 },
    ]);
    await conn.sendCheckpoint("doc1", checkpointB);
    const checkpointC: Checkpoint = { data: "uhhh", version: 1 };
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
    const messages: Promise<Message[]> = (async () => {
      let messages: Message[] = [];
      for await (const messages1 of subscription) {
        messages = messages.concat(messages1);
        if (messages.length === 3) {
          break;
        }
      }
      return messages;
    })();
    const messages1 = [
      { data: "a", client: "client1", local: 0, received: -1 },
      { data: "b", client: "client1", local: 1, received: -1 },
    ];
    await conn.sendMessages("doc", messages1);
    const messages2 = [
      { data: "c", client: "client1", local: 2, received: -1 },
    ];
    await conn.sendMessages("doc", messages2);
    const messages3 = messages1
      .concat(messages2)
      .map((message, version) => ({ ...message, version }));
    await expect(messages).resolves.toEqual(messages3);
  });
});
