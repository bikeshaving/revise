import { Client, Document, InMemoryStorage, Revision } from "../index";
describe("Document", () => {
  describe("Document.hiddenSeqAt", () => {
    test("concurrent revisions", () => {
      const client = new Client("id1", new InMemoryStorage());
      const doc = Document.create("doc1", client, "hello world");
      doc.edit(["H", 1, 6, "W", 7, 11]);
      doc.edit([0, 5, ", Brian", 11]);
      doc.edit([0, 5, ", Dr. Evil", 11], 1, 1);
      expect(doc.hiddenSeqAt(0)).toEqual([0, 11]);
      expect(doc.hiddenSeqAt(1)).toEqual([0, 1, 1, 6, 1, 4]);
      expect(doc.hiddenSeqAt(2)).toEqual([0, 1, 1, 11, 7]);
      expect(doc.hiddenSeqAt(3)).toEqual([0, 1, 1, 21, 7]);
      expect(doc.hiddenSeqAt(3)).toEqual(doc.snapshot.hiddenSeq);
    });
  });

  describe("Document.snapshotAt", () => {
    test("concurrent revisions", () => {
      const client = new Client("id1", new InMemoryStorage());
      const doc = Document.create("doc1", client, "hello world");
      doc.edit(["H", 1, 6, "W", 7, 11]);
      doc.edit([0, 5, ", Brian", 11]);
      doc.edit([0, 5, ", Dr. Evil", 11], 1, 1);
      expect(doc.snapshotAt(0)).toEqual({
        visible: "hello world",
        hidden: "",
        hiddenSeq: [0, 11],
        version: 0,
      });
      expect(doc.snapshotAt(1)).toEqual({
        visible: "Hello World",
        hidden: "hw",
        hiddenSeq: [0, 1, 1, 6, 1, 4],
        version: 1,
      });
      expect(doc.snapshotAt(2)).toEqual({
        visible: "Hello, Brian",
        hidden: "h Wworld",
        hiddenSeq: [0, 1, 1, 11, 7],
        version: 2,
      });
      expect(doc.snapshotAt(3)).toEqual({
        visible: "Hello, Brian, Dr. Evil",
        hidden: "h Wworld",
        hiddenSeq: [0, 1, 1, 21, 7],
        version: 3,
      });
      expect(doc.snapshotAt(3)).toEqual(doc.snapshot);
    });
  });

  describe("patchAt", () => {
    test("visible", () => {
      const client = new Client("id1", new InMemoryStorage());
      const doc = Document.create("doc1", client, "hello world");
      doc.edit([0, 11, "!", 11]);
      doc.edit([0, 5, "_", 6, 12]);
      doc.edit([0, 11, 12]);
      expect(doc.patchAt(0)).toEqual(["hello world", 0]);
      expect(doc.patchAt(1)).toEqual([0, 11, "!", 11]);
      expect(doc.patchAt(2)).toEqual([0, 5, "_", 6, 12]);
      expect(doc.patchAt(3)).toEqual([0, 11, 12]);
    });
  });

  describe("Document.edit", () => {
    test("simple", () => {
      const client = new Client("id1", new InMemoryStorage());
      const doc = Document.create("doc1", client, "hello world");
      doc.edit([0, 1, "era", 9, 11]);
      expect(doc.snapshot).toEqual({
        visible: "herald",
        hidden: "ello wor",
        hiddenSeq: [0, 4, 8, 2],
        version: 1,
      });
    });

    test("sequential 1", () => {
      const client = new Client("id1", new InMemoryStorage());
      const doc = Document.create("doc1", client, "hello world");
      doc.edit([0, 1, "era", 9, 11]);
      doc.edit([0, 6, "ry", 6]);
      expect(doc.snapshot.visible).toEqual("heraldry");
    });

    test("sequential 2", () => {
      const client = new Client("id1", new InMemoryStorage());
      const doc = Document.create("doc1", client, "hello world");
      doc.edit(["H", 1, 6, "W", 7, 11]);
      doc.edit([0, 5, ", Brian", 11]);
      expect(doc.snapshot.visible).toEqual("Hello, Brian");
    });

    test("sequential 3", () => {
      const client = new Client("id1", new InMemoryStorage());
      const doc = Document.create("doc1", client, "hello world");
      doc.edit([6, 11]);
      doc.edit(["hello ", 0, 5]);
      doc.edit(["goodbye ", 6, 11], 1, 0);
      expect(doc.snapshot.visible).toEqual("goodbye hello world");
    });

    test("concurrent 1", () => {
      const client = new Client("id1", new InMemoryStorage());
      const doc = Document.create("doc1", client, "hello world");
      doc.edit([0, 1, "era", 9, 11]);
      doc.edit(["Great H", 2, 5, 11], 1, 0);
      expect(doc.snapshot.visible).toEqual("Great Hera");
    });

    test("concurrent 2", () => {
      const client = new Client("id1", new InMemoryStorage());
      const doc = Document.create("doc1", client, "hello world");
      doc.edit(["H", 1, 6, "W", 7, 11]);
      doc.edit([0, 5, ", Brian", 11]);
      doc.edit([0, 5, ", Dr. Evil", 11], 1, 1);
      expect(doc.snapshot.visible).toEqual("Hello, Brian, Dr. Evil");
    });

    test("concurrent 3", () => {
      const client = new Client("id1", new InMemoryStorage());
      const doc = Document.create("doc1", client, "hello world");
      doc.edit([6, 11]);
      doc.edit(["hey ", 0, 5]);
      doc.edit(["goodbye ", 6, 11], 1, 0);
      expect(doc.snapshot).toEqual({
        visible: "goodbye hey world",
        hidden: "hello ",
        hiddenSeq: [0, 8, 6, 9],
        version: 3,
      });
    });

    test("concurrent 4", () => {
      const client = new Client("id1", new InMemoryStorage());
      const doc = Document.create("doc1", client, "hello world");
      doc.edit([6, 11]);
      doc.edit(["hey ", 0, 5], 1);
      doc.edit(["goodbye ", 0, 5], undefined, 1);
      expect(doc.snapshot).toEqual({
        visible: "goodbye hey world",
        hidden: "hello ",
        hiddenSeq: [1, 6, 17],
        version: 3,
      });
    });

    test("concurrent 5", () => {
      const client = new Client("id1", new InMemoryStorage());
      const doc = Document.create("doc1", client, "hello world");
      doc.edit([6, 11]);
      doc.edit(["hey ", 0, 5]);
      doc.edit(["goodbye ", 6, 11], 1, 0);
      expect(doc.snapshot).toEqual({
        visible: "goodbye hey world",
        hidden: "hello ",
        hiddenSeq: [0, 8, 6, 9],
        version: 3,
      });
    });

    test("concurrent 6", () => {
      const client = new Client("id1", new InMemoryStorage());
      const doc = Document.create("doc1", client, "hello world");
      //"hello world"
      // ===========++++
      doc.edit(["why ", 0, 5, " there", 5, 11, "s", 11]);
      // ++++=====++++++======+
      //"why hello there worlds"
      doc.edit([0, 11, "star", 11], 1, 0);
      // ======================++++
      //"why hello there worldsstar"
      expect(doc.snapshot.visible).toEqual("why hello there worldsstar");
    });
  });

  describe("Document.revert", () => {
    test("simple", () => {
      const client = new Client("id1", new InMemoryStorage());
      const doc = Document.create("doc1", client, "hello world");
      doc.edit(["goodbye", 5, 11]);
      doc.edit([0, 13, "s", 13]);
      doc.revert(1);
      expect(doc.snapshot.visible).toEqual("hello worlds");
    });
  });

  describe("Document.ingest", () => {
    test("simple 1", () => {
      const client1 = new Client("id1", new InMemoryStorage());
      const client2 = new Client("id2", new InMemoryStorage());
      const doc1 = Document.create("doc1", client1, "hello world");
      const [revision1] = doc1.pendingRevisions();
      doc1.ingest({ ...revision1, version: 0 });
      const doc2 = doc1.clone(client2);
      doc1.edit(["goodbye", 5, 11]);
      doc1.edit([0, 13, "s", 13]);
      doc2.edit([0, 5, "_", 6, 11]);
      const [revision2] = doc2.pendingRevisions();
      doc1.ingest({ ...revision2, version: 1 });
      expect(doc1.snapshot).toEqual({
        visible: "goodbye_worlds",
        hidden: "hello ",
        hiddenSeq: [0, 7, 5, 1, 1, 6],
        version: 3,
      });
      expect(doc1.hiddenSeqAt(0)).toEqual([0, 11]);
    });

    test("simple 2", () => {
      const client1 = new Client("id1", new InMemoryStorage());
      const client2 = new Client("id2", new InMemoryStorage());
      const doc1 = Document.create("doc1", client1, "hello world");
      const [revision1] = doc1.pendingRevisions();
      doc1.ingest({ ...revision1, version: 0 });
      const doc2 = doc1.clone(client2);
      doc1.edit(["goodbye", 5, 11]);
      const [revision2] = doc1.pendingRevisions();
      doc1.ingest({ ...revision2, version: 1 });
      doc2.ingest({ ...revision2, version: 1 });
      doc2.edit([0, 7, "hello", 7, 13]);
      doc1.edit([0, 13, "s", 13]);
      const [revision3] = doc2.pendingRevisions();
      doc1.ingest({ ...revision3, version: 2 });
      expect(doc1.snapshot).toEqual({
        visible: "goodbyehello worlds",
        hidden: "hello",
        hiddenSeq: [0, 7, 5, 12],
        version: 3,
      });
      expect(doc1.hiddenSeqAt(0)).toEqual([0, 11]);
    });

    test("idempotent", () => {
      const client1 = new Client("id1", new InMemoryStorage());
      const client2 = new Client("id2", new InMemoryStorage());
      const doc1 = Document.create("doc1", client1, "hello world");
      const [revision1] = doc1.pendingRevisions();
      doc1.ingest({ ...revision1, version: 0 });
      const doc2 = doc1.clone(client2);
      doc1.edit(["goodbye", 5, 11]);
      const [revision2] = doc1.pendingRevisions();
      doc2.ingest({ ...revision2, version: 1 });
      doc2.ingest({ ...revision2, version: 1 });
      doc2.ingest({ ...revision2, version: 1 });
      expect(doc2.snapshot).toEqual({
        visible: "goodbye world",
        hidden: "hello",
        hiddenSeq: [0, 7, 5, 6],
        version: 1,
      });
      expect(doc2.snapshot).toEqual(doc1.snapshot);
      expect(doc1.hiddenSeqAt(0)).toEqual([0, 11]);
    });

    test("concurrent 1", () => {
      const client1 = new Client("id1", new InMemoryStorage());
      const client2 = new Client("id2", new InMemoryStorage());
      const doc1 = Document.create("doc1", client1, "hello world");
      let version = 0;
      for (const revision of doc1.pendingRevisions()) {
        doc1.ingest({ ...revision, version });
        version += 1;
      }
      const doc2 = doc1.clone(client2);
      doc1.edit(["H", 1, 6, "W", 7, 11]);
      doc1.edit([0, 5, 6, 11]);
      doc2.edit([0, 5, "_", 6, 11, "!", 11]);
      doc2.edit([0, 11, 12]);
      const revisions = doc1.pendingRevisions().concat(doc2.pendingRevisions());
      for (const revision of revisions) {
        doc1.ingest({ ...revision, version });
        doc2.ingest({ ...revision, version });
        version += 1;
      }
      expect(doc1.snapshot).toEqual(doc2.snapshot);
      expect(doc1.hiddenSeqAt(0)).toEqual([0, 11]);
    });

    test("concurrent 2", () => {
      const client1 = new Client("id1", new InMemoryStorage());
      const client2 = new Client("id2", new InMemoryStorage());
      const doc1 = Document.create("doc1", client1, "hello world");
      let version = 0;
      for (const revision of doc1.pendingRevisions()) {
        doc1.ingest({ ...revision, version });
        version += 1;
      }
      const doc2 = doc1.clone(client2);
      doc1.edit(["H", 1, 6, "W", 7, 11]);
      doc1.edit([0, 5, 6, 11]);
      doc2.edit([0, 5, "_", 6, 11, "!", 11]);
      doc2.edit([0, 11, 12]);
      const revisions = doc2.pendingRevisions().concat(doc1.pendingRevisions());
      for (const revision of revisions) {
        doc1.ingest({ ...revision, version });
        doc2.ingest({ ...revision, version });
        version += 1;
      }
      expect(doc1.snapshot).toEqual(doc2.snapshot);
      expect(doc1.hiddenSeqAt(0)).toEqual([0, 11]);
    });
  });
});

describe("InMemoryStorage", () => {
  describe("sendRevisions", () => {
    test("send revision", async () => {
      const client = new Client("id1", new InMemoryStorage());
      const doc = Document.create("doc1", client, "hello world");
      const storage = new InMemoryStorage();
      doc.edit([0, 11, "!", 11]);
      doc.edit(["goodbye", 5, 12]);
      const revisions = await storage.sendRevisions(
        doc.id,
        doc.pendingRevisions(),
      );
      const revisions1 = await storage.fetchRevisions(doc.id);
      expect(revisions).toEqual(revisions1);
    });

    test("send snapshot", async () => {
      const client = new Client("id1", new InMemoryStorage());
      const doc = Document.create("doc1", client, "hello world");
      const storage = new InMemoryStorage();
      doc.edit([0, 11, "!", 11]);
      await storage.sendRevisions(doc.id, doc.pendingRevisions());
      storage.sendSnapshot(doc.id, doc.snapshotAt(1));
      storage.sendSnapshot(doc.id, doc.snapshotAt(0));
      const snapshot0 = await storage.fetchSnapshot(doc.id, 0);
      const snapshot1 = await storage.fetchSnapshot(doc.id);
      expect(snapshot0).toEqual(doc.snapshotAt(0));
      expect(snapshot1).toEqual(doc.snapshotAt(1));
      const revisions = await storage.fetchRevisions(doc.id);
      expect(revisions).toEqual([]);
    });
  });

  describe("updates", () => {
    test("subscribe", async () => {
      const client = new Client("id1", new InMemoryStorage());
      const doc = Document.create("doc1", client, "hello world");
      const storage = new InMemoryStorage();
      const revisions = await storage.sendRevisions(
        doc.id,
        doc.pendingRevisions(),
      );
      let version = 0;
      for (const revision of revisions) {
        doc.ingest({ ...revision, version });
        version += 1;
      }
      const updates = await storage.updates(doc.id);
      const revisionsPromise: Promise<Revision[]> = (async () => {
        let revisions: Revision[] = [];
        for await (const revisions1 of updates) {
          revisions = revisions.concat(revisions1);
        }
        return revisions;
      })();
      doc.edit([0, 11, "!", 11]);
      doc.edit(["H", 1, 6, "W", 7, 12]);
      const revisions1 = await storage.sendRevisions(
        doc.id,
        doc.pendingRevisions(),
      );
      for (const revision of revisions1) {
        doc.ingest({ ...revision, version });
        version += 1;
      }
      storage.close(doc.id);
      expect(storage["channelsById"][doc.id]).toEqual([]);
      await expect(revisionsPromise).resolves.toEqual(revisions1);
    });
  });

  describe("multiple clients", () => {
    test("initialize", async () => {
      const connection = new InMemoryStorage();
      const client1 = new Client("id1", connection);
      const client2 = new Client("id2", connection);
      const doc1 = await client1.createDocument("doc1", "hello world");
      await client1.sync();
      const doc2 = await client2.getDocument("doc1");
      expect(doc1.snapshot).toEqual(doc2.snapshot);
    });

    test("revisions", async () => {
      const connection = new InMemoryStorage();
      const client1 = new Client("id1", connection);
      const client2 = new Client("id2", connection);
      const doc1 = await client1.createDocument("doc1", "hello world");
      client1.connect("doc1");
      await client1.sync();
      const doc2 = await client2.getDocument("doc1");
      client2.connect("doc1");
      doc2.edit([0, 5, "_", 6, 11, "!", 11]);
      doc2.edit([0, 11, 12]);
      await client2.sync();
      expect(doc1.snapshot).toEqual(doc2.snapshot);
    });
  });
});

describe("Client", () => {
  describe("saves", () => {
    test("save", async () => {
      const storage = new InMemoryStorage();
      const client = new Client("id1", storage);
      const doc = await client.createDocument("doc1", "hello world");
      doc.edit([0, 11, "!", 11]);
      doc.edit([0, 11, 12]);
      const revisions = doc
        .pendingRevisions()
        .map((revision, version) => ({ ...revision, version }));
      await client.save(doc.id, { force: true });
      await expect(storage.fetchRevisions(doc.id)).resolves.toEqual(revisions);
    });
  });
});
