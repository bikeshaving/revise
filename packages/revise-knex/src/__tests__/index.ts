import * as Knex from "knex";
import { KnexConnection } from "../index";
// @ts-ignore
import * as knexfile from "../../knexfile";
import { Message } from "@createx/revise/lib/connection";

describe("KnexConnection", () => {
  let knex: Knex;
  beforeAll(() => {
    knex = Knex(knexfile);
  });

  beforeEach(async () => {
    await knex("revise_message").truncate();
  });

  afterAll(async () => {
    await knex("revise_message").truncate();
    knex.destroy();
  });

  test("messages", async () => {
    const conn = new KnexConnection(knex);
    const messages: Message[] = [
      { data: "a", client: "client1", local: 0, received: -1 },
      { data: "b", client: "client1", local: 1, received: -1 },
      { data: "c", client: "client1", local: 2, received: -1 },
      { data: "d", client: "client1", local: 3, received: -1 },
      { data: "e", client: "client1", local: 4, received: -1 },
    ];
    await conn.sendMessages("doc1", messages);
    const messages1 = await conn.fetchMessages("doc1");
    const messages2 = messages.map((message, version) => ({
      ...message,
      version,
    }));
    expect(messages1).toEqual(messages2);
  });

  test("multiple sendMessages", async () => {
    const conn = new KnexConnection(knex);
    const messages: Message[] = [
      { data: "a", client: "client1", local: 0, received: -1 },
      { data: "b", client: "client1", local: 1, received: -1 },
      { data: "c", client: "client1", local: 2, received: -1 },
      { data: "d", client: "client1", local: 3, received: -1 },
      { data: "e", client: "client1", local: 4, received: -1 },
    ];
    await conn.sendMessages("doc1", messages.slice(0, 2));
    await conn.sendMessages("doc1", messages.slice(2));
    const messages1 = await conn.fetchMessages("doc1");
    const messages2 = messages.map((message, version) => ({
      ...message,
      version,
    }));
    expect(messages1).toEqual(messages2);
  });

  test("sendMessages idempotent", async () => {
    const conn = new KnexConnection(knex);
    const messages: Message[] = [
      { data: "a", client: "client1", local: 0, received: -1 },
      { data: "b", client: "client1", local: 1, received: -1 },
      { data: "c", client: "client1", local: 2, received: -1 },
      { data: "d", client: "client1", local: 3, received: -1 },
      { data: "e", client: "client1", local: 4, received: -1 },
    ];
    await conn.sendMessages("doc1", messages.slice(0, 3));
    await conn.sendMessages("doc1", messages.slice(2));
    const messages1 = await conn.fetchMessages("doc1");
    const messages2 = messages.map((message, version) => ({
      ...message,
      version,
    }));
    expect(messages1).toEqual(messages2);
  });

  test("multiple clients", async () => {
    const conn = new KnexConnection(knex);
    const messages: Message[] = [
      { data: "a", client: "client1", local: 0, received: -1 },
      { data: "b", client: "client1", local: 1, received: -1 },
      { data: "c", client: "client1", local: 2, received: 2 },
      { data: "d", client: "client1", local: 3, received: 2 },
      { data: "e", client: "client1", local: 4, received: 2 },
      { data: "1", client: "client2", local: 0, received: 2 },
      { data: "2", client: "client2", local: 1, received: 2 },
      { data: "3", client: "client2", local: 2, received: 2 },
      { data: "4", client: "client2", local: 3, received: 2 },
    ];
    await conn.sendMessages("doc1", messages.slice(0, 2));
    await conn.sendMessages("doc1", messages.slice(5, 8));
    await conn.sendMessages(
      "doc1",
      messages.slice(2, 4).concat(messages.slice(8)),
    );
  });

  test("missing message throws", async () => {
    const conn = new KnexConnection(knex);
    const messages: Message[] = [
      { data: "a", client: "client1", local: 0, received: -1 },
      { data: "b", client: "client1", local: 1, received: -1 },
      { data: "d", client: "client1", local: 3, received: -1 },
      { data: "e", client: "client1", local: 4, received: -1 },
    ];
    await expect(conn.sendMessages("doc1", messages)).rejects.toThrow();
  });

  test("missing message with multiple clients throws", async () => {
    const conn = new KnexConnection(knex);
    const messages: Message[] = [
      { data: "a", client: "client1", local: 0, received: -1 },
      { data: "b", client: "client1", local: 1, received: -1 },
      { data: "c", client: "client1", local: 2, received: 2 },
      { data: "d", client: "client1", local: 3, received: 2 },
      { data: "e", client: "client1", local: 4, received: 2 },
      { data: "1", client: "client2", local: 0, received: 2 },
      { data: "2", client: "client2", local: 1, received: 2 },
      { data: "4", client: "client2", local: 3, received: 2 },
    ];
    await conn.sendMessages("doc1", messages.slice(0, 2));
    await conn.sendMessages("doc1", messages.slice(5, 7));
    await expect(
      conn.sendMessages("doc1", messages.slice(2, 5).concat(messages.slice(7))),
    ).rejects.toThrow();
  });

  test("messages with start", async () => {
    const conn = new KnexConnection(knex);

    const messages: Message[] = [
      { data: "a", client: "client1", local: 0, received: -1 },
      { data: "b", client: "client1", local: 1, received: -1 },
      { data: "c", client: "client1", local: 2, received: -1 },
      { data: "d", client: "client1", local: 3, received: -1 },
      { data: "e", client: "client1", local: 4, received: -1 },
    ];
    await conn.sendMessages("doc1", messages);
    const messages1 = await conn.fetchMessages("doc1", 1);
    const messages2 = messages.slice(1).map((message, version) => ({
      ...message,
      version: version + 1,
    }));
    expect(messages1).toEqual(messages2);
  });

  test("messages with end", async () => {
    const conn = new KnexConnection(knex);

    const messages: Message[] = [
      { data: "a", client: "client1", local: 0, received: -1 },
      { data: "b", client: "client1", local: 1, received: -1 },
      { data: "c", client: "client1", local: 2, received: -1 },
      { data: "d", client: "client1", local: 3, received: -1 },
      { data: "e", client: "client1", local: 4, received: -1 },
    ];
    await conn.sendMessages("doc1", messages);

    const messages1 = await conn.fetchMessages("doc1", undefined, 2);
    const messages2 = messages.slice(0, 2).map((message, version) => ({
      ...message,
      version: version,
    }));
    expect(messages1).toEqual(messages2);
  });

  test("messages with start and end", async () => {
    const conn = new KnexConnection(knex);
    const messages: Message[] = [
      { data: "a", client: "client1", local: 0, received: -1 },
      { data: "b", client: "client1", local: 1, received: -1 },
      { data: "c", client: "client1", local: 2, received: -1 },
      { data: "d", client: "client1", local: 3, received: -1 },
      { data: "e", client: "client1", local: 4, received: -1 },
    ];

    await conn.sendMessages("doc1", messages);

    const messages1 = await conn.fetchMessages("doc1", 1, 2);
    const messages2 = messages.slice(1, 2).map((message, version) => ({
      ...message,
      version: version + 1,
    }));
    expect(messages1).toEqual(messages2);
  });

  test("fetchMessages with negative indexes", async () => {
    const conn = new KnexConnection(knex);

    await expect(conn.fetchMessages("doc1", -1)).rejects.toThrow(RangeError);
    await expect(conn.fetchMessages("doc1", 1, -2)).rejects.toThrow(RangeError);
  });

  test("fetchMessages with end less than or equal to start", async () => {
    const conn = new KnexConnection(knex);

    await expect(conn.fetchMessages("doc1", 2, 2)).rejects.toThrow(RangeError);
    await expect(conn.fetchMessages("doc1", 5, 3)).rejects.toThrow(RangeError);
  });

  test("subscribe", async () => {
    const conn = new KnexConnection(knex);

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
      { data: "c", client: "client1", local: 2, received: 1 },
    ];
    await conn.sendMessages("doc", messages1.slice(0, 2));
    await conn.sendMessages("doc", messages1.slice(2));
    const messages2 = messages1.map((message, version) => ({
      ...message,
      version,
    }));
    await expect(messages).resolves.toEqual(messages2);
  });
});
