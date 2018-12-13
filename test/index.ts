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
    const [insertSeq, deleteSeq] = shredder.factor(p0, text.length);
    expect(insertSeq).to.deep.equal([0, 1, 3, 10]);
    expect(deleteSeq).to.deep.equal([0, 1, 8, 2]);
    const [insertSeq1, deleteSeq1] = shredder.factor(p1, text.length);
    expect(insertSeq1).to.deep.equal([1, 2, 11]);
    expect(deleteSeq1).to.deep.equal([1, 2, 3, 6]);
    const [insertSeq2, deleteSeq2] = shredder.factor(p2, text.length);
    expect(insertSeq2).to.deep.equal([0, 4, 1, 1, 7, 6]);
    expect(deleteSeq2).to.deep.equal([0, 5, 6]);
    const [insertSeq3, deleteSeq3] = shredder.factor(p3, text.length);
    expect(insertSeq3).to.deep.equal([0, 6, 5, 5]);
    expect(deleteSeq3).to.deep.equal([0, 6, 5]);
  });

  describe("synthesize", () => {
    it("complex", () => {
      const [insertSeq, deleteSeq, inserted] = shredder.factor(p0, text.length);
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
      expect(shredder.synthesize(text1, deleteSeq1, insertSeq)).to.deep.equal([
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
      // ===========++++
      doc1.edit(["why ", [0, 5], " there", [5, 11], "s"]);
      // ++++=====++++++======+
      //"why hello there worlds"
      doc1.edit([[0, 11], "star"], "concurrent", 0);
      // ======================++++
      //"why hello there worldsstar"
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
      const doc = Document.initialize(clientId, "hello world", intents);
      doc.edit(["goodbye", [5, 11]]);
      doc.edit([[0, 13], "s"]);
      doc.undo(1);
      expect(doc.visible).to.equal("hello worlds");
    });
  });

  describe("Document.ingest", () => {
    it("simple", () => {
      const docA = Document.initialize(clientId, "hello world", intents);
      const docB = docA.clone("id2");
      //"hello world"
      const messageA1 = docA.edit(["goodbye", [5, 11]]);
      // +++++++-----====== patch
      // =======-----====== hiddenSeq
      //"goodbyehello world"
      const messageB1 = docB.edit([[0, 6], "Brian"]);
      // ======+++++----- patch
      // ===========----- hiddenSeq
      //"hello Brianworld"
      const messageB2 = docB.edit([[0, 11], " Kim"]);
      // ================++++ patch
      // ===========-----==== hiddenSeq
      //"hello Brianworld Kim"
      const messageB3 = docB.edit([[6, 15]]);
      // ------============== patch
      // ------=====-----==== hiddenSeq
      //"hello Brianworld Kim"
      docA.ingest(messageB1);
      // =============+++++----- ingested patch
      // +++++++================ baseInsertSeq
      // =======-----=========== baseDeleteSeq
      // =======-----======----- hiddenSeq
      //"goodbyehello Brianworld"
      docA.ingest(messageB2);
      // =======================++++ ingested patch
      // +++++++==================== baseInsertSeq
      // =======-----=============== baseDeleteSeq
      // =======-----=============== hiddenSeq
      //"goodbyehello Brianworld Kim"
      docA.ingest(messageB3);
      // ============-============== ingested patch
      // +++++++==================== baseInsertSeq
      // =======-----=============== baseDeleteSeq
      // =======------=====-----==== hiddenSeq
      //"goodbyehello Brianworld Kim"
      expect(docA.visible).to.equal("goodbyeBrian Kim");
      docB.ingest(messageA1);
      expect(docA.visible).to.equal(docB.visible);
      expect(docA.hidden).to.equal(docB.hidden);
      expect(docA.hiddenSeq).to.deep.equal(docB.hiddenSeq);
    });

    it("concurrent deletes", () => {
      const docA = Document.initialize(clientId, "hello world", intents);
      //"hello world"
      const docB = docA.clone("id2");
      const messageA1 = docA.edit([]);
      // ----------- patch
      // ----------- hiddenSeq
      //"hello world"
      const messageB1 = docB.edit([[0, 5]]);
      // =====------ patch
      // =====------ hiddenSeq
      //"hello world"
      const messageB2 = docB.edit([[0, 5], "!"]);
      // ===========+ patch
      // =====------= hiddenSeq
      //"hello world!"
      docA.ingest(messageB1);
      // =========== ingested patch
      // -----====== baseDeleteSeq
      // ----------- hiddenSeq
      //"hello world"
      docA.ingest(messageB2);
      // ===========+ ingested patch
      // -----======= baseDeleteSeq
      // -----------= hiddenSeq
      //"hello world!"
      docB.ingest(messageA1);
      expect(docA.visible).to.equal("!");
      expect(docA.visible).to.equal(docB.visible);
      expect(docA.hidden).to.equal(docB.hidden);
      expect(docA.hiddenSeq).to.deep.equal(docB.hiddenSeq);
    });

    it("inserts at same position", () => {
      const docA = Document.initialize(clientId, "hello world", intents);
      const docB = docA.clone("id2");
      //"hello world"
      const messageA1 = docA.edit(["goodbye", [5, 11]]);
      // +++++++-----====== patch
      // =======-----====== hiddenSeq
      //"goodbyehello world"
      const messageB1 = docB.edit(["H", [1, 11]]);
      // +-========== patch
      // =-========== hiddenSeq
      //"Hhello world"
      const messageB2 = docB.edit([[0, 6], "W", [7, 11]]);
      // =======+-==== patch
      // =-======-==== hiddenSeq
      //"Hhello Wworld"
      docA.ingest(messageB1);
      // =======+=========== ingested patch
      // +++++++============ baseInsertSeq
      // =========----====== baseDeleteSeq
      // ========-----====== hiddenSeq
      //"goodbyeHhello world"
      docA.ingest(messageB2);
      // ==============+-==== ingested patch
      // +++++++============= baseInsertSeq
      // =========----======= baseDeleteSeq
      // ========-----==-==== hiddenSeq
      //"goodbyeHhello Wworld"
      docB.ingest(messageA1);
      expect(docA.visible).to.equal("goodbyeH World");
      expect(docA.visible).to.equal(docB.visible);
      expect(docA.hidden).to.equal(docB.hidden);
      expect(docA.hiddenSeq).to.deep.equal(docB.hiddenSeq);
    });

    it("three clients 1", () => {
      const docA = Document.initialize(clientId, "hello world", intents);
      const docB = docA.clone("id2");
      const docC = docA.clone("id3");
      const messageA = docA.edit([[0, 5], "_", [6, 11]]);
      const messageB = docB.edit(["H", [1, 6], "W", [7, 11]]);
      const messageC = docC.edit(["(", [0, 5], [6, 11], ")"]);
      docA.ingest(messageB);
      docA.ingest(messageC);
      expect(docA.visible).to.equal("H(ello_World)");
      docB.ingest(messageA);
      docB.ingest(messageC);
      expect(docA.visible).to.equal(docB.visible);
      expect(docA.hidden).to.equal(docB.hidden);
      expect(docA.hiddenSeq).to.deep.equal(docB.hiddenSeq);
      docC.ingest(messageB);
      docC.ingest(messageA);
      expect(docA.visible).to.equal(docC.visible);
      expect(docA.hidden).to.equal(docC.hidden);
      expect(docA.hiddenSeq).to.deep.equal(docC.hiddenSeq);
    });

    it("three clients 2", () => {
      const docA = Document.initialize(clientId, "hello world", intents);
      const docB = docA.clone("id2");
      const docC = docA.clone("id3");
      const messageA0 = docA.edit([[0, 5], "_", [6, 11]]);
      const messageA1 = docA.edit([[0, 6], "_", [6, 11]]);
      const messageB0 = docB.edit(["H", [1, 6], "W", [7, 11]]);
      const messageB1 = docB.edit([[0, 5], [6, 11]]);
      const messageC0 = docC.edit(["(", [0, 11], ")"]);
      const messageC1 = docC.edit([[0, 1], "Hey", [7, 13]]);
      docA.ingest(messageB0);
      docA.ingest(messageC0);
      docA.ingest(messageB1);
      docA.ingest(messageC1);
      expect(docA.visible).to.equal("H(Hey__World)");
      docB.ingest(messageA0);
      docB.ingest(messageC0);
      docB.ingest(messageA1);
      docB.ingest(messageC1);
      expect(docA.visible).to.equal(docB.visible);
      expect(docA.hidden).to.equal(docB.hidden);
      expect(docA.hiddenSeq).to.deep.equal(docB.hiddenSeq);
      messageA0; messageA1; messageB0; messageB1; messageC0; messageC1;
    });

    /*
    TODO: test this situation
    a  b  c  d
    a0 b0 c0 d0
       d0 a0
       a0 b0
       b1 b1
    "hello world"
     ===========
    a0
    "why hello world"
     ++++===========
    b0
    "Hhello world"
     +-==========
    c0
    "hello world!"
     =====-=====+
    d0
    "hello Wworld"
     ======+-====
    d0 applied to b
    "Hhello Wworld"
     =======+-====
    a0 applied to b
    "why Hhello Wworld"
     ++++=============
    b1
    "why Hhello Wworld."
     =================+
    a0 applied to c
    "why hello world!"
     ++++============
    b0 applied to c
    "why Hhello world!"
     ====+-===========
    b1 applied to c
    "why Hhello world!."
     =================+
    d0 applied to c
    "why Hhello Wworld!."
     ===========+-======
    c0 applied to b
    "why Hhello Wworld.!"
     ==========-=======+
    A revision depends on every revision before it, so b1 cannot be applied to c because d0 is missing. Is this an intractable problem???
    */
  });
});
