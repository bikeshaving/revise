import {Server} from "ws";

import {Checkpoint, Revision} from "../../connection";
import {InMemoryConnection} from "../in-memory";
import {listen, SocketConnection, SocketProxy} from "../socket";

describe("SocketConnection", () => {
	const port = 6969;
	const url = `ws://localhost:${port}`;

	let server: Server;
	beforeEach(
		() => new Promise<void>((done) => (server = new Server({port}, done))),
	);
	afterEach(() => new Promise((done) => server.close(done)));

	test("listen closes", async () => {
		server.once("connection", (socket: WebSocket) => {
			socket.close();
		});
		const socket = new WebSocket(url);
		const chan = listen(socket);
		await expect(chan.next()).resolves.toEqual({done: true});
	});

	test("listen listens", async () => {
		server.once("connection", (socket: WebSocket) => {
			socket.send("hello");
			socket.send("world");
			socket.close();
		});
		const socket = new WebSocket(url);
		const chan = listen(socket);
		await expect(chan.next()).resolves.toEqual({value: "hello", done: false});
		await expect(chan.next()).resolves.toEqual({value: "world", done: false});
		await expect(chan.next()).resolves.toEqual({done: true});
	});

	test("revisions", async () => {
		const storage = new InMemoryConnection();
		const result = new Promise((resolve) => {
			server.on("connection", (socket: WebSocket) => {
				const proxy = new SocketProxy(socket, storage);
				resolve(proxy.connect());
			});
		});
		const socket = new WebSocket(url);
		const conn = new SocketConnection(socket);
		const revisions: Revision[] = [
			{patch: "a", client: "client1", local: 0, received: -1, version: 0},
			{patch: "b", client: "client1", local: 1, received: -1, version: 1},
			{patch: "c", client: "client1", local: 2, received: -1, version: 2},
		];
		await conn.sendRevisions("doc1", revisions);
		const revisions1 = await conn.fetchRevisions("doc1");
		const revisions2 = revisions.map((rev, version) => ({
			...rev,
			version,
		}));
		expect(revisions2).toEqual(revisions1);
		socket.close();
		await expect(result).resolves.toBeUndefined();
	});

	test("checkpoints", async () => {
		const storage = new InMemoryConnection();
		const result = new Promise((resolve) => {
			server.on("connection", (socket: WebSocket) => {
				const proxy = new SocketProxy(socket, storage);
				resolve(proxy.connect());
			});
		});
		const socket = new WebSocket(url);
		const conn = new SocketConnection(socket);
		await conn.sendRevisions("doc1", [
			{patch: "hi", client: "client1", local: 0, received: -1, version: 0},
			{patch: "hi", client: "client1", local: 1, received: -1, version: 1},
		]);
		const checkpointA: Checkpoint = {snapshot: "hi", version: 2};
		await conn.sendCheckpoint("doc1", checkpointA);
		const checkpointB: Checkpoint = {snapshot: "hello", version: 3};
		await expect(
			conn.sendCheckpoint("doc1", checkpointB),
		).rejects.toBeDefined();
		await conn.sendRevisions("doc1", [
			{patch: "hello", client: "client1", local: 2, received: 2, version: 2},
		]);
		await conn.sendCheckpoint("doc1", checkpointB);
		const checkpointC: Checkpoint = {snapshot: "uhhh", version: 1};
		await conn.sendCheckpoint("doc1", checkpointC);
		const checkpointA1 = await conn.fetchCheckpoint("doc1", 2);
		const checkpointB1 = await conn.fetchCheckpoint("doc1");
		const checkpointC1 = await conn.fetchCheckpoint("doc1", 1);
		expect(checkpointA).toEqual(checkpointA1);
		expect(checkpointB).toEqual(checkpointB1);
		expect(checkpointC).toEqual(checkpointC1);
		await expect(conn.fetchCheckpoint("doc1", 0)).resolves.toBeUndefined();
		socket.close();
		await expect(result).resolves.toBeUndefined();
	});

	test("subscribe", async () => {
		const storage = new InMemoryConnection();
		const result = new Promise((resolve) => {
			server.on("connection", (socket: WebSocket) => {
				const proxy = new SocketProxy(socket, storage);
				resolve(proxy.connect());
			});
		});
		const socket = new WebSocket(url);
		const conn = new SocketConnection(socket);
		const subscription = conn.subscribe("doc", 0);
		const revisions: Promise<Revision[]> = (async () => {
			let revisions: Revision[] = [];
			for await (const revisions1 of subscription) {
				revisions = revisions.concat(revisions1);
			}
			return revisions;
		})();
		const revisions1: Revision[] = [
			{patch: "a", client: "client1", local: 0, received: -1, version: 0},
			{patch: "b", client: "client1", local: 1, received: -1, version: 1},
		];
		await conn.sendRevisions("doc", revisions1);
		const revisions2: Revision[] = [
			{patch: "c", client: "client1", local: 2, received: -1, version: 2},
		];
		await conn.sendRevisions("doc", revisions2);
		socket.close();
		await expect(revisions).resolves.toEqual(revisions1.concat(revisions2));
		await expect(result).resolves.toBeUndefined();
	});
});
