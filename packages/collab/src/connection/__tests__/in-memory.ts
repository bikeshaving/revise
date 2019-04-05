import { Message, Milestone } from "../../connection";
import { InMemoryConnection } from "../in-memory";

describe("InMemoryConnection", () => {
  test("send and fetch revisions", async () => {
    const connection = new InMemoryConnection();
    const messages: Message[] = [
      {
        revision: "a",
        local: 0,
        latest: -1,
        client: "client1",
      },
      {
        revision: "b",
        local: 1,
        latest: -1,
        client: "client1",
      },
      {
        revision: "c",
        local: 2,
        latest: -1,
        client: "client1",
      },
    ];
    await connection.sendMessages("doc1", messages);
    const messages1 = await connection.fetchMessages("doc1");
    const messages2 = messages.map((message, global) => ({
      ...message,
      global,
    }));
    expect(messages1).toEqual(messages2);
  });

  // TODO: we shouldn’t be allowed to send milestones whose version is higher than the total number of messages in the connection
  test("send and fetch snapshots", async () => {
    const connection = new InMemoryConnection();
    await connection.sendMessages("doc1", [
      { revision: "hi", client: "client1", local: 0, latest: -1 },
      { revision: "hi", client: "client1", local: 1, latest: -1 },
    ]);
    const milestoneA: Milestone = {
      snapshot: "hi",
      version: 2,
    };
    await connection.sendMilestone("doc1", milestoneA);
    const milestoneB: Milestone = {
      snapshot: "hello",
      version: 3,
    };
    await expect(
      connection.sendMilestone("doc1", milestoneB),
    ).rejects.toBeDefined();

    await connection.sendMessages("doc1", [
      { revision: "hello", client: "client1", local: 2, latest: 2 },
    ]);
    await connection.sendMilestone("doc1", milestoneB);
    const milestoneC: Milestone = {
      snapshot: "uhhh",
      version: 1,
    };
    await connection.sendMilestone("doc1", milestoneC);
    const milestoneA1 = await connection.fetchMilestone("doc1", 2);
    const milestoneB1 = await connection.fetchMilestone("doc1");
    const milestoneC1 = await connection.fetchMilestone("doc1", 1);
    expect(milestoneA).toEqual(milestoneA1);
    expect(milestoneB).toEqual(milestoneB1);
    expect(milestoneC).toEqual(milestoneC1);
    await expect(connection.fetchMilestone("doc1", 0)).resolves.toBeUndefined();
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
      {
        revision: "a",
        local: 0,
        latest: -1,
        client: "client1",
      },
      {
        revision: "b",
        local: 1,
        latest: -1,
        client: "client1",
      },
    ];
    await connection.sendMessages("doc", messages1);
    const messages2 = [
      {
        revision: "c",
        local: 2,
        latest: -1,
        client: "client1",
      },
    ];
    await connection.sendMessages("doc", messages2);
    const messages3 = messages1
      .concat(messages2)
      .map((message, global) => ({ ...message, global }));
    await expect(messages).resolves.toEqual(messages3);
  });
});
