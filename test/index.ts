/* eslint-env mocha */
import { expect } from "chai";
// import * as testcheck from "mocha-testcheck";
// import { check, gen } from "mocha-testcheck";
// testcheck.install();

import * as shredder from "../src/index";
import { Document } from "../src/index";

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
      expect(shredder.union([1, 4, 4], [0, 8])).to.deep.equal([1, 4, 4]);
    });

    it("complex", () => {
      expect(shredder.union([1, 2, 2, 2], [0, 1, 2, 2, 1])).to.deep.equal([
        1,
        3,
        1,
        2,
      ]);
    });
  });

  describe("difference", () => {
    it("empty", () => {
      expect(shredder.difference([1, 8], [1, 4, 4])).to.deep.equal([0, 4, 4]);
    });

    it("complex", () => {
      expect(
        shredder.difference([1, 2, 2, 2], [0, 1, 1, 1, 1, 1, 1]),
      ).to.deep.equal([1, 1, 3, 1, 1]);
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
      expect(shredder.interleave(s, t)).to.deep.equal([0, 1, 2, 7]);
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
    expect(shredder.overlapping("hello ", "hello ")).to.deep.equal([1, 6]);
  });

  it("overlapping 2", () => {
    expect(shredder.overlapping("hello world", "world")).to.deep.equal([
      0,
      6,
      5,
    ]);
  });

  it("overlapping 3", () => {
    expect(shredder.overlapping("hello world", "d")).to.deep.equal([0, 10, 1]);
  });

  it("overlapping 4", () => {
    expect(shredder.overlapping("hello world", " ")).to.deep.equal([
      0,
      5,
      1,
      5,
    ]);
  });

  it("overlapping 5", () => {
    expect(shredder.overlapping(" Wworld", " World")).to.deep.equal([
      1,
      2,
      1,
      4,
    ]);
  });

  it("overlapping 6", () => {
    expect(shredder.overlapping("Hhello", "Hello")).to.deep.equal([1, 1, 1, 4]);
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
  const p0: shredder.Patch = [[0, 1], "era", [9, 11]];
  const p1: shredder.Patch = ["je", [2, 5]];
  const p2: shredder.Patch = [[0, 4], " ", [4, 5], "n Earth"];
  const p3: shredder.Patch = [[0, 6], "buddy"];
  const text = "hello world";

  it("apply", () => {
    expect(shredder.apply(text, p0)).to.equal("herald");
    expect(shredder.apply(text, p1)).to.equal("jello");
    expect(shredder.apply(text, p2)).to.equal("hell on Earth");
    expect(shredder.apply(text, p3)).to.equal("hello buddy");
  });

  it("factor", () => {
    const [inserts, deletes] = shredder.factor(p0, text.length);
    expect(inserts).to.deep.equal([0, 1, 3, 10]);
    expect(deletes).to.deep.equal([0, 1, 8, 2]);
    const [inserts1, deletes1] = shredder.factor(p1, text.length);
    expect(inserts1).to.deep.equal([1, 2, 11]);
    expect(deletes1).to.deep.equal([1, 2, 3, 6]);
    const [inserts2, deletes2] = shredder.factor(p2, text.length);
    expect(inserts2).to.deep.equal([0, 4, 1, 1, 7, 6]);
    expect(deletes2).to.deep.equal([0, 5, 6]);
    const [inserts3, deletes3] = shredder.factor(p3, text.length);
    expect(inserts3).to.deep.equal([0, 6, 5, 5]);
    expect(deletes3).to.deep.equal([0, 6, 5]);
  });

  describe("synthesize", () => {
    it("complex", () => {
      const [inserts, deletes, inserted] = shredder.factor(p0, text.length);
      const deletes1 = shredder.expand(deletes, inserts);
      const union = shredder.apply(
        text,
        shredder.synthesize(inserted, inserts),
      );
      const text1 = shredder.apply(
        union,
        shredder.synthesize(
          "",
          [0, shredder.count(deletes1)],
          shredder.complement(deletes1),
        ),
      );
      const tombstones = shredder.apply(
        union,
        shredder.synthesize(
          "",
          [0, shredder.count(inserts)],
          shredder.complement(inserts),
        ),
      );
      expect(shredder.synthesize(tombstones, inserts, deletes1)).to.deep.equal(
        p0,
      );
      expect(shredder.synthesize(text1, deletes1, inserts)).to.deep.equal([
        [0, 1],
        "ello wor",
        [4, 6],
      ]);
    });
  });
});

describe("Document", () => {
  const clientId = "id1";
  const intents = ["concurrent"];
  describe("Document.hiddenSeqAt", () => {
    it("concurrent revisions", () => {
      const doc = Document.initialize(clientId, "hello world", intents);
      doc.edit(["H", [1, 6], "W", [7, 11]]);
      doc.edit([[0, 5], ", Brian"]);
      doc.edit([[0, 5], ", Dr. Evil"], "concurrent", 1);
      expect(doc.hiddenSeqAt(0)).to.deep.equal([0, 11]);
      expect(doc.hiddenSeqAt(1)).to.deep.equal([0, 1, 1, 6, 1, 4]);
      expect(doc.hiddenSeqAt(2)).to.deep.equal([0, 1, 1, 11, 7]);
      expect(doc.hiddenSeqAt(3)).to.deep.equal([0, 1, 1, 21, 7]);
      expect(doc.hiddenSeqAt(3)).to.deep.equal(doc.hiddenSeq);
    });

    it("revisions with revives", () => {
      const doc = Document.initialize(clientId, "hello world", intents);
      doc.edit(["H", [1, 6], "W", [7, 11]]);
      doc.edit(["h", [1, 6], "w", [7, 11]]);
      expect(doc.hiddenSeqAt(0)).to.deep.equal([0, 11]);
      expect(doc.hiddenSeqAt(1)).to.deep.equal([0, 1, 1, 6, 1, 4]);
      expect(doc.hiddenSeqAt(2)).to.deep.equal([1, 1, 6, 1, 5]);
      expect(doc.hiddenSeqAt(2)).to.deep.equal(doc.hiddenSeq);
    });
  });

  describe("Document.edit", () => {
    it("simple", () => {
      const doc = Document.initialize(clientId, "hello world", intents);
      doc.edit([[0, 1], "era", [9, 11]]);
      expect(doc.revisions.length).to.equal(2);
      expect(doc.visible).to.equal("herald");
      expect(doc.hidden).to.equal("ello wor");
      expect(doc.hiddenSeq).to.deep.equal([0, 4, 8, 2]);
    });

    it("sequential", () => {
      const doc = Document.initialize(clientId, "hello world", intents);
      doc.edit([[0, 1], "era", [9, 11]]);
      doc.edit([[0, 6], "ry"]);
      expect(doc.visible).to.equal("heraldry");
    });

    it("sequential 2", () => {
      const doc = Document.initialize(clientId, "hello world", intents);
      doc.edit(["H", [1, 6], "W", [7, 11]]);
      doc.edit([[0, 5], ", Brian"]);
      expect(doc.visible).to.equal("Hello, Brian");
    });

    it("sequential 3", () => {
      const doc = Document.initialize(clientId, "hello world", intents);
      doc.edit([[6, 11]]);
      doc.edit(["hello ", [0, 5]]);
      doc.edit(["goodbye ", [6, 11]], "concurrent", 0);
      expect(doc.visible).to.equal("goodbye hello world");
    });

    it("concurrent 1", () => {
      const doc = Document.initialize(clientId, "hello world", intents);
      doc.edit([[0, 1], "era", [9, 11]]);
      doc.edit(["Great H", [2, 5]], "concurrent", 0);
      expect(doc.visible).to.equal("Great Hera");
    });

    it("concurrent 2", () => {
      const doc = Document.initialize(clientId, "hello world", intents);
      doc.edit(["H", [1, 6], "W", [7, 11]]);
      doc.edit([[0, 5], ", Brian"]);
      doc.edit([[0, 5], ", Dr. Evil"], "concurrent", 1);
      expect(doc.visible).to.equal("Hello, Brian, Dr. Evil");
    });

    it("concurrent 3", () => {
      const doc = Document.initialize(clientId, "hello world", intents);
      doc.edit([[6, 11]]);
      doc.edit(["hey ", [0, 5]]);
      doc.edit(["goodbye ", [6, 11]], "concurrent", 0);
      expect(doc.visible).to.equal("goodbye hey world");
      expect(doc.hidden).to.equal("hello ");
      expect(doc.hiddenSeq).to.deep.equal([0, 8, 6, 9]);
    });

    it("concurrent 4", () => {
      const doc = Document.initialize(clientId, "hello world", intents);
      doc.edit([[6, 11]]);
      doc.edit(["hey ", [0, 5]], "concurrent");
      doc.edit(["goodbye ", [0, 5]], undefined, 1);
      expect(doc.visible).to.equal("goodbye hey world");
      expect(doc.hidden).to.equal("hello ");
      expect(doc.hiddenSeq).to.deep.equal([1, 6, 17]);
    });

    it("concurrent 5", () => {
      const doc = Document.initialize(clientId, "hello world", intents);
      doc.edit([[6, 11]]);
      doc.edit(["hey ", [0, 5]]);
      doc.edit(["goodbye ", [6, 11]], "concurrent", 0);
      expect(doc.visible).to.equal("goodbye hey world");
      expect(doc.hidden).to.equal("hello ");
      expect(doc.hiddenSeq).to.deep.equal([0, 8, 6, 9]);
    });

    it("concurrent 6", () => {
      const doc1 = Document.initialize(clientId, "hello world", intents);
      //"hello world"
      // ++++=====++++++======+
      //"why hello there worlds"
      // ===========++++
      //"hello worldstar"
      // ++++=====++++++======+
      // =====================++++=
      //"why hello there worldstars"
      doc1.edit(["why ", [0, 5], " there", [5, 11], "s"]);
      doc1.edit([[0, 11], "star"], "concurrent", 0);
      expect(doc1.visible).to.equal("why hello there worldsstar");
    });

    it("revive 1", () => {
      const doc = Document.initialize(clientId, "hello world", intents);
      doc.edit([[6, 11]]);
      doc.edit(["hello ", [0, 5], "s"]);
      expect(doc.visible).to.equal("hello worlds");
      expect(doc.hidden).to.equal("");
    });

    it("revive 2", () => {
      const doc = Document.initialize(clientId, "hello world", intents);
      doc.edit([]);
      doc.edit(["hello "]);
      doc.edit([[0, 6], "worlds"]);
      expect(doc.visible).to.equal("hello worlds");
      expect(doc.hidden).to.equal("world");
    });

    it("revive 3", () => {
      const doc = Document.initialize(clientId, "hello world", intents);
      doc.edit([]);
      doc.edit(["world"]);
      doc.edit(["hello ", [0, 5], "s"]);
      expect(doc.visible).to.equal("hello worlds");
      expect(doc.hidden).to.equal("");
    });

    it("revive 4", () => {
      const doc = Document.initialize(clientId, "hello world", intents);
      doc.edit(["H", [1, 6], "W", [7, 11]]);
      doc.edit([[0, 6], "waterw", [7, 11]]);
      expect(doc.visible).to.equal("Hello waterworld");
    });

    it("revive 5", () => {
      const doc = Document.initialize(clientId, "hello world", intents);
      doc.edit([[0, 6]]);
      doc.edit([[0, 3], "ium", [5, 6], "world"]);
      expect(doc.visible).to.equal("helium world");
    });

    it("revive 6", () => {
      const doc = Document.initialize(clientId, "hello world", intents);
      doc.edit([]);
      doc.edit(["world"]);
      expect(doc.visible).to.equal("world");
      doc.edit([[0, 5], "hello"]);
      expect(doc.visible).to.equal("worldhello");
      expect(doc.hidden).to.equal("hello ");
    });

    it("revive 7", () => {
      const doc = Document.initialize(clientId, "hello world", intents);
      doc.edit(["H", [1, 6], "W", [7, 11]]);
      doc.edit([[6, 11]]);
      doc.edit(["Hello ", [0, 5]]);
      expect(doc.visible).to.equal("Hello World");
      expect(doc.hidden).to.equal("hw");
    });

    it("revive 8", () => {
      const doc = Document.initialize(clientId, "hello world", intents);
      doc.edit(["H", [1, 6], "W", [7, 11]]);
      doc.edit([[0, 5]]);
      doc.edit([[0, 5], " World"]);
      expect(doc.visible).to.equal("Hello World");
      expect(doc.hidden).to.equal("hw");
    });

    it("revive 10", () => {
      const doc = Document.initialize(clientId, "hello world", intents);
      doc.edit(["H", [1, 6], "W", [7, 11]]);
      doc.edit(["h", [1, 6], "w", [7, 11]]);
      expect(doc.visible).to.equal("hello world");
      expect(doc.hidden).to.equal("HW");
      expect(doc.hiddenSeq).to.deep.equal([1, 1, 6, 1, 5]);
    });

    it("no revive 1", () => {
      const doc = Document.initialize(clientId, "hello world", intents);
      doc.edit([[6, 11]]);
      doc.edit(["xxxxxx", [0, 5]]);
      expect(doc.visible).to.equal("xxxxxxworld");
      expect(doc.hidden).to.equal("hello ");
    });

    it("no revive 2", () => {
      const doc = Document.initialize(clientId, "hello world", intents);
      doc.edit(["H", [1, 6], "W", [7, 11]]);
      doc.edit([[0, 5]]);
      doc.edit([[0, 5], " Wacky World"]);
      expect(doc.visible).to.equal("Hello Wacky World");
      expect(doc.hidden).to.equal("h Wworld");
    });

    it("revive concurrent 1", () => {
      const doc = Document.initialize(clientId, "hello world", intents);
      doc.edit(["H", [1, 6], "W", [7, 11]]);
      doc.edit(["h", [1, 6], "w", [7, 11]]);
      doc.edit([[0, 6], "Brian"], "concurrent", 1);
      expect(doc.visible).to.equal("hello Brianw");
      expect(doc.hidden).to.equal("HWorld");
    });

    it("revive concurrent 2", () => {
      const doc = Document.initialize(clientId, "hello world", intents);
      doc.edit([[6, 11]]);
      doc.edit(["hello ", [0, 5]]);
      doc.edit(["goodbye ", [0, 5]], "concurrent", 1);
      expect(doc.visible).to.equal("hello goodbye world");
      expect(doc.hidden).to.equal("");
    });

    it("revive concurrent 3", () => {
      const doc = Document.initialize(clientId, "hello world", intents);
      doc.edit([[6, 11]]);
      doc.edit(["hello ", [0, 5]], "concurrent");
      doc.edit(["goodbye ", [0, 5]], undefined, 1);
      expect(doc.visible).to.equal("hello goodbye world");
      expect(doc.hidden).to.equal("");
    });
  });

  describe("Document.undo", () => {
    it("simple", () => {
      const doc = Document.initialize(clientId, "Hello world", intents);
      doc.edit(["Goodbye", [5, 11]]);
      doc.edit([[0, 13], "s"]);
      doc.undo(1);
      expect(doc.visible).to.equal("Hello worlds");
    });
  });

  describe("Document.ingest", () => {
    it("simple", () => {
      // doc1.edit([[0, 15], " hip hop"]);
    });
  });
});
