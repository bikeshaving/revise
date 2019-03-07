import { Replica } from "../Replica";

describe("Replica", () => {
  describe("Replica.hiddenSeqAt", () => {
    test("concurrent revisions", () => {
      const doc = Replica.create("client1", "hello world");
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

  describe("Replica.snapshotAt", () => {
    test("concurrent revisions", () => {
      const doc = Replica.create("client1", "hello world");
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
      const doc = Replica.create("client1", "hello world");
      doc.edit([0, 11, "!", 11]);
      doc.edit([0, 5, "_", 6, 12]);
      doc.edit([0, 11, 12]);
      expect(doc.patchAt(0)).toEqual(["hello world", 0]);
      expect(doc.patchAt(1)).toEqual([0, 11, "!", 11]);
      expect(doc.patchAt(2)).toEqual([0, 5, "_", 6, 12]);
      expect(doc.patchAt(3)).toEqual([0, 11, 12]);
    });
  });

  describe("Replica.edit", () => {
    test("simple", () => {
      const doc = Replica.create("client1", "hello world");
      doc.edit([0, 1, "era", 9, 11]);
      expect(doc.snapshot).toEqual({
        visible: "herald",
        hidden: "ello wor",
        hiddenSeq: [0, 4, 8, 2],
        version: 1,
      });
    });

    test("sequential 1", () => {
      const doc = Replica.create("client1", "hello world");
      doc.edit([0, 1, "era", 9, 11]);
      doc.edit([0, 6, "ry", 6]);
      expect(doc.snapshot.visible).toEqual("heraldry");
    });

    test("sequential 2", () => {
      const doc = Replica.create("client1", "hello world");
      doc.edit(["H", 1, 6, "W", 7, 11]);
      doc.edit([0, 5, ", Brian", 11]);
      expect(doc.snapshot.visible).toEqual("Hello, Brian");
    });

    test("sequential 3", () => {
      const doc = Replica.create("client1", "hello world");
      doc.edit([6, 11]);
      doc.edit(["hello ", 0, 5]);
      doc.edit(["goodbye ", 6, 11], 1, 0);
      expect(doc.snapshot.visible).toEqual("goodbye hello world");
    });

    test("concurrent 1", () => {
      const doc = Replica.create("client1", "hello world");
      doc.edit([0, 1, "era", 9, 11]);
      doc.edit(["Great H", 2, 5, 11], 1, 0);
      expect(doc.snapshot.visible).toEqual("Great Hera");
    });

    test("concurrent 2", () => {
      const doc = Replica.create("client1", "hello world");
      doc.edit(["H", 1, 6, "W", 7, 11]);
      doc.edit([0, 5, ", Brian", 11]);
      doc.edit([0, 5, ", Dr. Evil", 11], 1, 1);
      expect(doc.snapshot.visible).toEqual("Hello, Brian, Dr. Evil");
    });

    test("concurrent 3", () => {
      const doc = Replica.create("client1", "hello world");
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
      const doc = Replica.create("client1", "hello world");
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
      const doc = Replica.create("client1", "hello world");
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
      const doc = Replica.create("client1", "hello world");
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

  describe("Replica.revert", () => {
    test("simple", () => {
      const doc = Replica.create("client1", "hello world");
      doc.edit(["goodbye", 5, 11]);
      doc.edit([0, 13, "s", 13]);
      doc.revert(1);
      expect(doc.snapshot.visible).toEqual("hello worlds");
    });
  });

  describe("Replica.ingest", () => {
    test("simple 1", () => {
      const doc1 = Replica.create("client1", "hello world");
      const [revision1] = doc1.pending;
      doc1.ingest({ ...revision1, global: 0 });
      const doc2 = doc1.clone("client2");
      doc1.edit(["goodbye", 5, 11]);
      doc1.edit([0, 13, "s", 13]);
      doc2.edit([0, 5, "_", 6, 11]);
      const [revision2] = doc2.pending;
      doc1.ingest({ ...revision2, global: 1 });
      expect(doc1.snapshot).toEqual({
        visible: "goodbye_worlds",
        hidden: "hello ",
        hiddenSeq: [0, 7, 5, 1, 1, 6],
        version: 3,
      });
      expect(doc1.hiddenSeqAt(0)).toEqual([0, 11]);
    });

    test("simple 2", () => {
      const doc1 = Replica.create("client1", "hello world");
      const [revision1] = doc1.pending;
      doc1.ingest({ ...revision1, global: 0 });
      const doc2 = doc1.clone("client2");
      doc1.edit(["goodbye", 5, 11]);
      const [revision2] = doc1.pending;
      doc1.ingest({ ...revision2, global: 1 });
      doc2.ingest({ ...revision2, global: 1 });
      doc2.edit([0, 7, "hello", 7, 13]);
      doc1.edit([0, 13, "s", 13]);
      const [revision3] = doc2.pending;
      doc1.ingest({ ...revision3, global: 2 });
      expect(doc1.snapshot).toEqual({
        visible: "goodbyehello worlds",
        hidden: "hello",
        hiddenSeq: [0, 7, 5, 12],
        version: 3,
      });
      expect(doc1.hiddenSeqAt(0)).toEqual([0, 11]);
    });

    test("idempotent", () => {
      const doc1 = Replica.create("client1", "hello world");
      const [revision1] = doc1.pending;
      doc1.ingest({ ...revision1, global: 0 });
      const doc2 = doc1.clone("client2");
      doc1.edit(["goodbye", 5, 11]);
      const [revision2] = doc1.pending;
      doc2.ingest({ ...revision2, global: 1 });
      doc2.ingest({ ...revision2, global: 1 });
      doc2.ingest({ ...revision2, global: 1 });
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
      const doc1 = Replica.create("client1", "hello world");
      let global = 0;
      for (const rev of doc1.pending) {
        doc1.ingest({ ...rev, global });
        global += 1;
      }
      const doc2 = doc1.clone("client2");
      doc1.edit(["H", 1, 6, "W", 7, 11]);
      doc1.edit([0, 5, 6, 11]);
      doc2.edit([0, 5, "_", 6, 11, "!", 11]);
      doc2.edit([0, 11, 12]);
      const revisions = doc1.pending.concat(doc2.pending);
      for (const rev of revisions) {
        doc1.ingest({ ...rev, global });
        doc2.ingest({ ...rev, global });
        global += 1;
      }
      expect(doc1.snapshot).toEqual(doc2.snapshot);
      expect(doc1.hiddenSeqAt(0)).toEqual([0, 11]);
    });

    test("concurrent 2", () => {
      const doc1 = Replica.create("client1", "hello world");
      let global = 0;
      for (const rev of doc1.pending) {
        doc1.ingest({ ...rev, global });
        global += 1;
      }
      const doc2 = doc1.clone("client2");
      doc1.edit(["H", 1, 6, "W", 7, 11]);
      doc1.edit([0, 5, 6, 11]);
      doc2.edit([0, 5, "_", 6, 11, "!", 11]);
      doc2.edit([0, 11, 12]);
      const revisions = doc2.pending.concat(doc1.pending);
      for (const rev of revisions) {
        doc1.ingest({ ...rev, global });
        doc2.ingest({ ...rev, global });
        global += 1;
      }
      expect(doc1.snapshot).toEqual(doc2.snapshot);
      expect(doc1.hiddenSeqAt(0)).toEqual([0, 11]);
    });
  });
});
