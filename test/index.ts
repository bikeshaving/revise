/* eslint-env mocha */
// import * as fs from "fs";
// import * as path from "path";
import { expect } from "chai";
// import * as testcheck from "mocha-testcheck";
// import { check, gen } from "mocha-testcheck";
// testcheck.install();

import * as shredder from "../src/index";
import { Client } from "../src/index";

describe("subset", () => {
  it("lengthOf", () => {
    const s: shredder.Subset = [[10, 0], [5, 1], [8, 0], [4, 1], [4, 0]];
    expect(shredder.lengthOf(s)).to.equal(31);
    expect(shredder.lengthOf(s, (c) => c === 0)).to.equal(22);
    expect(shredder.lengthOf(s, (c) => c === 1)).to.equal(9);
  });

  it("union", () => {
    expect(shredder.union([[4, 1], [4, 0]], [[8, 0]])).to.deep.equal([
      [4, 1],
      [4, 0],
    ]);
    expect(
      shredder.union([[2, 1], [2, 0], [2, 1]], [[1, 0], [2, 1], [2, 0], [1, 1]]),
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
      const s: shredder.Subset = [[1, 1], [1, 0], [2, 1], [1, 0], [1, 1], [2, 0]];
      const t: shredder.Subset = [[1, 0], [1, 1], [3, 0], [1, 1]];
      const result = [[1, 1], [2, 0], [2, 1], [1, 0], [1, 1], [3, 0]];
      expect(shredder.rebase(s, t)).to.deep.equal(result);
      const result1 = [[1, 1], [1, 0], [2, 1], [2, 0], [1, 1], [3, 0]];
      expect(shredder.rebase(s, t, true)).to.deep.equal(result1);
    });
  });
});

describe("delta", () => {
  const d: shredder.Delta = [[0, 1], "era", [9, 11]];
  const d1: shredder.Delta = ["je", [2, 5]];
  const d2: shredder.Delta = [[0, 4], " ", [4, 5], "n Earth"];
  const text = "hello world";
  it("apply", () => {
    expect(shredder.apply(text, d)).to.equal("herald");
    expect(shredder.apply(text, d1)).to.equal("jello");
    expect(shredder.apply(text, d2)).to.equal("hell on Earth");
  });

  it("factor", () => {
    const [inserts, deletes] = shredder.factor(d, text.length);
    expect(inserts).to.deep.equal([[1, 0], [3, 1], [10, 0]]);
    expect(deletes).to.deep.equal([[1, 0], [8, 1], [2, 0]]);
    const [inserts1, deletes1] = shredder.factor(d1, text.length);
    expect(inserts1).to.deep.equal([[2, 1], [11, 0]]);
    expect(deletes1).to.deep.equal([[2, 1], [3, 0], [6, 1]]);
    const [inserts2, deletes2] = shredder.factor(d2, text.length);
    expect(inserts2).to.deep.equal([[4, 0], [1, 1], [1, 0], [7, 1], [6, 0]]);
    expect(deletes2).to.deep.equal([[5, 0], [6, 1]]);
  });

  it("synthesize", () => {
    const [inserts, deletes, inserted] = shredder.factor(d, text.length);
    const deletes1: shredder.Subset = shredder.expand(deletes, inserts);
    const union = shredder.apply(text, shredder.synthesize(inserted, inserts));
    const text1 = shredder.deleteSubset(union, shredder.complement(deletes1));
    const tombstones = shredder.deleteSubset(union, shredder.complement(inserts));
    expect(shredder.synthesize(tombstones, inserts, deletes1)).to.deep.equal(d);
    expect(shredder.synthesize(text1, deletes1, inserts)).to.deep.equal([
      [0, 1],
      "ello wor",
      [4, 6],
    ]);
  });
});

describe("Client", () => {
  describe("Client.getDeletesForIndex", () => {
    it("get deletes for all points in history", () => {
      const client = new Client("hello world");
      client.sources = ["concurrent"];
      //"hello world"
      // ===========
      //"Hhello Wworld"
      // =+======+====
      //"Hhello, Brian Wworld"
      // =+===========+++++++
      //"Hhello, Brian, Dr. Evil Wworld"
      // =+=====================+++++++
      client.edit(["H", [1, 6], "W", [7, 11]]);
      client.edit([[0, 5], ", Brian"]);
      client.edit([[0, 5], ", Dr. Evil"], 1, "concurrent");
      const deletes = [[11, 0]];
      expect(client.getDeletesForIndex(0)).to.deep.equal(deletes);
      const deletes1 = [[1, 0], [1, 1], [6, 0], [1, 1], [4, 0]];
      expect(client.getDeletesForIndex(1)).to.deep.equal(deletes1);
      const deletes2 = [[1, 0], [1, 1], [11, 0], [7, 1]];
      expect(client.getDeletesForIndex(2)).to.deep.equal(deletes2);
      const deletes3 = [[1, 0], [1, 1], [21, 0], [2, 2], [1, 1], [4, 2]];
      expect(client.getDeletesForIndex(3)).to.deep.equal(deletes3);
      expect(client.getDeletesForIndex(3)).to.deep.equal(client.deletes);
    });
  });
  describe("Client.edit", () => {
    it("simple edit", () => {
      const client = new Client("hello world");
      client.edit([[0, 1], "era", [9, 11]]);
      expect(client.revisions.length).to.equal(2);
      expect(client.visible).to.equal("herald");
      expect(client.hidden).to.equal("ello wor");
      expect(client.deletes).to.deep.equal([[4, 0], [8, 1], [2, 0]]);
    });
    it("sequential edits 1", () => {
      const client = new Client("hello world");
      //"hello world"
      // inserts
      // =+++==
      //"herald"
      // deletes
      // =++++++++==
      //"hello world"
      client.edit([[0, 1], "era", [9, 11]]);
      client.edit([[0, 6], "ry"]);
      expect(client.visible).to.equal("heraldry");
    });
    it("sequential edits 2", () => {
      const client = new Client("hello world");
      client.edit(["H", [1, 6], "W", [7, 11]]);
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
      client.edit([[0, 5], ", Brian"]);
      expect(client.visible).to.equal("Hello, Brian");
    });
    it("concurrent edits 1", () => {
      const client = new Client("hello world");
      client.sources = ["concurrent"];
      client.edit([[0, 1], "era", [9, 11]]);
      client.edit(["Great H", [2, 5]], 0, "concurrent");
      expect(client.visible).to.equal("Great Hera");
    });
    it("concurrent edits 2", () => {
      const client = new Client("hello world");
      client.sources = ["concurrent"];
      client.edit(["H", [1, 6], "W", [7, 11]]);
      client.edit([[0, 5], ", Brian"]);
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
      client.edit([[0, 5], ", Dr. Evil"], 1, "concurrent");
      expect(client.visible).to.equal("Hello, Brian, Dr. Evil");
    });
  });
});
