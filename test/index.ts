/* eslint-env mocha */
import { expect } from "chai";
// import * as testcheck from "mocha-testcheck";
// import { check, gen } from "mocha-testcheck";
// testcheck.install();

import * as shredder from "../src/index";
import { Client, Document } from "../src/index";

describe("subseq", () => {
  describe("count", () => {
    const s = [0, 10, 5, 8, 4, 4];
    it("all", () => {
      expect(shredder.count(s)).to.equal(31);
    });
    it("false", () => {
      expect(shredder.count(s, false)).to.equal(22);
    });
    it("true", () => {
      expect(shredder.count(s, true)).to.equal(9);
    });
  });

  describe("union", () => {
    it("empty", () => {
      const s = [1, 4, 4];
      const t = [0, 8];
      expect(shredder.union(s, t)).to.deep.equal(s);
    });

    it("complex", () => {
      const s = [1, 2, 2, 2];
      const t = [0, 1, 2, 2, 1];
      const result = [1, 3, 1, 2];
      expect(shredder.union(s, t)).to.deep.equal(result);
    });
  });

  describe("difference", () => {
    it("empty", () => {
      const s = [1, 8];
      const t = [1, 4, 4];
      const result = [0, 4, 4];
      expect(shredder.difference(s, t)).to.deep.equal(result);
    });

    it("complex", () => {
      const s = [1, 2, 2, 2];
      const t = [0, 1, 1, 1, 1, 1, 1];
      const result = [1, 1, 3, 1, 1];
      expect(shredder.difference(s, t)).to.deep.equal(result);
    });
  });

  describe("expand/shrink", () => {
    it("complex", () => {
      const s = [0, 4, 4, 6, 5, 3];
      const t = [0, 10, 5, 8, 4, 4];
      const expanded = shredder.expand(s, t);
      const result = [0, 4, 4, 11, 4, 4, 1, 3];
      expect(expanded).to.deep.equal(result);
      expect(shredder.shrink(expanded, t)).to.deep.equal(s);
    });
  });

  describe("interleave", () => {
    it("error when mismatched", () => {
      expect(() => {
        shredder.interleave([0, 5, 1], [1, 1, 4]);
      }).to.throw();
    });

    it("empty transform", () => {
      const s = [0, 1, 2, 7];
      const t = [0, 8];
      expect(shredder.interleave(s, t)).to.deep.equal(s);
    });

    it("smaller transform", () => {
      // +++====+
      const s = [1, 3, 4, 1];
      // ***====
      const t = [1, 3, 4];
      // ***+++====+
      const result = [0, 3, 3, 4, 1];
      expect(shredder.interleave(s, t)).to.deep.equal(result);
      // +++***====+
      const result1 = [1, 3, 7, 1];
      expect(shredder.interleave(s, t, true)).to.deep.equal(result1);
    });

    it("same position", () => {
      // ==++  ====
      const s = [0, 2, 2, 4];
      // ==**  ====
      const t = [0, 2, 2, 4];
      // ==**++====
      const result = [0, 4, 2, 4];
      expect(shredder.interleave(s, t)).to.deep.equal(result);
      // ==++**====
      const result1 = [0, 2, 2, 6];
      expect(shredder.interleave(s, t, true)).to.deep.equal(result1);
    });

    it("same position different lengths", () => {
      // ==++++  ==
      const s = [0, 2, 4, 2];
      // ==**    ==
      const t = [0, 2, 2, 2];
      // ==**++++==
      const result = [0, 4, 4, 2];
      expect(shredder.interleave(s, t)).to.deep.equal(result);
      // ==++++**==
      const result1 = [0, 2, 4, 4];
      expect(shredder.interleave(s, t, true)).to.deep.equal(result1);
    });

    it("subseq before", () => {
      // +=    ====
      const s = [1, 1, 5];
      //  =****====
      const t = [0, 1, 4, 4];
      // +=****====
      const result = [1, 1, 9];
      expect(shredder.interleave(s, t)).to.deep.equal(result);
      expect(shredder.interleave(s, t, true)).to.deep.equal(result);
    });

    it("subseq before overlapping", () => {
      // ++=    ===
      const s = [1, 2, 4];
      //   =****===
      const t = [0, 1, 4, 3];
      // ++=****===
      const result = [1, 2, 8];
      expect(shredder.interleave(s, t)).to.deep.equal(result);
      expect(shredder.interleave(s, t, true)).to.deep.equal(result);
    });

    it("subseq after", () => {
      //  =++++====
      const s = [0, 1, 4, 4];
      // *=    ====
      const t = [1, 1, 5];
      // *=++++====
      const result = [0, 2, 4, 4];
      expect(shredder.interleave(s, t)).to.deep.equal(result);
      expect(shredder.interleave(s, t, true)).to.deep.equal(result);
    });

    it("subseq after overlapping 1", () => {
      // ==    ==++
      const s = [0, 4, 2];
      // ==****==
      const t = [0, 2, 4, 2];
      // ==****==++
      const result = [0, 8, 2];
      expect(shredder.interleave(s, t)).to.deep.equal(result);
      expect(shredder.interleave(s, t, true)).to.deep.equal(result);
    });

    it("subseq after overlapping 2", () => {
      // =   =++===
      const s = [0, 2, 2, 3];
      // =***=  ===
      const t = [0, 1, 3, 4];
      // =***=++===
      const result = [0, 5, 2, 3];
      expect(shredder.interleave(s, t)).to.deep.equal(result);
      expect(shredder.interleave(s, t, true)).to.deep.equal(result);
    });

    it("subseq after overlapping 3", () => {
      //   =++++===
      const s = [0, 1, 4, 3];
      // **=    ===
      const t = [1, 2, 4];
      // **=++++===
      const result = [0, 3, 4, 3];
      expect(shredder.interleave(s, t)).to.deep.equal(result);
      expect(shredder.interleave(s, t, true)).to.deep.equal(result);
    });

    it("multiple segments", () => {
      // +=++ =+==
      const s = [1, 1, 1, 2, 1, 1, 2];
      //  =*  = ==*
      const t = [0, 1, 1, 3, 1];
      // +=*++=+==*
      // +==++=+===
      const result = [1, 1, 2, 2, 1, 1, 3];
      expect(shredder.interleave(s, t)).to.deep.equal(result);
      // +=++*=+==*
      const result1 = [1, 1, 1, 2, 2, 1, 3];
      expect(shredder.interleave(s, t, true)).to.deep.equal(result1);
    });

    it("complex", () => {
      //     =====      ======++++
      const s = [0, 11, 4];
      // ****=====******======*
      const t = [1, 4, 5, 6, 6, 1];
      // ****=====******======*++++
      const result = [0, 22, 4];
      expect(shredder.interleave(s, t)).to.deep.equal(result);
      // ****=====******======++++*
      const result1 = [0, 21, 4, 1];
      expect(shredder.interleave(s, t, true)).to.deep.equal(result1);
    });
  });
});

describe("overlapping", () => {
  it("overlapping 1", () => {
    const result = [1, 6];
    expect(shredder.overlapping("hello ", "hello ")).to.deep.equal(result);
  });

  it("overlapping 2", () => {
    const result = [0, 6, 5];
    expect(shredder.overlapping("hello world", "world")).to.deep.equal(result);
  });

  it("overlapping 3", () => {
    const result = [0, 10, 1];
    expect(shredder.overlapping("hello world", "d")).to.deep.equal(result);
  });

  it("overlapping 4", () => {
    const result = [0, 5, 1, 5];
    expect(shredder.overlapping("hello world", " ")).to.deep.equal(result);
  });

  it("overlapping 5", () => {
    const result = [1, 2, 1, 4];
    expect(shredder.overlapping(" Wworld", " World")).to.deep.equal(result);
  });

  it("overlapping 6", () => {
    const result = [1, 1, 1, 4];
    expect(shredder.overlapping("Hhello", "Hello")).to.deep.equal(result);
  });

  it("no overlap 1", () => {
    expect(shredder.overlapping("hello world", "xworld")).to.equal(undefined);
  });

  it("no overlap 2", () => {
    expect(shredder.overlapping("Hhello", "Hex")).to.equal(undefined);
  });

  it("no overlap 3", () => {
    expect(shredder.overlapping("Hhello", "HelloXX")).to.equal(undefined);
  });

  it("no overlap 4", () => {
    expect(shredder.overlapping("hello world", "worlds")).to.equal(undefined);
  });

  it("no overlap 5", () => {
    expect(shredder.overlapping("hello", "hexo")).to.equal(undefined);
  });
});

describe("patch", () => {
  const text = "hello world";
  const p0: shredder.Patch = [0, 1, "era", 9, 11];
  const p1: shredder.Patch = ["je", 2, 5, 11];
  const p2: shredder.Patch = [0, 4, " ", 4, 5, "n Earth", 11];
  const p3: shredder.Patch = [0, 6, "buddy", 11];

  it("apply", () => {
    expect(shredder.apply(text, p0)).to.equal("herald");
    expect(shredder.apply(text, p1)).to.equal("jello");
    expect(shredder.apply(text, p2)).to.equal("hell on Earth");
    expect(shredder.apply(text, p3)).to.equal("hello buddy");
  });

  describe("factor", () => {
    it("factor 1", () => {
      const [, insertSeq, deleteSeq] = shredder.factor(p0);
      expect(insertSeq).to.deep.equal([0, 1, 3, 10]);
      expect(deleteSeq).to.deep.equal([0, 1, 8, 2]);
    });

    it("factor 2", () => {
      const [, insertSeq, deleteSeq] = shredder.factor(p1);
      expect(insertSeq).to.deep.equal([1, 2, 11]);
      expect(deleteSeq).to.deep.equal([1, 2, 3, 6]);
    });

    it("factor 3", () => {
      const [, insertSeq, deleteSeq] = shredder.factor(p2);
      expect(insertSeq).to.deep.equal([0, 4, 1, 1, 7, 6]);
      expect(deleteSeq).to.deep.equal([0, 5, 6]);
    });

    it("factor 4", () => {
      const [, insertSeq3, deleteSeq3] = shredder.factor(p3);
      expect(insertSeq3).to.deep.equal([0, 6, 5, 5]);
      expect(deleteSeq3).to.deep.equal([0, 6, 5]);
    });
  });

  describe("synthesize", () => {
    it("empty", () => {
      expect(shredder.synthesize("", [])).to.deep.equal([0]);
    });

    it("simple", () => {
      const insertSeq = [0, 3, 3, 7];
      const deleteSeq = [0, 6, 3, 3, 1];
      const result = [0, 3, "foo", 6, 9, 10];
      expect(shredder.synthesize("foo", insertSeq, deleteSeq)).to.deep.equal(
        result,
      );
    });

    it("complex", () => {
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
      expect(
        shredder.synthesize(tombstones, insertSeq, deleteSeq1),
      ).to.deep.equal(p0);
      const result = [0, 1, "ello wor", 4, 6];
      expect(shredder.synthesize(text1, deleteSeq1, insertSeq)).to.deep.equal(
        result,
      );
    });
  });
});

describe("Document", () => {
  const client = new Client("id1");

  describe("Document.hiddenSeqAt", () => {
    it("concurrent revisions", () => {
      const doc = Document.initialize(client, "hello world");
      doc.edit(["H", 1, 6, "W", 7, 11]);
      doc.edit([0, 5, ", Brian", 11]);
      doc.edit([0, 5, ", Dr. Evil", 11], 1, 1);
      expect(doc.hiddenSeqAt(0)).to.deep.equal([0, 11]);
      expect(doc.hiddenSeqAt(1)).to.deep.equal([0, 1, 1, 6, 1, 4]);
      expect(doc.hiddenSeqAt(2)).to.deep.equal([0, 1, 1, 11, 7]);
      expect(doc.hiddenSeqAt(3)).to.deep.equal([0, 1, 1, 21, 7]);
      expect(doc.hiddenSeqAt(3)).to.deep.equal(doc.snapshot.hiddenSeq);
    });

    it("revisions with revives", () => {
      const doc = Document.initialize(client, "hello world");
      doc.edit(["H", 1, 6, "W", 7, 11]);
      doc.edit(["h", 1, 6, "w", 7, 11]);
      expect(doc.hiddenSeqAt(0)).to.deep.equal([0, 11]);
      expect(doc.hiddenSeqAt(1)).to.deep.equal([0, 1, 1, 6, 1, 4]);
      expect(doc.hiddenSeqAt(2)).to.deep.equal([1, 1, 6, 1, 5]);
      expect(doc.hiddenSeqAt(2)).to.deep.equal(doc.snapshot.hiddenSeq);
    });
  });

  describe("Document.edit", () => {
    it("simple", () => {
      const doc = Document.initialize(client, "hello world");
      doc.edit([0, 1, "era", 9, 11]);
      expect(doc.revisions().length).to.equal(2);
      expect(doc.snapshot).to.deep.equal({
        visible: "herald",
        hidden: "ello wor",
        hiddenSeq: [0, 4, 8, 2],
      });
    });

    it("sequential 1", () => {
      const doc = Document.initialize(client, "hello world");
      doc.edit([0, 1, "era", 9, 11]);
      doc.edit([0, 6, "ry", 6]);
      expect(doc.snapshot.visible).to.equal("heraldry");
    });

    it("sequential 2", () => {
      const doc = Document.initialize(client, "hello world");
      doc.edit(["H", 1, 6, "W", 7, 11]);
      doc.edit([0, 5, ", Brian", 11]);
      expect(doc.snapshot.visible).to.equal("Hello, Brian");
    });

    it("sequential 3", () => {
      const doc = Document.initialize(client, "hello world");
      doc.edit([6, 11]);
      doc.edit(["hello ", 0, 5]);
      doc.edit(["goodbye ", 6, 11], 1, 0);
      expect(doc.snapshot.visible).to.equal("goodbye hello world");
    });

    it("concurrent 1", () => {
      const doc = Document.initialize(client, "hello world");
      doc.edit([0, 1, "era", 9, 11]);
      doc.edit(["Great H", 2, 5, 11], 1, 0);
      expect(doc.snapshot.visible).to.equal("Great Hera");
    });

    it("concurrent 2", () => {
      const doc = Document.initialize(client, "hello world");
      doc.edit(["H", 1, 6, "W", 7, 11]);
      doc.edit([0, 5, ", Brian", 11]);
      doc.edit([0, 5, ", Dr. Evil", 11], 1, 1);
      expect(doc.snapshot.visible).to.equal("Hello, Brian, Dr. Evil");
    });

    it("concurrent 3", () => {
      const doc = Document.initialize(client, "hello world");
      doc.edit([6, 11]);
      doc.edit(["hey ", 0, 5]);
      doc.edit(["goodbye ", 6, 11], 1, 0);
      expect(doc.snapshot).to.deep.equal({
        visible: "goodbye hey world",
        hidden: "hello ",
        hiddenSeq: [0, 8, 6, 9],
      });
    });

    it("concurrent 4", () => {
      const doc = Document.initialize(client, "hello world");
      doc.edit([6, 11]);
      doc.edit(["hey ", 0, 5], 1);
      doc.edit(["goodbye ", 0, 5], undefined, 1);
      expect(doc.snapshot).to.deep.equal({
        visible: "goodbye hey world",
        hidden: "hello ",
        hiddenSeq: [1, 6, 17],
      });
    });

    it("concurrent 5", () => {
      const doc = Document.initialize(client, "hello world");
      doc.edit([6, 11]);
      doc.edit(["hey ", 0, 5]);
      doc.edit(["goodbye ", 6, 11], 1, 0);
      expect(doc.snapshot).to.deep.equal({
        visible: "goodbye hey world",
        hidden: "hello ",
        hiddenSeq: [0, 8, 6, 9],
      });
    });

    it("concurrent 6", () => {
      const doc1 = Document.initialize(client, "hello world");
      //"hello world"
      // ===========++++
      doc1.edit(["why ", 0, 5, " there", 5, 11, "s", 11]);
      // ++++=====++++++======+
      //"why hello there worlds"
      doc1.edit([0, 11, "star", 11], 1, 0);
      // ======================++++
      //"why hello there worldsstar"
      expect(doc1.snapshot.visible).to.equal("why hello there worldsstar");
    });

    it("revive 1", () => {
      const doc = Document.initialize(client, "hello world");
      doc.edit([6, 11]);
      doc.edit(["hello ", 0, 5, "s", 5]);
      expect(doc.snapshot).to.deep.equal({
        visible: "hello worlds",
        hidden: "",
        hiddenSeq: [0, 12],
      });
    });

    it("revive 2", () => {
      const doc = Document.initialize(client, "hello world");
      doc.edit([11]);
      doc.edit(["hello ", 0]);
      doc.edit([0, 6, "worlds", 6]);
      expect(doc.snapshot.visible).to.equal("hello worlds");
      expect(doc.snapshot.hidden).to.equal("world");
    });

    it("revive 3", () => {
      const doc = Document.initialize(client, "hello world");
      doc.edit([11]);
      doc.edit(["world", 0]);
      doc.edit(["hello ", 0, 5, "s", 5]);
      expect(doc.snapshot.visible).to.equal("hello worlds");
      expect(doc.snapshot.hidden).to.equal("");
    });

    it("revive 4", () => {
      const doc = Document.initialize(client, "hello world");
      doc.edit(["H", 1, 6, "W", 7, 11]);
      doc.edit([0, 6, "waterw", 7, 11]);
      expect(doc.snapshot.visible).to.equal("Hello waterworld");
      // TODO: hidden?
    });

    it("revive 5", () => {
      const doc = Document.initialize(client, "hello world");
      doc.edit([0, 6, 11]);
      doc.edit([0, 3, "ium", 5, 6, "world", 6]);
      expect(doc.snapshot.visible).to.equal("helium world");
      // TODO: snahidden?
    });

    it("revive 6", () => {
      const doc = Document.initialize(client, "hello world");
      doc.edit([11]);
      doc.edit(["world", 0]);
      expect(doc.snapshot.visible).to.equal("world");
      doc.edit([0, 5, "hello", 5]);
      expect(doc.snapshot.visible).to.equal("worldhello");
      expect(doc.snapshot.hidden).to.equal("hello ");
    });

    it("revive 7", () => {
      const doc = Document.initialize(client, "hello world");
      doc.edit(["H", 1, 6, "W", 7, 11]);
      doc.edit([6, 11]);
      doc.edit(["Hello ", 0, 5]);
      expect(doc.snapshot.visible).to.equal("Hello World");
      expect(doc.snapshot.hidden).to.equal("hw");
    });

    it("revive 8", () => {
      const doc = Document.initialize(client, "hello world");
      doc.edit(["H", 1, 6, "W", 7, 11]);
      doc.edit([0, 5, 11]);
      doc.edit([0, 5, " World", 5]);
      expect(doc.snapshot.visible).to.equal("Hello World");
      expect(doc.snapshot.hidden).to.equal("hw");
    });

    it("revive 10", () => {
      const doc = Document.initialize(client, "hello world");
      doc.edit(["H", 1, 6, "W", 7, 11]);
      doc.edit(["h", 1, 6, "w", 7, 11]);
      expect(doc.snapshot.visible).to.equal("hello world");
      expect(doc.snapshot.hidden).to.equal("HW");
      expect(doc.snapshot.hiddenSeq).to.deep.equal([1, 1, 6, 1, 5]);
    });

    it("no revive 1", () => {
      const doc = Document.initialize(client, "hello world");
      doc.edit([6, 11]);
      doc.edit(["xxxxxx", 0, 5]);
      expect(doc.snapshot.visible).to.equal("xxxxxxworld");
      expect(doc.snapshot.hidden).to.equal("hello ");
    });

    it("no revive 2", () => {
      const doc = Document.initialize(client, "hello world");
      doc.edit(["H", 1, 6, "W", 7, 11]);
      doc.edit([0, 5, 11]);
      doc.edit([0, 5, " Wacky World", 5]);
      expect(doc.snapshot.visible).to.equal("Hello Wacky World");
      expect(doc.snapshot.hidden).to.equal("h Wworld");
    });

    it("revive concurrent 1", () => {
      const doc = Document.initialize(client, "hello world");
      doc.edit(["H", 1, 6, "W", 7, 11]);
      doc.edit(["h", 1, 6, "w", 7, 11]);
      doc.edit([0, 6, "Brian", 11], 1, 1);
      expect(doc.snapshot.visible).to.equal("hello Brianw");
      expect(doc.snapshot.hidden).to.equal("HWorld");
    });

    it("revive concurrent 2", () => {
      const doc = Document.initialize(client, "hello world");
      doc.edit([6, 11]);
      doc.edit(["hello ", 0, 5]);
      doc.edit(["goodbye ", 0, 5], 1, 1);
      expect(doc.snapshot.visible).to.equal("hello goodbye world");
      expect(doc.snapshot.hidden).to.equal("");
    });

    it("revive concurrent 3", () => {
      const doc = Document.initialize(client, "hello world");
      doc.edit([6, 11]);
      doc.edit(["hello ", 0, 5], 1);
      doc.edit(["goodbye ", 0, 5], undefined, 1);
      expect(doc.snapshot.visible).to.equal("hello goodbye world");
      expect(doc.snapshot.hidden).to.equal("");
    });
  });

  describe("Document.undo", () => {
    it("simple", () => {
      const doc = Document.initialize(client, "hello world");
      doc.edit(["goodbye", 5, 11]);
      doc.edit([0, 13, "s", 13]);
      doc.undo(1);
      expect(doc.snapshot.visible).to.equal("hello worlds");
    });
  });
});
