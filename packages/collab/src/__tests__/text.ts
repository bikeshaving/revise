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
    client1.listen("doc");
    doc1.replace(0, 0, "hi");
    await client1.sync("doc");
    const client2 = new Client("client2", connection);
    const doc2 = await CollabText.initialize("doc", client2);
    client2.listen("doc");
    expect(doc2.text).toEqual(doc1.text);
    expect(doc2.text).toEqual("hi");
    doc2.replace(2, 2, " world");
    await client2.sync("doc");
    expect(doc2.text).toEqual(doc1.text);
    expect(doc2.text).toEqual("hi world");
    doc2.replace(0, 3, "hello ");
    await client2.sync("doc");
    expect(doc2.text).toEqual(doc1.text);
    expect(doc2.text).toEqual("hello world");
  });

  test("multiple syncs", async () => {
    const connection = new InMemoryConnection();
    const client1 = new Client("client1", connection);
    const doc1 = await CollabText.initialize("doc", client1);
    client1.listen("doc");
    doc1.replace(0, 0, "hi");
    await client1.sync("doc");
    const client2 = new Client("client2", connection);
    const doc2 = await CollabText.initialize("doc", client2);
    client2.listen("doc");
    expect(doc2.text).toEqual(doc1.text);
    expect(doc2.text).toEqual("hi");
    doc2.replace(2, 2, " world");
    doc2.replace(0, 2, "hello");
    await client2.sync("doc");
    doc2.replace(6, 6, "uhhh");
    doc2.replace(10, 10, " what");
    await client2.sync("doc");
    expect(doc2.text).toEqual(doc1.text);
    expect(doc2.text).toEqual("hello uhhh whatworld");
  });
});
