// import * as testcheck from "mocha-testcheck";
// import { check, gen } from "mocha-testcheck";
// testcheck.install();

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

    test("empty transform", () => {
      const s = [0, 1, 2, 7];
      const t = [0, 8];
      expect(shredder.interleave(s, t)).toEqual([s, s]);
    });

    test("smaller transform", () => {
      // +++====+
      const s = [1, 3, 4, 1];
      // ***====
      const t = [1, 3, 4];
      // +++***====+
      const result = [1, 3, 7, 1];
      // ***+++====+
      const result1 = [0, 3, 3, 4, 1];
      expect(shredder.interleave(s, t)).toEqual([result, result1]);
    });

    test("same position", () => {
      // ==++  ====
      const s = [0, 2, 2, 4];
      // ==**  ====
      const t = [0, 2, 2, 4];
      // ==++**====
      const result = [0, 2, 2, 6];
      // ==**++====
      const result1 = [0, 4, 2, 4];
      expect(shredder.interleave(s, t)).toEqual([result, result1]);
    });

    test("same position different lengths", () => {
      // ==++++  ==
      const s = [0, 2, 4, 2];
      // ==**    ==
      const t = [0, 2, 2, 2];
      // ==++++**==
      const result = [0, 2, 4, 4];
      // ==**++++==
      const result1 = [0, 4, 4, 2];
      expect(shredder.interleave(s, t)).toEqual([result, result1]);
    });

    test("subseq before", () => {
      // +=    ====
      const s = [1, 1, 5];
      //  =****====
      const t = [0, 1, 4, 4];
      // +=****====
      const result = [1, 1, 9];
      expect(shredder.interleave(s, t)).toEqual([result, result]);
    });

    test("subseq before overlapping", () => {
      // ++=    ===
      const s = [1, 2, 4];
      //   =****===
      const t = [0, 1, 4, 3];
      // ++=****===
      const result = [1, 2, 8];
      expect(shredder.interleave(s, t)).toEqual([result, result]);
    });

    test("subseq after", () => {
      //  =++++====
      const s = [0, 1, 4, 4];
      // *=    ====
      const t = [1, 1, 5];
      // *=++++====
      const result = [0, 2, 4, 4];
      expect(shredder.interleave(s, t)).toEqual([result, result]);
    });

    test("subseq after overlapping 1", () => {
      // ==    ==++
      const s = [0, 4, 2];
      // ==****==
      const t = [0, 2, 4, 2];
      // ==****==++
      const result = [0, 8, 2];
      expect(shredder.interleave(s, t)).toEqual([result, result]);
    });

    test("subseq after overlapping 2", () => {
      // =   =++===
      const s = [0, 2, 2, 3];
      // =***=  ===
      const t = [0, 1, 3, 4];
      // =***=++===
      const result = [0, 5, 2, 3];
      expect(shredder.interleave(s, t)).toEqual([result, result]);
    });

    test("subseq after overlapping 3", () => {
      //   =++++===
      const s = [0, 1, 4, 3];
      // **=    ===
      const t = [1, 2, 4];
      // **=++++===
      const result = [0, 3, 4, 3];
      expect(shredder.interleave(s, t)).toEqual([result, result]);
    });

    test("multiple segments", () => {
      // +=++ =+==
      const s = [1, 1, 1, 2, 1, 1, 2];
      //  =*  = ==*
      const t = [0, 1, 1, 3, 1];
      // +=++*=+==*
      const result = [1, 1, 1, 2, 2, 1, 3];
      // +=*++=+==*
      const result1 = [1, 1, 2, 2, 1, 1, 3];
      expect(shredder.interleave(s, t)).toEqual([result, result1]);
    });

    test("complex", () => {
      //     =====      ======++++
      const s = [0, 11, 4];
      // ****=====******======*
      const t = [1, 4, 5, 6, 6, 1];
      // ****=====******======++++*
      const result = [0, 21, 4, 1];
      // ****=====******======*++++
      const result1 = [0, 22, 4];
      expect(shredder.interleave(s, t)).toEqual([result, result1]);
    });
  });
});

describe("overlapping", () => {
  test("overlapping 1", () => {
    const result = [1, 6];
    expect(shredder.overlapping("hello ", "hello ")).toEqual(result);
  });

  test("overlapping 2", () => {
    const result = [0, 6, 5];
    expect(shredder.overlapping("hello world", "world")).toEqual(result);
  });

  test("overlapping 3", () => {
    const result = [0, 10, 1];
    expect(shredder.overlapping("hello world", "d")).toEqual(result);
  });

  test("overlapping 4", () => {
    const result = [0, 5, 1, 5];
    expect(shredder.overlapping("hello world", " ")).toEqual(result);
  });

  test("overlapping 5", () => {
    const result = [1, 2, 1, 4];
    expect(shredder.overlapping(" Wworld", " World")).toEqual(result);
  });

  test("overlapping 6", () => {
    const result = [1, 1, 1, 4];
    expect(shredder.overlapping("Hhello", "Hello")).toEqual(result);
  });

  test("no overlap 1", () => {
    expect(shredder.overlapping("hello world", "xworld")).toEqual(undefined);
  });

  test("no overlap 2", () => {
    expect(shredder.overlapping("Hhello", "Hex")).toEqual(undefined);
  });

  test("no overlap 3", () => {
    expect(shredder.overlapping("Hhello", "HelloXX")).toEqual(undefined);
  });

  test("no overlap 4", () => {
    expect(shredder.overlapping("hello world", "worlds")).toEqual(undefined);
  });

  test("no overlap 5", () => {
    expect(shredder.overlapping("hello", "hexo")).toEqual(undefined);
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
      const [, insertSeq, deleteSeq] = shredder.factor(p0);
      expect(insertSeq).toEqual([0, 1, 3, 10]);
      expect(deleteSeq).toEqual([0, 1, 8, 2]);
    });

    test("factor 2", () => {
      const [, insertSeq, deleteSeq] = shredder.factor(p1);
      expect(insertSeq).toEqual([1, 2, 11]);
      expect(deleteSeq).toEqual([1, 2, 3, 6]);
    });

    test("factor 3", () => {
      const [, insertSeq, deleteSeq] = shredder.factor(p2);
      expect(insertSeq).toEqual([0, 4, 1, 1, 7, 6]);
      expect(deleteSeq).toEqual([0, 5, 6]);
    });

    test("factor 4", () => {
      const [, insertSeq3, deleteSeq3] = shredder.factor(p3);
      expect(insertSeq3).toEqual([0, 6, 5, 5]);
      expect(deleteSeq3).toEqual([0, 6, 5]);
    });
  });

  describe("synthesize", () => {
    test("empty", () => {
      expect(shredder.synthesize("", [])).toEqual([0]);
    });

    test("simple", () => {
      const insertSeq = [0, 3, 3, 7];
      const deleteSeq = [0, 6, 3, 3, 1];
      const result = [0, 3, "foo", 6, 9, 10];
      expect(shredder.synthesize("foo", insertSeq, deleteSeq)).toEqual(result);
    });

    test("complex", () => {
      const [inserted, insertSeq, deleteSeq] = shredder.factor(p0);
      const deleteSeq1 = shredder.expand(deleteSeq, insertSeq);
      const union = shredder.apply(
        text,
        shredder.synthesize(inserted, insertSeq),
      );
      const text1 = shredder.apply(
        union,
        shredder.synthesize(
          "",
          [0, shredder.count(deleteSeq1)],
          shredder.complement(deleteSeq1),
        ),
      );
      const tombstones = shredder.apply(
        union,
        shredder.synthesize(
          "",
          [0, shredder.count(insertSeq)],
          shredder.complement(insertSeq),
        ),
      );
      expect(shredder.synthesize(tombstones, insertSeq, deleteSeq1)).toEqual(
        p0,
      );
      const result = [0, 1, "ello wor", 4, 6];
      expect(shredder.synthesize(text1, deleteSeq1, insertSeq)).toEqual(result);
    });
  });
});

import { Client } from "../index";
describe("Document", () => {
  describe("Document.hiddenSeqAt", () => {
    test("concurrent revisions", () => {
      const client = new Client("id1");
      const doc = client.createDocument("doc1", "hello world");
      doc.edit(["H", 1, 6, "W", 7, 11]);
      doc.edit([0, 5, ", Brian", 11]);
      doc.edit([0, 5, ", Dr. Evil", 11], 1, 1);
      expect(doc.hiddenSeqAt(0)).toEqual([0, 11]);
      expect(doc.hiddenSeqAt(1)).toEqual([0, 1, 1, 6, 1, 4]);
      expect(doc.hiddenSeqAt(2)).toEqual([0, 1, 1, 11, 7]);
      expect(doc.hiddenSeqAt(3)).toEqual([0, 1, 1, 21, 7]);
      expect(doc.hiddenSeqAt(3)).toEqual(doc.snapshot.hiddenSeq);
    });

    test("revisions with revives", () => {
      const client = new Client("id1");
      const doc = client.createDocument("doc1", "hello world");
      doc.edit(["H", 1, 6, "W", 7, 11]);
      doc.edit(["h", 1, 6, "w", 7, 11]);
      expect(doc.hiddenSeqAt(0)).toEqual([0, 11]);
      expect(doc.hiddenSeqAt(1)).toEqual([0, 1, 1, 6, 1, 4]);
      expect(doc.hiddenSeqAt(2)).toEqual([1, 1, 6, 1, 5]);
      expect(doc.hiddenSeqAt(2)).toEqual(doc.snapshot.hiddenSeq);
    });
  });

  describe("Document.snapshotAt", () => {
    test("concurrent revisions", () => {
      const client = new Client("id1");
      const doc = client.createDocument("doc1", "hello world");
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

  describe("Document.edit", () => {
    test("simple", () => {
      const client = new Client("id1");
      const doc = client.createDocument("doc1", "hello world");
      doc.edit([0, 1, "era", 9, 11]);
      expect(doc.snapshot).toEqual({
        visible: "herald",
        hidden: "ello wor",
        hiddenSeq: [0, 4, 8, 2],
        version: 1,
      });
    });

    test("sequential 1", () => {
      const client = new Client("id1");
      const doc = client.createDocument("doc1", "hello world");
      doc.edit([0, 1, "era", 9, 11]);
      doc.edit([0, 6, "ry", 6]);
      expect(doc.snapshot.visible).toEqual("heraldry");
    });

    test("sequential 2", () => {
      const client = new Client("id1");
      const doc = client.createDocument("doc1", "hello world");
      doc.edit(["H", 1, 6, "W", 7, 11]);
      doc.edit([0, 5, ", Brian", 11]);
      expect(doc.snapshot.visible).toEqual("Hello, Brian");
    });

    test("sequential 3", () => {
      const client = new Client("id1");
      const doc = client.createDocument("doc1", "hello world");
      doc.edit([6, 11]);
      doc.edit(["hello ", 0, 5]);
      doc.edit(["goodbye ", 6, 11], 1, 0);
      expect(doc.snapshot.visible).toEqual("goodbye hello world");
    });

    test("concurrent 1", () => {
      const client = new Client("id1");
      const doc = client.createDocument("doc1", "hello world");
      doc.edit([0, 1, "era", 9, 11]);
      doc.edit(["Great H", 2, 5, 11], 1, 0);
      expect(doc.snapshot.visible).toEqual("Great Hera");
    });

    test("concurrent 2", () => {
      const client = new Client("id1");
      const doc = client.createDocument("doc1", "hello world");
      doc.edit(["H", 1, 6, "W", 7, 11]);
      doc.edit([0, 5, ", Brian", 11]);
      doc.edit([0, 5, ", Dr. Evil", 11], 1, 1);
      expect(doc.snapshot.visible).toEqual("Hello, Brian, Dr. Evil");
    });

    test("concurrent 3", () => {
      const client = new Client("id1");
      const doc = client.createDocument("doc1", "hello world");
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
      const client = new Client("id1");
      const doc = client.createDocument("doc1", "hello world");
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
      const client = new Client("id1");
      const doc = client.createDocument("doc1", "hello world");
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
      const client = new Client("id1");
      const doc = client.createDocument("doc1", "hello world");
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

    test("revive 1", () => {
      const client = new Client("id1");
      const doc = client.createDocument("doc1", "hello world");
      doc.edit([6, 11]);
      doc.edit(["hello ", 0, 5, "s", 5]);
      expect(doc.snapshot).toEqual({
        visible: "hello worlds",
        hidden: "",
        hiddenSeq: [0, 12],
        version: 2,
      });
    });

    test("revive 2", () => {
      const client = new Client("id1");
      const doc = client.createDocument("doc1", "hello world");
      doc.edit([11]);
      doc.edit(["hello ", 0]);
      doc.edit([0, 6, "worlds", 6]);
      expect(doc.snapshot.visible).toEqual("hello worlds");
      expect(doc.snapshot.hidden).toEqual("world");
    });

    test("revive 3", () => {
      const client = new Client("id1");
      const doc = client.createDocument("doc1", "hello world");
      doc.edit([11]);
      doc.edit(["world", 0]);
      doc.edit(["hello ", 0, 5, "s", 5]);
      expect(doc.snapshot.visible).toEqual("hello worlds");
      expect(doc.snapshot.hidden).toEqual("");
    });

    test("revive 4", () => {
      const client = new Client("id1");
      const doc = client.createDocument("doc1", "hello world");
      doc.edit(["H", 1, 6, "W", 7, 11]);
      doc.edit([0, 6, "waterw", 7, 11]);
      expect(doc.snapshot.visible).toEqual("Hello waterworld");
      // TODO: hidden?
    });

    test("revive 5", () => {
      const client = new Client("id1");
      const doc = client.createDocument("doc1", "hello world");
      doc.edit([0, 6, 11]);
      doc.edit([0, 3, "ium", 5, 6, "world", 6]);
      expect(doc.snapshot.visible).toEqual("helium world");
      // TODO: snahidden?
    });

    test("revive 6", () => {
      const client = new Client("id1");
      const doc = client.createDocument("doc1", "hello world");
      doc.edit([11]);
      doc.edit(["world", 0]);
      expect(doc.snapshot.visible).toEqual("world");
      doc.edit([0, 5, "hello", 5]);
      expect(doc.snapshot.visible).toEqual("worldhello");
      expect(doc.snapshot.hidden).toEqual("hello ");
    });

    test("revive 7", () => {
      const client = new Client("id1");
      const doc = client.createDocument("doc1", "hello world");
      doc.edit(["H", 1, 6, "W", 7, 11]);
      doc.edit([6, 11]);
      doc.edit(["Hello ", 0, 5]);
      expect(doc.snapshot.visible).toEqual("Hello World");
      expect(doc.snapshot.hidden).toEqual("hw");
    });

    test("revive 8", () => {
      const client = new Client("id1");
      const doc = client.createDocument("doc1", "hello world");
      doc.edit(["H", 1, 6, "W", 7, 11]);
      doc.edit([0, 5, 11]);
      doc.edit([0, 5, " World", 5]);
      expect(doc.snapshot.visible).toEqual("Hello World");
      expect(doc.snapshot.hidden).toEqual("hw");
    });

    test("revive 10", () => {
      const client = new Client("id1");
      const doc = client.createDocument("doc1", "hello world");
      doc.edit(["H", 1, 6, "W", 7, 11]);
      doc.edit(["h", 1, 6, "w", 7, 11]);
      expect(doc.snapshot.visible).toEqual("hello world");
      expect(doc.snapshot.hidden).toEqual("HW");
      expect(doc.snapshot.hiddenSeq).toEqual([1, 1, 6, 1, 5]);
    });

    test("no revive 1", () => {
      const client = new Client("id1");
      const doc = client.createDocument("doc1", "hello world");
      doc.edit([6, 11]);
      doc.edit(["xxxxxx", 0, 5]);
      expect(doc.snapshot.visible).toEqual("xxxxxxworld");
      expect(doc.snapshot.hidden).toEqual("hello ");
    });

    test("no revive 2", () => {
      const client = new Client("id1");
      const doc = client.createDocument("doc1", "hello world");
      doc.edit(["H", 1, 6, "W", 7, 11]);
      doc.edit([0, 5, 11]);
      doc.edit([0, 5, " Wacky World", 5]);
      expect(doc.snapshot.visible).toEqual("Hello Wacky World");
      expect(doc.snapshot.hidden).toEqual("h Wworld");
    });

    test("revive concurrent 1", () => {
      const client = new Client("id1");
      const doc = client.createDocument("doc1", "hello world");
      doc.edit(["H", 1, 6, "W", 7, 11]);
      doc.edit(["h", 1, 6, "w", 7, 11]);
      doc.edit([0, 6, "Brian", 11], 1, 1);
      expect(doc.snapshot.visible).toEqual("hello Brianw");
      expect(doc.snapshot.hidden).toEqual("HWorld");
    });

    test("revive concurrent 2", () => {
      const client = new Client("id1");
      const doc = client.createDocument("doc1", "hello world");
      doc.edit([6, 11]);
      doc.edit(["hello ", 0, 5]);
      doc.edit(["goodbye ", 0, 5], 1, 1);
      expect(doc.snapshot.visible).toEqual("hello goodbye world");
      expect(doc.snapshot.hidden).toEqual("");
    });

    test("revive concurrent 3", () => {
      const client = new Client("id1");
      const doc = client.createDocument("doc1", "hello world");
      doc.edit([6, 11]);
      doc.edit(["hello ", 0, 5], 1);
      doc.edit(["goodbye ", 0, 5], undefined, 1);
      expect(doc.snapshot.visible).toEqual("hello goodbye world");
      expect(doc.snapshot.hidden).toEqual("");
    });
  });

  describe("Document.undo", () => {
    test("simple", () => {
      const client = new Client("id1");
      const doc = client.createDocument("doc1", "hello world");
      doc.edit(["goodbye", 5, 11]);
      doc.edit([0, 13, "s", 13]);
      doc.undo(1);
      expect(doc.snapshot.visible).toEqual("hello worlds");
    });
  });

  describe("Document.ingest", () => {
    test("simple", () => {
      const client1 = new Client("id1");
      const client2 = new Client("id2");
      const doc1 = client1.createDocument("doc1", "hello world");
      doc1.ingest(doc1.createMessage()!);
      const doc2 = doc1.clone(client2);
      doc1.edit(["goodbye", 5, 11]);
      doc1.edit([0, 13, "s", 13]);
      doc2.edit([0, 5, "_", 6, 11]);
      doc1.ingest({
        ...doc2.createMessage()!,
        version: 1,
      });
      expect(doc1.snapshot).toEqual({
        visible: "goodbye_worlds",
        hidden: "hello ",
        hiddenSeq: [0, 7, 5, 1, 1, 6],
        version: 3,
      });
      expect(doc1.hiddenSeqAt(0)).toEqual([0, 11]);
    });

    test("revive", () => {
      const client1 = new Client("id1");
      const client2 = new Client("id2");
      const doc1 = client1.createDocument("doc1", "hello world");
      doc1.ingest(doc1.createMessage()!);
      const doc2 = doc1.clone(client2);
      doc1.edit(["goodbye", 5, 11]);
      const message1 = {
        ...doc1.createMessage()!,
        version: 1,
      };
      doc1.ingest(message1);
      doc2.ingest(message1);
      doc2.edit([0, 7, "hello", 7, 13]);
      doc1.edit([0, 13, "s", 13]);
      const message2 = {
        ...doc2.createMessage()!,
        version: 2,
      };
      doc1.ingest(message2);
      expect(doc1.snapshot).toEqual({
        visible: "goodbyehello worlds",
        hidden: "",
        hiddenSeq: [0, 19],
        version: 3,
      });
      expect(doc1.hiddenSeqAt(0)).toEqual([0, 11]);
    });

    test("idempotent", () => {
      const client1 = new Client("id1");
      const client2 = new Client("id2");
      const doc1 = client1.createDocument("doc1", "hello world");
      doc1.ingest(doc1.createMessage()!);
      const doc2 = doc1.clone(client2);
      doc1.edit(["goodbye", 5, 11]);
      const message1 = {
        ...doc1.createMessage()!,
        version: 1,
      };
      doc2.ingest(message1);
      doc2.ingest(message1);
      doc2.ingest(message1);
      expect(doc2.snapshot).toEqual({
        visible: "goodbye world",
        hidden: "hello",
        hiddenSeq: [0, 7, 5, 6],
        version: 1,
      });
      expect(doc2.snapshot).toEqual(doc1.snapshot);
    });
  });
});

import { InMemoryStorage } from "../index";
describe("InMemoryStorage", () => {
  describe("sendMessage", () => {
    test("send message", async () => {
      const client = new Client("id1");
      const doc = client.createDocument("doc1", "hello world");
      const storage = new InMemoryStorage();
      const message1 = await storage.sendMessage(doc.id, doc.createMessage()!);
      doc.ingest(message1);
      doc.edit([0, 11, "!", 11]);
      const message2 = await storage.sendMessage(doc.id, doc.createMessage()!);
      const messages = await storage.fetchMessages(doc.id);
      expect(messages).toEqual([message1, message2]);
    });

    test("send snapshot", async () => {
      const client = new Client("id1");
      const doc = client.createDocument("doc1", "hello world");
      const storage = new InMemoryStorage();
      const message1 = await storage.sendMessage(doc.id, doc.createMessage()!);
      doc.ingest(message1);
      doc.edit([0, 11, "!", 11]);
      const message2 = await storage.sendMessage(doc.id, doc.createMessage()!);
      doc.ingest(message2);
      storage.sendSnapshot(doc.id, doc.snapshotAt(1));
      storage.sendSnapshot(doc.id, doc.snapshotAt(0));
      const snapshot0 = await storage.fetchSnapshot(doc.id, 0);
      const snapshot1 = await storage.fetchSnapshot(doc.id);
      expect(snapshot0).toEqual(doc.snapshotAt(0));
      expect(snapshot1).toEqual(doc.snapshotAt(1));
      const messages = await storage.fetchMessages(doc.id);
      expect(messages).toEqual([]);
    });
  });
});
