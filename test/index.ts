/* eslint-env mocha */
// import * as fs from "fs";
// import * as path from "path";
import { expect } from "chai";
// import * as testcheck from "mocha-testcheck";
// import { check, gen } from "mocha-testcheck";
// testcheck.install();

import * as shredder from "../src/index";
import { Document } from "../src/index";

describe("subset", () => {
  it("countBy", () => {
    const s: shredder.Subset = [[10, 0], [5, 1], [8, 0], [4, 1], [4, 0]];
    expect(shredder.countBy(s)).to.equal(31);
    expect(shredder.countBy(s, (c) => c === 0)).to.equal(22);
    expect(shredder.countBy(s, (c) => c === 1)).to.equal(9);
  });

  it("union", () => {
    expect(shredder.union([[4, 1], [4, 0]], [[8, 0]])).to.deep.equal([
      [4, 1],
      [4, 0],
    ]);
    expect(
      shredder.union(
        [[2, 1], [2, 0], [2, 1]],
        [[1, 0], [2, 1], [2, 0], [1, 1]],
      ),
    ).to.deep.equal([[1, 1], [1, 2], [1, 1], [1, 0], [1, 1], [1, 2]]);
  });

  it("transform", () => {
    const s: shredder.Subset = [[4, 0], [4, 1], [6, 0], [5, 1], [3, 0]];
    const t: shredder.Subset = [[10, 0], [5, 1], [8, 0], [4, 1], [4, 0]];
    const expanded = shredder.expand(s, t);
    const result = [[4, 0], [4, 1], [11, 0], [4, 1], [4, 0], [1, 1], [3, 0]];
    expect(expanded).to.deep.equal(result);
    expect(shredder.shrink(expanded, t)).to.deep.equal(s);
  });

  describe("rebase", () => {
    it("error when mismatched", () => {
      expect(() => {
        shredder.rebase([[5, 0], [1, 1]], [[1, 1], [4, 0]]);
      }).to.throw();
    });

    it("empty transform", () => {
      const s: shredder.Subset = [[1, 0], [2, 1], [7, 0]];
      const t: shredder.Subset = [[8, 0]];
      expect(shredder.rebase(s, t)).to.deep.equal([[1, 0], [2, 1], [7, 0]]);
    });

    it("same position", () => {
      // subset
      // ==++====
      // transform
      // ==++====
      // result after
      // ====++====
      // result before
      // ==++======
      const s: shredder.Subset = [[2, 0], [2, 1], [4, 0]];
      const t: shredder.Subset = [[2, 0], [2, 1], [4, 0]];
      const result = [[4, 0], [2, 1], [4, 0]];
      expect(shredder.rebase(s, t)).to.deep.equal(result);
      const result1 = [[2, 0], [2, 1], [6, 0]];
      expect(shredder.rebase(s, t, true)).to.deep.equal(result1);
    });

    it("same position different lengths", () => {
      // subset
      // ==++++==
      // transform
      // ==++==
      // result after
      // ====++++==
      // result before
      // ==++++====
      const s: shredder.Subset = [[2, 0], [4, 1], [2, 0]];
      const t: shredder.Subset = [[2, 0], [2, 1], [2, 0]];
      const result = [[4, 0], [4, 1], [2, 0]];
      expect(shredder.rebase(s, t)).to.deep.equal(result);
      const result1 = [[2, 0], [4, 1], [4, 0]];
      expect(shredder.rebase(s, t, true)).to.deep.equal(result1);
    });

    it("subset before", () => {
      // subset
      // +=====
      // transform
      // =++++====
      // result after
      // +=========
      // result before
      // +=========
      const s: shredder.Subset = [[1, 1], [5, 0]];
      const t: shredder.Subset = [[1, 0], [4, 1], [4, 0]];
      const result = [[1, 1], [9, 0]];
      expect(shredder.rebase(s, t)).to.deep.equal(result);
      expect(shredder.rebase(s, t, true)).to.deep.equal(result);
    });

    it("subset before overlapping", () => {
      // subset
      // ++====
      // transform
      // =++++===
      // result after
      // ++========
      // result before
      // ++========
      const s: shredder.Subset = [[2, 1], [4, 0]];
      const t: shredder.Subset = [[1, 0], [4, 1], [3, 0]];
      const result = [[2, 1], [8, 0]];
      expect(shredder.rebase(s, t)).to.deep.equal(result);
      expect(shredder.rebase(s, t, true)).to.deep.equal(result);
    });

    it("subset after", () => {
      // subset
      // =++++====
      // transform
      // +=====
      // result after
      // ==++++====
      // result before
      // ==++++====
      const s: shredder.Subset = [[1, 0], [4, 1], [4, 0]];
      const t: shredder.Subset = [[1, 1], [5, 0]];
      const result = [[2, 0], [4, 1], [4, 0]];
      expect(shredder.rebase(s, t)).to.deep.equal(result);
      expect(shredder.rebase(s, t, true)).to.deep.equal(result);
    });

    it("subset after overlapping 1", () => {
      // subset
      // ====++
      // transform
      // ==++++==
      // result after
      // ========++
      // result before
      // ========++
      const s: shredder.Subset = [[4, 0], [2, 1]];
      const t: shredder.Subset = [[2, 0], [4, 1], [2, 0]];
      const result = [[8, 0], [2, 1]];
      expect(shredder.rebase(s, t)).to.deep.equal(result);
      expect(shredder.rebase(s, t, true)).to.deep.equal(result);
    });

    it("subset after overlapping 2", () => {
      // subset
      // ==++===
      // transform
      // =+++====
      // result after
      // =====++===
      // result before
      // =====++===
      const s: shredder.Subset = [[2, 0], [2, 1], [3, 0]];
      const t: shredder.Subset = [[1, 0], [3, 1], [4, 0]];
      const result = [[5, 0], [2, 1], [3, 0]];
      expect(shredder.rebase(s, t)).to.deep.equal(result);
      expect(shredder.rebase(s, t, true)).to.deep.equal(result);
    });

    it("subset after overlapping 3", () => {
      // subset
      // =++++===
      // transform
      // ++====
      // result after
      // ===++++===
      // result before
      // ===++++===
      const s: shredder.Subset = [[1, 0], [4, 1], [3, 0]];
      const t: shredder.Subset = [[2, 1], [4, 0]];
      const result = [[3, 0], [4, 1], [3, 0]];
      expect(shredder.rebase(s, t)).to.deep.equal(result);
      expect(shredder.rebase(s, t, true)).to.deep.equal(result);
    });

    it("multiple segments", () => {
      // subset
      // +=++=+==
      // transform
      // =+===+
      // result after
      // +==++=+===
      // result before
      // +=++==+===
      const s: shredder.Subset = [
        [1, 1],
        [1, 0],
        [2, 1],
        [1, 0],
        [1, 1],
        [2, 0],
      ];
      const t: shredder.Subset = [[1, 0], [1, 1], [3, 0], [1, 1]];
      const result = [[1, 1], [2, 0], [2, 1], [1, 0], [1, 1], [3, 0]];
      expect(shredder.rebase(s, t)).to.deep.equal(result);
      const result1 = [[1, 1], [1, 0], [2, 1], [2, 0], [1, 1], [3, 0]];
      expect(shredder.rebase(s, t, true)).to.deep.equal(result1);
    });
  });
});

describe("patch", () => {
  const p0: shredder.Patch = [
    { start: 0, end: 1, insert: "era" },
    { start: 9, end: 11, insert: "" },
  ];
  const p1: shredder.Patch = [
    { start: 0, end: 0, insert: "je" },
    { start: 2, end: 5, insert: "" },
  ];
  const p2: shredder.Patch = [
    { start: 0, end: 4, insert: " " },
    { start: 4, end: 5, insert: "n Earth" },
  ];
  const text = "hello world";
  it("apply", () => {
    expect(shredder.apply(text, p0)).to.equal("herald");
    expect(shredder.apply(text, p1)).to.equal("jello");
    expect(shredder.apply(text, p2)).to.equal("hell on Earth");
  });

  it("factor", () => {
    const [inserts, deletes] = shredder.factor(p0, text.length, "");
    expect(inserts).to.deep.equal([[1, 0], [3, 1], [10, 0]]);
    expect(deletes).to.deep.equal([[1, 0], [8, 1], [2, 0]]);
    const [inserts1, deletes1] = shredder.factor(p1, text.length, "");
    expect(inserts1).to.deep.equal([[2, 1], [11, 0]]);
    expect(deletes1).to.deep.equal([[2, 1], [3, 0], [6, 1]]);
    const [inserts2, deletes2] = shredder.factor(p2, text.length, "");
    expect(inserts2).to.deep.equal([[4, 0], [1, 1], [1, 0], [7, 1], [6, 0]]);
    expect(deletes2).to.deep.equal([[5, 0], [6, 1]]);
  });

  it("synthesize", () => {
    const [inserts, deletes, inserted] = shredder.factor(p0, text.length, "");
    const deletes1: shredder.Subset = shredder.expand(deletes, inserts);
    const union = shredder.apply(text, shredder.synthesize(inserted, inserts));
    const text1 = shredder.apply(
      union,
      shredder.synthesize(
        "",
        [[shredder.countBy(deletes1), 0]],
        shredder.complement(deletes1),
      ),
    );
    const tombstones = shredder.apply(
      union,
      shredder.synthesize(
        "",
        [[shredder.countBy(inserts), 0]],
        shredder.complement(inserts),
      ),
    );
    expect(shredder.synthesize(tombstones, inserts, deletes1)).to.deep.equal(
      p0,
    );
    expect(shredder.synthesize(text1, deletes1, inserts)).to.deep.equal([
      { start: 0, end: 1, insert: "" },
      { start: 4, end: 4, insert: "ello wor" },
      { start: 4, end: 6, insert: "" },
    ]);
  });
});

describe("Document", () => {
  const clientId = "id1";
  const intents = ["concurrent"];
  describe("Document.getDeletesForIndex", () => {
    it("get deletes for all points in history", () => {
      const doc = Document.initialize(clientId, "hello world", intents);
      //"hello world"
      // ===========
      //"Hhello Wworld"
      // =+======+====
      //"Hhello, Brian Wworld"
      // =+===========+++++++
      //"Hhello, Brian, Dr. Evil Wworld"
      // =+=====================+++++++
      doc.edit([
        { start: 0, end: 0, insert: "H" },
        { start: 1, end: 6, insert: "W" },
        { start: 7, end: 11, insert: "" },
      ]);
      doc.edit([{ start: 0, end: 5, insert: ", Brian" }]);
      doc.edit([{ start: 0, end: 5, insert: ", Dr. Evil" }], "concurrent", 1);
      const deletes = [[11, 0]];
      expect(doc.getDeletesForIndex(0)).to.deep.equal(deletes);
      const deletes1 = [[1, 0], [1, 1], [6, 0], [1, 1], [4, 0]];
      expect(doc.getDeletesForIndex(1)).to.deep.equal(deletes1);
      const deletes2 = [[1, 0], [1, 1], [11, 0], [7, 1]];
      expect(doc.getDeletesForIndex(2)).to.deep.equal(deletes2);
      const deletes3 = [[1, 0], [1, 1], [21, 0], [2, 2], [1, 1], [4, 2]];
      expect(doc.getDeletesForIndex(3)).to.deep.equal(deletes3);
      expect(doc.getDeletesForIndex(3)).to.deep.equal(doc.deletes);
    });
  });

  describe("Document.edit", () => {
    it("simple", () => {
      const doc = Document.initialize(clientId, "hello world", intents);
      doc.edit([
        { start: 0, end: 1, insert: "era" },
        { start: 9, end: 11, insert: "" },
      ]);
      expect(doc.revisions.length).to.equal(2);
      expect(doc.visible).to.equal("herald");
      expect(doc.hidden).to.equal("ello wor");
      expect(doc.deletes).to.deep.equal([[4, 0], [8, 1], [2, 0]]);
    });
    it("sequential", () => {
      const doc = Document.initialize(clientId, "hello world", intents);
      //"hello world"
      // inserts
      // =+++==
      //"herald"
      // deletes
      // =++++++++==
      //"hello world"
      doc.edit([
        { start: 0, end: 1, insert: "era" },
        { start: 9, end: 11, insert: "" },
      ]);
      doc.edit([{ start: 0, end: 6, insert: "ry" }]);
      expect(doc.visible).to.equal("heraldry");
    });
    it("sequential 2", () => {
      const doc = Document.initialize(clientId, "hello world", intents);
      doc.edit([
        { start: 0, end: 0, insert: "H" },
        { start: 1, end: 6, insert: "W" },
        { start: 7, end: 11, insert: "" },
      ]);
      // union string
      //"Hhello Wworld"
      // inserts
      //"Hello, Brian World"
      // =====+++++++======
      // deletes
      //"Hello World"
      // =====++++++
      // old deletes
      //"Hhello Wworld"
      // =+======+====
      // rebased inserts against old deletes
      //"Hhello, Brian Wworld"
      // ======+++++++=======
      // expanded deletes against old deletes
      //"Hhello Wworld"
      // ======++=++++
      // expanded deletes against rebased inserts
      //"Hhello, Brian Wworld"
      // =============++=++++
      // rebased current deletes against rebased inserts
      //"Hhello, Brian Wworld"
      // =+=============+====
      // union of expanded deletes and rebased current deletes
      //"Hhello, Brian Wworld"
      // =+===========+++++++
      doc.edit([{ start: 0, end: 5, insert: ", Brian" }]);
      expect(doc.visible).to.equal("Hello, Brian");
    });
    it("sequential 3", () => {
      const doc = Document.initialize(clientId, "hello world", intents);
      doc.edit([{ start: 6, end: 11, insert: "" }]);
      doc.edit([
        { start: 0, end: 0, insert: "hello " },
        { start: 0, end: 5, insert: "" },
      ]);
      doc.edit(
        [
          { start: 0, end: 0, insert: "goodbye " },
          { start: 6, end: 11, insert: "" },
        ],
        "concurrent",
        0,
      );
      expect(doc.visible).to.equal("goodbye hello world");
    });
    it("concurrent 1", () => {
      const doc = Document.initialize(clientId, "hello world", intents);
      doc.edit([
        { start: 0, end: 1, insert: "era" },
        { start: 9, end: 11, insert: "" },
      ]);
      doc.edit(
        [
          { start: 0, end: 0, insert: "Great H" },
          { start: 2, end: 5, insert: "" },
        ],
        "concurrent",
        0,
      );
      expect(doc.visible).to.equal("Great Hera");
    });
    it("concurrent 2", () => {
      const doc = Document.initialize(clientId, "hello world", intents);
      doc.edit([
        { start: 0, end: 0, insert: "H" },
        { start: 1, end: 6, insert: "W" },
        { start: 7, end: 11, insert: "" },
      ]);
      doc.edit([{ start: 0, end: 5, insert: ", Brian" }]);
      doc.edit([{ start: 0, end: 5, insert: ", Dr. Evil" }], "concurrent", 1);
      // revisions
      //"hello world"
      // inserts
      // +++++++++++
      // deletes
      // ===========
      //"Hhello Wworld"
      // inserts
      // +======+=====
      // deletes
      // =+======+====
      //"Hhello, Brian Wworld"
      // inserts
      // ======+++++++=======
      // deletes
      // =============++=++++
      // deletes from union
      // =+===========+++++++
      // subtract
      // deletes
      // =============++=++++
      // subtracted deletes from union
      // =+=============+====
      // shrink
      // inserts
      // ======+++++++=======
      // old deletes from union
      // =+======+====
      expect(doc.visible).to.equal("Hello, Brian, Dr. Evil");
    });
  });
});
