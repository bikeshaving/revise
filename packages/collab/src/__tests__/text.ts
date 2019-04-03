import { InMemoryConnection } from "../connection/in-memory";
import { Client } from "../client";
import { CollabText } from "../text";

describe("CollabText", () => {
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
  });

  test("multiple clients", async () => {
    const connection = new InMemoryConnection();
    const client1 = new Client("client1", connection);
    const doc1 = await CollabText.initialize("doc", client1);
    const sub1 = doc1.subscribe();
    doc1.replace(0, 0, "hi");
    await client1.save("doc");
    await sub1.next();
    const client2 = new Client("client2", connection);
    const doc2 = await CollabText.initialize("doc", client2);
    expect(doc2.text).toEqual(doc1.text);
    expect(doc2.text).toEqual("hi");
    doc2.replace(2, 2, " world");
    await client2.save("doc");
    await sub1.next();
    expect(doc2.text).toEqual(doc1.text);
    expect(doc2.text).toEqual("hi world");
    doc2.replace(0, 3, "hello ");
    await client2.save("doc");
    await sub1.next();
    expect(doc2.text).toEqual(doc1.text);
    expect(doc2.text).toEqual("hello world");
    sub1.return!();
    await expect(sub1.next()).resolves.toEqual({ done: true });
  });

  test("multiple syncs", async () => {
    const connection = new InMemoryConnection();
    const client1 = new Client("client1", connection);
    const doc1 = await CollabText.initialize("doc", client1);
    const sub1 = doc1.subscribe();
    doc1.replace(0, 0, "hi");
    await client1.save("doc");
    await sub1.next();
    const client2 = new Client("client2", connection);
    const doc2 = await CollabText.initialize("doc", client2);
    const sub2 = doc2.subscribe();
    expect(doc2.text).toEqual(doc1.text);
    expect(doc2.text).toEqual("hi");
    doc2.replace(2, 2, " world");
    doc2.replace(0, 2, "hello");
    await client2.save("doc");
    await Promise.all([sub1.next(), sub1.next(), sub2.next(), sub2.next()]);
    doc2.replace(6, 6, "uhhh");
    doc2.replace(10, 10, " what");
    await client2.save("doc");
    await Promise.all([sub1.next(), sub1.next(), sub2.next(), sub2.next()]);
    expect(doc2.text).toEqual(doc1.text);
    expect(doc2.text).toEqual("hello uhhh whatworld");
    sub1.return!();
    sub2.return!();
    await expect(sub1.next()).resolves.toEqual({ done: true });
    await expect(sub2.next()).resolves.toEqual({ done: true });
  });
});
