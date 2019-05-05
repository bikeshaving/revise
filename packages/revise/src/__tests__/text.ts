import { InMemoryConnection } from "../connection/in-memory";
import { Client } from "../client";
import { CollabText } from "../text";

describe("CollabText", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  test("multiple texts", async () => {
    const connection = new InMemoryConnection();
    const client = new Client("client1", connection);
    const doc1 = await CollabText.initialize("doc", client);
    doc1.replace(0, 0, "hi");
    expect(doc1.text).toEqual("hi");
    const doc2 = await CollabText.initialize("doc", client);
    expect(doc2.text).toEqual(doc1.text);
    expect(doc2.text).toEqual("hi");
    doc2.replace(2, 2, " world");
    expect(doc2.text).toEqual(doc1.text);
    expect(doc2.text).toEqual("hi world");
    client.close();
  });

  test("multiple clients", async () => {
    const connection = new InMemoryConnection();
    const client1 = new Client("client1", connection);
    const doc1 = await CollabText.initialize("doc", client1);
    const sub1 = doc1.subscribe();
    sub1.next(); // prime the subscription
    doc1.replace(0, 0, "hi");
    await client1.save("doc", { force: true });
    const client2 = new Client("client2", connection);
    const doc2 = await CollabText.initialize("doc", client2);
    expect(doc2.text).toEqual(doc1.text);
    expect(doc2.text).toEqual("hi");
    doc2.replace(2, 2, " world");
    await client2.save("doc", { force: true });
    await sub1.next();
    expect(doc2.text).toEqual(doc1.text);
    expect(doc2.text).toEqual("hi world");
    doc2.replace(0, 3, "hello ");
    await client2.save("doc", { force: true });
    await sub1.next();
    expect(doc2.text).toEqual(doc1.text);
    expect(doc2.text).toEqual("hello world");
    await sub1.return!();
    await expect(sub1.next()).resolves.toEqual({ done: true });
    client1.close();
    client2.close();
  });

  test("multiple saves", async () => {
    const connection = new InMemoryConnection();
    const client1 = new Client("client1", connection);
    const doc1 = await CollabText.initialize("doc", client1);
    const sub1 = doc1.subscribe();
    sub1.next(); // prime the subscription
    doc1.replace(0, 0, "hi");
    await client1.save("doc", { force: true });
    const client2 = new Client("client2", connection);
    const doc2 = await CollabText.initialize("doc", client2);
    expect(doc2.text).toEqual(doc1.text);
    expect(doc2.text).toEqual("hi");
    doc2.replace(2, 2, " world");
    doc2.replace(0, 2, "hello");
    await client2.save("doc", { force: true });
    await sub1.next();
    doc2.replace(6, 6, "uhhh");
    doc2.replace(10, 10, " what");
    await client2.save("doc", { force: true });
    await sub1.next();
    expect(doc2.text).toEqual(doc1.text);
    expect(doc1.text).toEqual("hello uhhh whatworld");
    await sub1.return!();
    await expect(sub1.next()).resolves.toEqual({ done: true });
    client1.close();
    client2.close();
  });
});
