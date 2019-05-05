import { Checkpoint, Message } from "../../connection";
import { InMemoryConnection } from "../in-memory";

describe("InMemoryConnection", () => {
  test("send and fetch messages", async () => {
    const connection = new InMemoryConnection();
    const messages: Message[] = [
      { data: "a", client: "client1", local: 0, received: -1 },
      { data: "b", client: "client1", local: 1, received: -1 },
      { data: "c", client: "client1", local: 2, received: -1 },
    ];
    await connection.sendMessages("doc1", messages);
    const messages1 = await connection.fetchMessages("doc1");
    const messages2 = messages.map((message, version) => ({
      ...message,
      version,
    }));
    expect(messages1).toEqual(messages2);
  });

  test("send and fetch checkpoints", async () => {
    const connection = new InMemoryConnection();
    await connection.sendMessages("doc1", [
      { data: "hi", client: "client1", local: 0, received: -1 },
      { data: "hi", client: "client1", local: 1, received: -1 },
    ]);
    const checkpointA: Checkpoint = { data: "hi", version: 2 };
    await connection.sendCheckpoint("doc1", checkpointA);
    const checkpointB: Checkpoint = { data: "hello", version: 3 };
    await expect(
      connection.sendCheckpoint("doc1", checkpointB),
    ).rejects.toBeDefined();

    await connection.sendMessages("doc1", [
      { data: "hello", client: "client1", local: 2, received: 2 },
    ]);
    await connection.sendCheckpoint("doc1", checkpointB);
    const checkpointC: Checkpoint = { data: "uhhh", version: 1 };
    await connection.sendCheckpoint("doc1", checkpointC);
    const checkpointA1 = await connection.fetchCheckpoint("doc1", 2);
    const checkpointB1 = await connection.fetchCheckpoint("doc1");
    const checkpointC1 = await connection.fetchCheckpoint("doc1", 1);
    expect(checkpointA).toEqual(checkpointA1);
    expect(checkpointB).toEqual(checkpointB1);
    expect(checkpointC).toEqual(checkpointC1);
    await expect(
      connection.fetchCheckpoint("doc1", 0),
    ).resolves.toBeUndefined();
  });

  test("subscribe", async () => {
    const connection = new InMemoryConnection();
    const subscription = connection.subscribe("doc", 0);
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
    await connection.sendMessages("doc", messages1);
    const messages2 = [
      { data: "c", client: "client1", local: 2, received: -1 },
    ];
    await connection.sendMessages("doc", messages2);
    const messages3 = messages1
      .concat(messages2)
      .map((message, version) => ({ ...message, version }));
    await expect(messages).resolves.toEqual(messages3);
  });
});
