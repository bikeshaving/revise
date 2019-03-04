import * as shredder from "../index";

describe("subseq", () => {
  describe("count", () => {
    const s = [0, 10, 5, 8, 4, 4];
    test("all", () => {
      expect(shredder.count(s)).toEqual(31);
    });
    test("false", () => {
      expect(shredder.count(s, false)).toEqual(22);
    });
    test("true", () => {
      expect(shredder.count(s, true)).toEqual(9);
    });
  });

  describe("union", () => {
    test("empty", () => {
      const s = [1, 4, 4];
      const t = [0, 8];
      expect(shredder.union(s, t)).toEqual(s);
    });

    test("complex", () => {
      const s = [1, 2, 2, 2];
      const t = [0, 1, 2, 2, 1];
      const result = [1, 3, 1, 2];
      expect(shredder.union(s, t)).toEqual(result);
    });
  });

  describe("difference", () => {
    test("empty", () => {
      const s = [1, 8];
      const t = [1, 4, 4];
      const result = [0, 4, 4];
      expect(shredder.difference(s, t)).toEqual(result);
    });

    test("complex", () => {
      const s = [1, 2, 2, 2];
      const t = [0, 1, 1, 1, 1, 1, 1];
      const result = [1, 1, 3, 1, 1];
      expect(shredder.difference(s, t)).toEqual(result);
    });
  });

  describe("expand/shrink", () => {
    test("complex", () => {
      const s = [0, 4, 4, 6, 5, 3];
      const t = [0, 10, 5, 8, 4, 4];
      const expanded = shredder.expand(s, t);
      const result = [0, 4, 4, 11, 4, 4, 1, 3];
      expect(expanded).toEqual(result);
      expect(shredder.shrink(expanded, t)).toEqual(s);
    });
  });

  describe("interleave", () => {
    test("error when mismatched", () => {
      expect(() => {
        shredder.interleave([0, 5, 1], [1, 1, 4]);
      }).toThrow();
    });

    test("error when mismatched 2", () => {
      expect(() => {
        shredder.interleave([0, 12], [0, 11]);
      }).toThrow();
    });

    test("empty subseq 1", () => {
      // =++=======
      const s = [0, 1, 2, 7];
      // ========
      const t = [0, 8];
      // ==========
      const t1 = [0, 10];
      expect(shredder.interleave(s, t)).toEqual([s, t1]);
      expect(shredder.interleave(t, s)).toEqual([t1, s]);
    });

    test("empty subseq 2", () => {
      // =====+======+
      const s = [0, 5, 1, 6, 1];
      // ===========
      const t = [0, 11];
      // =============
      const t1 = [0, 13];
      expect(shredder.interleave(s, t)).toEqual([s, t1]);
      expect(shredder.interleave(t, s)).toEqual([t1, s]);
    });

    test("smaller transform", () => {
      // +++====+
      const s = [1, 3, 4, 1];
      // ***====
      const t = [1, 3, 4];
      // 12345678901
      // +++***====+
      const s1 = [1, 3, 7, 1];
      const t1 = [0, 3, 3, 5];
      expect(shredder.interleave(s, t)).toEqual([s1, t1]);
      // ***+++====+
      const s2 = [0, 3, 3, 4, 1];
      const t2 = [1, 3, 8];
      expect(shredder.interleave(t, s)).toEqual([t2, s2]);
    });

    test("same position", () => {
      // ==++  ====
      const s = [0, 2, 2, 4];
      // ==**  ====
      const t = [0, 2, 2, 4];
      // ==++**====
      const s1 = [0, 2, 2, 6];
      const t1 = [0, 4, 2, 4];
      expect(shredder.interleave(s, t)).toEqual([s1, t1]);
      // ==**++====
      const s2 = [0, 4, 2, 4];
      const t2 = [0, 2, 2, 6];
      expect(shredder.interleave(t, s)).toEqual([t2, s2]);
    });

    test("same position different lengths", () => {
      // ==++++  ==
      const s = [0, 2, 4, 2];
      // ==**    ==
      const t = [0, 2, 2, 2];
      // ==++++**==
      const s1 = [0, 2, 4, 4];
      const t1 = [0, 6, 2, 2];
      expect(shredder.interleave(s, t)).toEqual([s1, t1]);
      // ==**++++==
      const s2 = [0, 4, 4, 2];
      const t2 = [0, 2, 2, 6];
      expect(shredder.interleave(t, s)).toEqual([t2, s2]);
    });

    test("subseq before", () => {
      // +=    ====
      const s = [1, 1, 5];
      //  =****====
      const t = [0, 1, 4, 4];
      // +=****====
      const s1 = [1, 1, 9];
      const t1 = [0, 2, 4, 4];
      expect(shredder.interleave(s, t)).toEqual([s1, t1]);
      // +=****====
      expect(shredder.interleave(t, s)).toEqual([t1, s1]);
    });

    test("subseq before overlapping", () => {
      // ++=    ===
      const s = [1, 2, 4];
      //   =****===
      const t = [0, 1, 4, 3];
      // ++=****===
      const s1 = [1, 2, 8];
      const t1 = [0, 3, 4, 3];
      expect(shredder.interleave(s, t)).toEqual([s1, t1]);
      expect(shredder.interleave(t, s)).toEqual([t1, s1]);
    });

    test("subseq after", () => {
      //  =++++====
      const s = [0, 1, 4, 4];
      // *=    ====
      const t = [1, 1, 5];
      // *=++++====
      const s1 = [0, 2, 4, 4];
      const t1 = [1, 1, 9];
      expect(shredder.interleave(s, t)).toEqual([s1, t1]);
      expect(shredder.interleave(t, s)).toEqual([t1, s1]);
    });

    test("subseq after overlapping 1", () => {
      // ==    ==++
      const s = [0, 4, 2];
      // ==****==
      const t = [0, 2, 4, 2];
      // ==****==++
      const s1 = [0, 8, 2];
      const t1 = [0, 2, 4, 4];
      expect(shredder.interleave(s, t)).toEqual([s1, t1]);
      expect(shredder.interleave(t, s)).toEqual([t1, s1]);
    });

    test("subseq after overlapping 2", () => {
      // =   =++===
      const s = [0, 2, 2, 3];
      // =***=  ===
      const t = [0, 1, 3, 4];
      // =***=++===
      const s1 = [0, 5, 2, 3];
      const t1 = [0, 1, 3, 6];
      expect(shredder.interleave(s, t)).toEqual([s1, t1]);
      expect(shredder.interleave(t, s)).toEqual([t1, s1]);
    });

    test("subseq after overlapping 3", () => {
      //   =++++===
      const s = [0, 1, 4, 3];
      // **=    ===
      const t = [1, 2, 4];
      // **=++++===
      const s1 = [0, 3, 4, 3];
      const t1 = [1, 2, 8];
      expect(shredder.interleave(s, t)).toEqual([s1, t1]);
      expect(shredder.interleave(t, s)).toEqual([t1, s1]);
    });

    test("multiple segments", () => {
      // +=++ =+==
      const s = [1, 1, 1, 2, 1, 1, 2];
      //  =*  = ==*
      const t = [0, 1, 1, 3, 1];
      // +=++*=+==*
      const s1 = [1, 1, 1, 2, 2, 1, 3];
      const t1 = [0, 4, 1, 4, 1];
      expect(shredder.interleave(s, t)).toEqual([s1, t1]);
      // +=*++=+==*
      const s2 = [1, 1, 2, 2, 1, 1, 3];
      const t2 = [0, 2, 1, 6, 1];
      expect(shredder.interleave(t, s)).toEqual([t2, s2]);
    });

    test("complex", () => {
      //     =====      ======++++
      const s = [0, 11, 4];
      // ****=====******======*
      const t = [1, 4, 5, 6, 6, 1];
      // ****=====******======++++*
      const s1 = [0, 21, 4, 1];
      const t1 = [1, 4, 5, 6, 10, 1];
      expect(shredder.interleave(s, t)).toEqual([s1, t1]);
      // ****=====******======*++++
      const s2 = [0, 22, 4];
      const t2 = [1, 4, 5, 6, 6, 1, 4];
      expect(shredder.interleave(t, s)).toEqual([t2, s2]);
    });
  });
});

describe("patch", () => {
  const text = "hello world";
  const p0: shredder.Patch = [0, 1, "era", 9, 11];
  const p1: shredder.Patch = ["je", 2, 5, 11];
  const p2: shredder.Patch = [0, 4, " ", 4, 5, "n Earth", 11];
  const p3: shredder.Patch = [0, 6, "buddy", 11];

  test("apply", () => {
    expect(shredder.apply(text, p0)).toEqual("herald");
    expect(shredder.apply(text, p1)).toEqual("jello");
    expect(shredder.apply(text, p2)).toEqual("hell on Earth");
    expect(shredder.apply(text, p3)).toEqual("hello buddy");
  });

  describe("factor", () => {
    test("factor 1", () => {
      const { insertSeq, deleteSeq } = shredder.factor(p0);
      expect(insertSeq).toEqual([0, 1, 3, 10]);
      expect(deleteSeq).toEqual([0, 1, 8, 2]);
    });

    test("factor 2", () => {
      const { insertSeq, deleteSeq } = shredder.factor(p1);
      expect(insertSeq).toEqual([1, 2, 11]);
      expect(deleteSeq).toEqual([1, 2, 3, 6]);
    });

    test("factor 3", () => {
      const { insertSeq, deleteSeq } = shredder.factor(p2);
      expect(insertSeq).toEqual([0, 4, 1, 1, 7, 6]);
      expect(deleteSeq).toEqual([0, 5, 6]);
    });

    test("factor 4", () => {
      const { insertSeq, deleteSeq } = shredder.factor(p3);
      expect(insertSeq).toEqual([0, 6, 5, 5]);
      expect(deleteSeq).toEqual([0, 6, 5]);
    });
  });

  describe("synthesize", () => {
    test("empty", () => {
      expect(shredder.synthesize("", [])).toEqual([0]);
    });

    test("simple", () => {
      const insertSeq = [0, 3, 3, 7];
      const deleteSeq = [0, 3, 3, 3, 1];
      const result = [0, 3, "foo", 6, 9, 10];
      expect(shredder.synthesize("foo", insertSeq, deleteSeq)).toEqual(result);
    });

    // TODO: make this a property test
    test("factored", () => {
      for (const p of [p0, p1, p2, p3]) {
        const { inserted, insertSeq, deleteSeq } = shredder.factor(p);
        expect(shredder.synthesize(inserted, insertSeq, deleteSeq)).toEqual(p);
      }
    });

    test("applied", () => {
      const { inserted, insertSeq, deleteSeq } = shredder.factor(p0);
      const combined = shredder.apply(
        text,
        shredder.synthesize(inserted, insertSeq),
      );
      const inserted1 = shredder.apply(
        combined,
        shredder.synthesize(
          "",
          shredder.clear(insertSeq),
          shredder.complement(insertSeq),
        ),
      );
      expect(inserted).toEqual(inserted1);
      const deleteSeq1 = shredder.expand(deleteSeq, insertSeq);
      const deleted = shredder.apply(
        combined,
        shredder.synthesize(
          "",
          shredder.clear(deleteSeq1),
          shredder.complement(deleteSeq1),
        ),
      );
      const result = [0, 1, "ello wor", 4, 6];
      expect(
        shredder.synthesize(
          deleted,
          deleteSeq1,
          shredder.shrink(insertSeq, deleteSeq1),
        ),
      ).toEqual(result);
    });
  });
});

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
    test("full", () => {
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

  // TODO: fix this
  describe("Document.undo", () => {
    test("selective", () => {
      const client = new Client("id1", new InMemoryStorage());
      const doc = Document.create("doc1", client, "hello world");
      doc.edit(["goodbye", 5, 11]);
      doc.edit([0, 13, "s", 13]);
      doc.undo(1);
      expect(doc.snapshot.visible).toEqual("hello worlds");
    });
  });

  describe("Document.ingest", () => {
    test("simple", () => {
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

  describe.skip("multiple clients", () => {
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
      await client1.sync();
      const doc2 = await client2.getDocument("doc1");
      doc2.edit([0, 5, "_", 6, 11, "!", 11]);
      doc2.edit([0, 11, 12]);
      await client2.sync();
      expect(doc1.snapshot).toEqual(doc2.snapshot);
    });
  });
});

describe.skip("Client", () => {
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
