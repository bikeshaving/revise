/* eslint-env mocha */
// import * as fs from "fs";
// import * as path from "path";
import { expect } from "chai";
// import * as testcheck from "mocha-testcheck";
// import { check, gen } from "mocha-testcheck";
// testcheck.install();

import * as shredder from "../src/index";
import { Document } from "../src/index";

describe("subseq", () => {
  it("count", () => {
    const s = [0, 10, 5, 8, 4, 4];
    expect(shredder.count(s)).to.equal(31);
    expect(shredder.count(s, false)).to.equal(22);
    expect(shredder.count(s, true)).to.equal(9);
  });

  describe("union", () => {
    it("empty", () => {
      expect(shredder.union([1, 4, 4], [0, 8])).to.deep.equal([1, 4, 4]);
    });

    it("complex", () => {
      const result = [1, 3, 1, 2];
      expect(shredder.union([1, 2, 2, 2], [0, 1, 2, 2, 1])).to.deep.equal(
        result,
      );
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

  it("expand/shrink", () => {
    const s = [0, 4, 4, 6, 5, 3];
    const t = [0, 10, 5, 8, 4, 4];
    const expanded = shredder.expand(s, t);
    const result = [0, 4, 4, 11, 4, 4, 1, 3];
    expect(expanded).to.deep.equal(result);
    expect(shredder.shrink(expanded, t)).to.deep.equal(s);
  });

  describe("rebase", () => {
    it("error when mismatched", () => {
      expect(() => {
        shredder.rebase([0, 5, 1], [1, 1, 4]);
      }).to.throw();
    });

    it("empty transform", () => {
      const s = [0, 1, 2, 7];
      const t = [0, 8];
      expect(shredder.rebase(s, t)).to.deep.equal([0, 1, 2, 7]);
    });

    it("smaller transform", () => {
      // +++====+ subseq
      // +++==== transform
      // ===+++====+ result after
      // +++=======+ result before
      const s = [1, 3, 4, 1];
      const t = [1, 3, 4];
      const result = [0, 3, 3, 4, 1];
      expect(shredder.rebase(s, t)).to.deep.equal(result);
      const result1 = [1, 3, 7, 1];
      expect(shredder.rebase(s, t, true)).to.deep.equal(result1);
    });

    it("same position", () => {
      // ==++==== subseq
      // ==++==== transform
      // ====++==== result after
      // ==++====== result before
      const s = [0, 2, 2, 4];
      const t = [0, 2, 2, 4];
      const result = [0, 4, 2, 4];
      expect(shredder.rebase(s, t)).to.deep.equal(result);
      const result1 = [0, 2, 2, 6];
      expect(shredder.rebase(s, t, true)).to.deep.equal(result1);
    });

    it("same position different lengths", () => {
      // ==++++== subseq
      // ==++== transform
      // ====++++== result after
      // ==++++==== result before
      const s = [0, 2, 4, 2];
      const t = [0, 2, 2, 2];
      const result = [0, 4, 4, 2];
      expect(shredder.rebase(s, t)).to.deep.equal(result);
      const result1 = [0, 2, 4, 4];
      expect(shredder.rebase(s, t, true)).to.deep.equal(result1);
    });

    it("subseq before", () => {
      // +===== subseq
      // =++++==== transform
      // +========= result after
      // +========= result before
      const s = [1, 1, 5];
      const t = [0, 1, 4, 4];
      const result = [1, 1, 9];
      expect(shredder.rebase(s, t)).to.deep.equal(result);
      expect(shredder.rebase(s, t, true)).to.deep.equal(result);
    });

    it("subseq before overlapping", () => {
      // ++==== subseq
      // =++++=== transform
      // ++======== result after
      // ++======== result before
      const s = [1, 2, 4];
      const t = [0, 1, 4, 3];
      const result = [1, 2, 8];
      expect(shredder.rebase(s, t)).to.deep.equal(result);
      expect(shredder.rebase(s, t, true)).to.deep.equal(result);
    });

    it("subseq after", () => {
      // =++++==== subseq
      // +===== transform
      // ==++++==== result after
      // ==++++==== result before
      const s = [0, 1, 4, 4];
      const t = [1, 1, 5];
      const result = [0, 2, 4, 4];
      expect(shredder.rebase(s, t)).to.deep.equal(result);
      expect(shredder.rebase(s, t, true)).to.deep.equal(result);
    });

    it("subseq after overlapping 1", () => {
      // ====++ subseq
      // ==++++== transform
      // ========++ result after
      // ========++ result before
      const s = [0, 4, 2];
      const t = [0, 2, 4, 2];
      const result = [0, 8, 2];
      expect(shredder.rebase(s, t)).to.deep.equal(result);
      expect(shredder.rebase(s, t, true)).to.deep.equal(result);
    });

    it("subseq after overlapping 2", () => {
      // ==++=== subseq
      // =+++==== transform
      // =====++=== result after
      // =====++=== result before
      const s = [0, 2, 2, 3];
      const t = [0, 1, 3, 4];
      const result = [0, 5, 2, 3];
      expect(shredder.rebase(s, t)).to.deep.equal(result);
      expect(shredder.rebase(s, t, true)).to.deep.equal(result);
    });

    it("subseq after overlapping 3", () => {
      // =++++=== subseq
      // ++==== transform
      // ===++++=== result after
      // ===++++=== result before
      const s = [0, 1, 4, 3];
      const t = [1, 2, 4];
      const result = [0, 3, 4, 3];
      expect(shredder.rebase(s, t)).to.deep.equal(result);
      expect(shredder.rebase(s, t, true)).to.deep.equal(result);
    });

    it("multiple segments", () => {
      // +=++=+== subseq
      // =+===+ transform
      // +==++=+=== result after
      // +=++==+=== result before
      const s = [1, 1, 1, 2, 1, 1, 2];
      const t = [0, 1, 1, 3, 1];
      const result = [1, 1, 2, 2, 1, 1, 3];
      expect(shredder.rebase(s, t)).to.deep.equal(result);
      const result1 = [1, 1, 1, 2, 2, 1, 3];
      expect(shredder.rebase(s, t, true)).to.deep.equal(result1);
    });
  });
});

describe("overlapping", () => {
  it("overlapping 1", () => {
    expect(shredder.overlapping("hello ", "hello ")).to.deep.equal([0, 6]);
  });
  it("overlapping 2", () => {
    expect(shredder.overlapping("hello world", "world")).to.deep.equal([6, 5]);
  });
  it("overlapping 3", () => {
    expect(shredder.overlapping("hello world", "worlds")).to.deep.equal([6, 5]);
  });
  it("overlapping 4", () => {
    expect(shredder.overlapping("hello world", "d")).to.deep.equal([10, 1]);
  });
  it("overlapping 5", () => {
    expect(shredder.overlapping("hello world", " ")).to.deep.equal([5, 1]);
  });
  it("overlapping 6", () => {
    expect(shredder.overlapping("hello world", "xworld")).to.equal(undefined);
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
  describe("Document.getDeletesForIndex", () => {
    it("get deletes for all points in history", () => {
      const doc = Document.initialize(clientId, "hello world", intents);
      //"hello world"
      doc.edit(["H", [1, 6], "W", [7, 11]]);
      // +======+===== inserts
      // =+======+==== deletes
      // =+======+==== deletes from union
      //"Hhello Wworld"
      doc.edit([[0, 5], ", Brian"]);
      // ======+++++++======= inserts
      // =============++=++++ deletes
      // =+===========+++++++ deletes from union
      //"Hhello, Brian Wworld"
      doc.edit([[0, 5], ", Dr. Evil"], "concurrent", 1);
      // =============++++++++++======= rebased inserts
      // ============================== overlapping deletes are ignored
      // =+=====================+++++++ deletes from union
      //"Hhello, Brian, Dr. Evil Wworld"
      const deletes = [0, 11];
      expect(doc.getDeletesForIndex(0)).to.deep.equal(deletes);
      const deletes1 = [0, 1, 1, 6, 1, 4];
      expect(doc.getDeletesForIndex(1)).to.deep.equal(deletes1);
      const deletes2 = [0, 1, 1, 11, 7];
      expect(doc.getDeletesForIndex(2)).to.deep.equal(deletes2);
      const deletes3 = [0, 1, 1, 21, 7];
      expect(doc.getDeletesForIndex(3)).to.deep.equal(deletes3);
      expect(doc.getDeletesForIndex(3)).to.deep.equal(doc.deletes);
    });
  });

  describe("Document.edit", () => {
    it("simple", () => {
      const doc = Document.initialize(clientId, "hello world", intents);
      doc.edit([[0, 1], "era", [9, 11]]);
      expect(doc.revisions.length).to.equal(2);
      expect(doc.visible).to.equal("herald");
      expect(doc.hidden).to.equal("ello wor");
      expect(doc.deletes).to.deep.equal([0, 4, 8, 2]);
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

    it("revive 1", () => {
      const doc = Document.initialize(clientId, "hello world", intents);
      //"hello world"
      doc.edit([[6, 11]]);
      // =========== inserts
      // ++++++===== deletes
      // ++++++===== deletes from union
      //"hello world"
      doc.edit(["hello ", [0, 5], "s"]);
      // without revives
      // ======++++++=====+ inserts
      // ================== deletes
      // ++++++============ deletes from union
      //"hello hello worlds"
      // with revives
      // ++++++============ revived deletes [1, 6, 12]
      // ======++++++====== revived inserts [0, 6, 6, 6]
      // ===========+ inserts
      // ++++++====== revives
      // ============ deletes from union
      //"hello worlds"
      expect(doc.visible).to.equal("hello worlds");
      // expect(doc.hidden).to.equal("");
    });

    it("revive 2", () => {
      const doc = Document.initialize(clientId, "hello world", intents);
      //"hello world"
      doc.edit([]);
      // =========== inserts
      // +++++++++++ deletes
      // +++++++++++ deletes from union
      //"hello world"
      doc.edit(["hello s"]);
      // without revives
      // ===========+++++++ inserts
      // ================== deletes
      // +++++++++++======= deletes from union
      //"hello worldhello s"
      // with revives
      // ++++++============ revived deletes [1, 6, 12]
      // ===========++++++= revived inserts [0, 11, 6, 1]
      // ===========+ inserts
      // ============ deletes
      // ++++++====== revives
      // ======+++++= deletes from union
      //"hello worlds"

      // doc.edit([
      //   { start: 0, end: 6, insert: "world" },
      //   { start: 6, end: 7, insert: "" },
      // ]);
      // without revives
      // =================+++++= inserts
      // ======================= deletes
      // +++++++++++============ deletes from union
      //"hello worldhello worlds"
      // with revives
      // ============ inserts
      // ============ deletes
      // ======+++++= revives
      // ============ deletes from union
      //"hello worlds"
      // expect(doc.visible).to.equal("hello worlds");
      // expect(doc.hidden).to.equal("");
    });

    it("revive 3", () => {
      const doc = Document.initialize(clientId, "hello world", intents);
      //"hello world"
      doc.edit([]);
      // =========== inserts
      // +++++++++++ deletes
      // +++++++++++ deletes from union
      //"hello world"
      doc.edit(["worlds"]);
      // without revives
      // ===========++++++ inserts
      // ================= deletes
      // +++++++++++====== deletes from union
      //"hello worldworlds"
      // with revives
      // ======+++++====== revived deletes [0, 6, 5, 6]
      // ===========+++++= revived inserts [0, 11, 5, 1]
      // ===========+ inserts
      // ============ deletes
      // ======+++++= revives
      // ++++++====== deletes from union
      //"hello worlds"

      // doc.edit([
      //   { start: 0, end: 0, insert: "hello " },
      //   { start: 0, end: 6, insert: "" },
      // ]);
      // without revives
      // ===========++++++====== inserts
      // ======================= deletes
      // +++++++++++============ deletes from union
      //"hello worldhello worlds"
      // with revives
      // ============ inserts
      // ============ deletes
      // ======+++++= revives
      // ============ deletes from union
      //"hello worlds"
      // expect(doc.visible).to.equal("hello worlds");
      // expect(doc.hidden).to.equal("");
    });

    it("revive 4", () => {
      const doc = Document.initialize(clientId, "hello world", intents);
      //"hello world"
      doc.edit(["H", [1, 6], "W", [7, 11]]);
      // +======+===== inserts
      // =+======+==== deletes
      // =+======+==== deletes from union
      //"Hhello Wworld"
      doc.edit([[0, 6], "waterw", [7, 11]]);
      // =======++++++====== inserts
      // =============+===== deletes
      // =+===========++==== deletes from union
      //"Hhello waterwWworld"
      expect(doc.visible).to.equal("Hello waterworld");
    });

    it("revive 5", () => {
      const doc = Document.initialize(clientId, "hello world", intents);
      //"hello world"
      doc.edit([[0, 6]]);
      // =========== inserts
      // ======+++++ deletes
      // ======+++++ deletes from union
      //"hello world"
      // without revives
      // ===+++========+++++ inserts
      // ======++=========== deletes
      // ======++=+++++===== deletes from union
      //"heliumlo worldworld"
      // with revives
      // ===+++===+++++ inserts
      // ======++====== deletes
      // ======++====== deletes from union
      //"heliumlo world"
      doc.edit([[0, 3], "ium", [5, 6], "world"]);
      expect(doc.visible).to.equal("helium world");
    });

    it("revive 6", () => {
      const doc = Document.initialize(clientId, "hello world", intents);
      //"hello world"
      doc.edit([]);
      // =========== inserts
      // +++++++++++ deletes
      // +++++++++++ deletes from union
      //"hello world"
      doc.edit(["world"]);
      // without revives
      // ===========+++++ inserts
      // ================ deletes
      // +++++++++++===== deletes from union
      //"hello worldworld"
      // with revives
      // =========== inserts
      // =========== deletes
      // ======+++++ revives
      // ++++++===== deletes from union
      expect(doc.visible).to.equal("world");
      //"hello world"
      // doc.edit([[0, 5], "hello"]);
      // without revives
      //"hello worldworld"
      // ================+++++ inserts
      // ===================== deletes
      // +++++++++++========== deletes from union
      //"hello worldworldhello"
      // with revives
      // ===========+++++ inserts
      // ================ deletes
      // ================ revives
      // ++++++========== deletes from union
      //"hello worldhello"
      // expect(doc.visible).to.equal("worldhello");
      // expect(doc.hidden).to.equal("hello ");
    });
  });
});
