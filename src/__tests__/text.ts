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

  // TODO: how do we catch rejections in listen?
  // TODO: how do we wait till all clients receive all updates?
  // TODO: there is a race condition here that we’re not dealing with where doc2.text might not equal doc1.text if doc1. hasn’t ingested doc2’s edits before we make assertions
  test("multiple clients", async () => {
    const connection = new InMemoryConnection();
    const client1 = new Client("client1", connection);
    const doc1 = await CollabText.initialize("doc", client1);
    client1.listen("doc");
    doc1.replace(0, 0, "hi");
    await client1.sync("doc");
    const client2 = new Client("client2", connection);
    client2.listen("doc");
    const doc2 = await CollabText.initialize("doc", client2);
    expect(doc2.text).toEqual(doc1.text);
    expect(doc2.text).toEqual("hi");
    doc2.replace(2, 2, " world");
    await client2.sync("doc");
    expect(doc2.text).toEqual(doc1.text);
    expect(doc2.text).toEqual("hi world");
  });
});
