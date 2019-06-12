import { Server } from "ws";

import { Checkpoint, Message } from "../../connection";
import { InMemoryConnection } from "../in-memory";
import { listen, SocketConnection, SocketProxy } from "../socket";

describe("SocketConnection", () => {
  const port = 6969;
  const url = `ws://localhost:${port}`;

  let server: Server;
  beforeEach((done) => (server = new Server({ port }, done)));
  afterEach((done) => server.close(done));

  test("listen closes", async () => {
    server.once("connection", (socket: WebSocket) => {
      socket.close();
    });
    const socket = new WebSocket(url);
    const chan = listen(socket);
    await expect(chan.next()).resolves.toEqual({ done: true });
  });

  test("listen listens", async () => {
    server.once("connection", (socket: WebSocket) => {
      socket.send("hello");
      socket.send("world");
      socket.close();
    });
    const socket = new WebSocket(url);
    const chan = listen(socket);
    await expect(chan.next()).resolves.toEqual({ value: "hello", done: false });
    await expect(chan.next()).resolves.toEqual({ value: "world", done: false });
    await expect(chan.next()).resolves.toEqual({ done: true });
  });

  test("messages", async () => {
    const storage = new InMemoryConnection();
    server.on("connection", (socket: WebSocket) => {
      new SocketProxy(socket, storage);
    });
    const socket = new WebSocket(url);
    const conn = new SocketConnection(socket);
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
    socket.close();
  });

  test("checkpoints", async () => {
    const storage = new InMemoryConnection();
    server.on("connection", (socket: WebSocket) => {
      new SocketProxy(socket, storage);
    });
    const socket = new WebSocket(url);
    const conn = new SocketConnection(socket);
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
    socket.close();
  });

  test("subscribe", async () => {
    const storage = new InMemoryConnection();
    server.on("connection", (socket: WebSocket) => {
      new SocketProxy(socket, storage);
    });
    const socket = new WebSocket(url);
    const conn = new SocketConnection(socket);
    const subscription = conn.subscribe("doc", 0);
    const messages: Promise<Message[]> = (async () => {
      let messages: Message[] = [];
      for await (const messages1 of subscription) {
        messages = messages.concat(messages1);
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
    socket.close();
    await expect(messages).resolves.toEqual(messages3);
  });
});
