/* eslint-env mocha */
// import * as fs from "fs";
// import * as path from "path";
import { expect } from "chai";
// import * as testcheck from "mocha-testcheck";
// import { check, gen } from "mocha-testcheck";
// testcheck.install();

import * as subset from "../src/subset";
import * as delta from "../src/delta";
import Engine from "../src/engine";

describe("subset", () => {
  it("lengthOf", () => {
    const s: subset.Subset = [[10, 0], [5, 1], [8, 0], [4, 1], [4, 0]];
    expect(subset.lengthOf(s)).to.equal(31);
    expect(subset.lengthOf(s, (c) => c === 0)).to.equal(22);
    expect(subset.lengthOf(s, (c) => c === 1)).to.equal(9);
  });

  it("union", () => {
    expect(subset.union([[4, 1], [4, 0]], [[8, 0]])).to.deep.equal([
      [4, 1],
      [4, 0],
    ]);
    expect(
      subset.union([[2, 1], [2, 0], [2, 1]], [[1, 0], [2, 1], [2, 0], [1, 1]]),
    ).to.deep.equal([[1, 1], [1, 2], [1, 1], [1, 0], [1, 1], [1, 2]]);
  });

  it("transform", () => {
    const s: subset.Subset = [[4, 0], [4, 1], [6, 0], [5, 1], [3, 0]];
    const t: subset.Subset = [[10, 0], [5, 1], [8, 0], [4, 1], [4, 0]];
    const expanded = subset.expand(s, t);
    const result = [[4, 0], [4, 1], [11, 0], [4, 1], [4, 0], [1, 1], [3, 0]];
    expect(expanded).to.deep.equal(result);
    expect(subset.shrink(expanded, t)).to.deep.equal(s);
  });

  describe("rebase", () => {
    it("error when mismatched", () => {
      expect(() => {
        subset.rebase([[5, 0], [1, 1]], [[1, 1], [4, 0]]);
      }).to.throw();
    });

    it("empty transform", () => {
      const s: subset.Subset = [[1, 0], [2, 1], [7, 0]];
      const t: subset.Subset = [[8, 0]];
      expect(subset.rebase(s, t)).to.deep.equal([[1, 0], [2, 1], [7, 0]]);
    });

    it("same position", () => {
      // 0 1 2 3 4 5 6 7 8 9
      //| | |x|x| | | | |     subset
      //| | |x|x| | | | |     transform
      //| | | | |x|x| | | | | result
      //| | |x|x| | | | | | | result (before = true)
      const s: subset.Subset = [[2, 0], [2, 1], [4, 0]];
      const t: subset.Subset = [[2, 0], [2, 1], [4, 0]];
      const result = [[4, 0], [2, 1], [4, 0]];
      expect(subset.rebase(s, t)).to.deep.equal(result);
      const result1 = [[2, 0], [2, 1], [6, 0]];
      expect(subset.rebase(s, t, true)).to.deep.equal(result1);
    });

    it("same position different lengths", () => {
      // 0 1 2 3 4 5 6 7 8 9
      //| | |x|x|x|x| | |     subset
      //| | |x|x| | |         transform
      //| | | | |x|x|x|x| | | result
      //| | |x|x|x|x| | | | | result (before = true)
      const s: subset.Subset = [[2, 0], [4, 1], [2, 0]];
      const t: subset.Subset = [[2, 0], [2, 1], [2, 0]];
      const result = [[4, 0], [4, 1], [2, 0]];
      expect(subset.rebase(s, t)).to.deep.equal(result);
      const result1 = [[2, 0], [4, 1], [4, 0]];
      expect(subset.rebase(s, t, true)).to.deep.equal(result1);
    });

    it("subset before", () => {
      // 0 1 2 3 4 5 6 7 8 9
      //|x| | | | | |         subset
      //| |x|x|x|x| | | | |   transform
      //|x| | | | | | | | | | result
      //|x| | | | | | | | | | result (before = true)
      const s: subset.Subset = [[1, 1], [5, 0]];
      const t: subset.Subset = [[1, 0], [4, 1], [4, 0]];
      const result = [[1, 1], [9, 0]];
      expect(subset.rebase(s, t)).to.deep.equal(result);
      expect(subset.rebase(s, t, true)).to.deep.equal(result);
    });

    it("subset before overlapping", () => {
      // 0 1 2 3 4 5 6 7 8 9
      //|x|x| | | | |         subset
      //| |x|x|x|x| | | |     transform
      //|x|x| | | | | | | | | result
      //|x|x| | | | | | | | | result (before = true)
      const s: subset.Subset = [[2, 1], [4, 0]];
      const t: subset.Subset = [[1, 0], [4, 1], [3, 0]];
      const result = [[2, 1], [8, 0]];
      expect(subset.rebase(s, t)).to.deep.equal(result);
      expect(subset.rebase(s, t, true)).to.deep.equal(result);
    });

    it("subset after", () => {
      // 0 1 2 3 4 5 6 7 8 9
      //| |x|x|x|x| | | | |   subset
      //|x| | | | | |         transform
      //| | |x|x|x|x| | | | | result
      //| | |x|x|x|x| | | | | result (before = true)
      const s: subset.Subset = [[1, 0], [4, 1], [4, 0]];
      const t: subset.Subset = [[1, 1], [5, 0]];
      const result = [[2, 0], [4, 1], [4, 0]];
      expect(subset.rebase(s, t)).to.deep.equal(result);
      expect(subset.rebase(s, t, true)).to.deep.equal(result);
    });

    it("subset after overlapping 1", () => {
      // 0 1 2 3 4 5 6 7 8 9
      //| | | | |x|x|         subset
      //| | |x|x|x|x| | |     transform
      //| | | | | | | | |x|x| result
      //| | | | | | | | |x|x| result (before = true)
      const s: subset.Subset = [[4, 0], [2, 1]];
      const t: subset.Subset = [[2, 0], [4, 1], [2, 0]];
      const result = [[8, 0], [2, 1]];
      expect(subset.rebase(s, t)).to.deep.equal(result);
      expect(subset.rebase(s, t, true)).to.deep.equal(result);
    });

    it("subset after overlapping 2", () => {
      // 0 1 2 3 4 5 6 7 8 9
      //| | |x|x| | | |       subset
      //| |x|x|x| | | | |     transform
      //| | | | | |x|x| | | | result
      //| | | | | |x|x| | | | result (before = true)
      const s: subset.Subset = [[2, 0], [2, 1], [3, 0]];
      const t: subset.Subset = [[1, 0], [3, 1], [4, 0]];
      const result = [[5, 0], [2, 1], [3, 0]];
      expect(subset.rebase(s, t)).to.deep.equal(result);
      expect(subset.rebase(s, t, true)).to.deep.equal(result);
    });

    it("subset after overlapping 3", () => {
      // 0 1 2 3 4 5 6 7 8 9
      //| |x|x|x|x| | | |     subset
      //|x|x| | | | |         transform
      //| | | |x|x|x|x| | | | result
      //| | | |x|x|x|x| | | | result (before = true)
      const s: subset.Subset = [[1, 0], [4, 1], [3, 0]];
      const t: subset.Subset = [[2, 1], [4, 0]];
      const result = [[3, 0], [4, 1], [3, 0]];
      expect(subset.rebase(s, t)).to.deep.equal(result);
      expect(subset.rebase(s, t, true)).to.deep.equal(result);
    });

    it("multiple segments", () => {
      // 0 1 2 3 4 5 6 7 8 9
      //|x| |x|x| |x| | |
      //| |x| | | |x|
      //|x| | |x|x| |x| | | | result
      //|x| |x|x| | |x| | | | result (before = true)

      const s: subset.Subset = [[1, 1], [1, 0], [2, 1], [1, 0], [1, 1], [2, 0]];
      const t: subset.Subset = [[1, 0], [1, 1], [3, 0], [1, 1]];
      const result = [[1, 1], [2, 0], [2, 1], [1, 0], [1, 1], [3, 0]];
      expect(subset.rebase(s, t)).to.deep.equal(result);
      const result1 = [[1, 1], [1, 0], [2, 1], [2, 0], [1, 1], [3, 0]];
      expect(subset.rebase(s, t, true)).to.deep.equal(result1);
    });
  });
});

describe("delta", () => {
  const d: delta.Delta = [[0, 1], "era", [9, 11]];
  const d1: delta.Delta = ["je", [2, 5]];
  const d2: delta.Delta = [[0, 4], " ", [4, 5], "n Earth"];
  const text = "hello world";
  it("apply", () => {
    expect(delta.apply(text, d)).to.equal("herald");
    expect(delta.apply(text, d1)).to.equal("jello");
    expect(delta.apply(text, d2)).to.equal("hell on Earth");
  });

  it("factor", () => {
    const [inserts, deletes] = delta.factor(d, text.length);
    expect(inserts).to.deep.equal([[1, 0], [3, 1], [10, 0]]);
    expect(deletes).to.deep.equal([[1, 0], [8, 1], [2, 0]]);
    const [inserts1, deletes1] = delta.factor(d1, text.length);
    expect(inserts1).to.deep.equal([[2, 1], [11, 0]]);
    expect(deletes1).to.deep.equal([[2, 1], [3, 0], [6, 1]]);
    const [inserts2, deletes2] = delta.factor(d2, text.length);
    expect(inserts2).to.deep.equal([[4, 0], [1, 1], [1, 0], [7, 1], [6, 0]]);
    expect(deletes2).to.deep.equal([[5, 0], [6, 1]]);
  });

  it("synthesize", () => {
    const [inserts, deletes, inserted] = delta.factor(d, text.length);
    const deletes1: subset.Subset = subset.expand(deletes, inserts);
    const union = delta.apply(
      text,
      delta.synthesize(inserted, inserts, [[subset.lengthOf(inserts), 0]]),
    );
    const text1 = subset.deleteSubset(union, subset.complement(deletes1));
    const tombstones = subset.deleteSubset(union, subset.complement(inserts));
    expect(delta.synthesize(tombstones, inserts, deletes1)).to.deep.equal(d);
    expect(delta.synthesize(text1, deletes1, inserts)).to.deep.equal([
      [0, 1],
      "ello wor",
      [4, 6],
    ]);
  });
});

describe("engine", () => {
  it("Engine.getDeletesForIndex", () => {});
  describe("Engine.edit", () => {
    it("simple edit", () => {
      const engine = new Engine("hello world");
      engine.edit([[0, 1], "era", [9, 11]]);
      expect(engine.revisions.length).to.equal(2);
      expect(engine.visible).to.equal("herald");
      expect(engine.hidden).to.equal("ello wor");
      expect(engine.deletes).to.deep.equal([[4, 0], [8, 1], [2, 0]]);
    });
    it("sequential edits", () => {
      const engine = new Engine("hello world");
      //01234567890
      //hello world
      engine.edit([[0, 1], "era", [9, 11]]);
      //01234567890123
      //herald
      //heraello world
      engine.edit([[0, 6], "ry"]);
      expect(engine.visible).to.equal("heraldry");
    });
    it("sequential edits 2", () => {
      //"Hello World"
      const engine = new Engine("hello world");
      engine.edit(["H", [1, 6], "W", [7, 11]]);
      // union string
      //"Hhello Wworld"
      // inserts
      //"Hello, Brian World"
      // =====+++++++======
      // deletes
      //"Hello World"
      // =====------
      // old deletes
      //"Hhello Wworld"
      // =-======-====
      // rebased inserts against old deletes
      //"Hhello, Brian Wworld"
      // ======+++++++=======
      // expanded deletes against old deletes
      //"Hhello Wworld"
      // ======--=----
      // expanded deletes against rebased inserts
      //"Hhello, Brian Wworld"
      // =============--=----
      // rebased current deletes against rebased inserts
      //"Hhello, Brian Wworld"
      // =-=============-====
      // union of expanded deletes and rebased current deletes
      //"Hhello, Brian Wworld"
      // =-===========-------
      engine.edit([[0, 5], ", Brian"]);
      expect(engine.visible).to.equal("Hello, Brian");
    });
    it("concurrent edits", () => {
      const engine = new Engine("hello world");
      engine.edit([[0, 1], "era", [9, 11]], 0);
      engine.edit(["je", [2, 5]], 0);
      expect(engine.visible).to.equal("jeera");
    });
  });
});
