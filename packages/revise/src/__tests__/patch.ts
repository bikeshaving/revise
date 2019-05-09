import * as subseq from "../subseq";
import {
  apply,
  build,
  factor,
  operations,
  Patch,
  squash,
  synthesize,
} from "../patch";
import { apply as snapshotApply, Snapshot } from "../snapshot";

describe("patch", () => {
  const text = "hello world";
  const p1: Patch = [0, 1, "era", 9, 11];
  const p2: Patch = ["je", 2, 5, 11];
  const p3: Patch = [0, 4, " ", 4, 5, "n Earth", 11];
  const p4: Patch = [0, 6, "buddy", 11];
  const p5: Patch = [0, 5, -1, "_", 5, 11];

  describe("apply", () => {
    test("apply 1", () => {
      expect(apply(text, p1)).toEqual("herald");
    });

    test("apply 2", () => {
      expect(apply(text, p2)).toEqual("jello");
    });

    test("apply 3", () => {
      expect(apply(text, p3)).toEqual("hell on Earth");
    });

    test("apply 4", () => {
      expect(apply(text, p4)).toEqual("hello buddy");
    });

    test("apply 5", () => {
      expect(apply(text, p5)).toEqual(text);
    });

    test("toggle", () => {
      const patch = ["H", -1, "h", 0, "ello W", -1, "w", 0, "orld", 0];
      expect(apply("", patch)).toEqual("Hello World");
    });
  });

  describe("operations", () => {
    test("operations 1", () => {
      expect(Array.from(operations(p1))).toEqual([
        { type: "retain", start: 0, end: 1 },
        { type: "insert", start: 1, inserted: "era" },
        { type: "delete", start: 1, end: 9 },
        { type: "retain", start: 9, end: 11 },
      ]);
    });

    test("operations 2", () => {
      expect(Array.from(operations(p2))).toEqual([
        { type: "insert", start: 0, inserted: "je" },
        { type: "delete", start: 0, end: 2 },
        { type: "retain", start: 2, end: 5 },
        { type: "delete", start: 5, end: 11 },
      ]);
    });

    test("operations 3", () => {
      expect(Array.from(operations(p3))).toEqual([
        { type: "retain", start: 0, end: 4 },
        { type: "insert", start: 4, inserted: " " },
        { type: "retain", start: 4, end: 5 },
        { type: "insert", start: 5, inserted: "n Earth" },
        { type: "delete", start: 5, end: 11 },
      ]);
    });

    test("operations 4", () => {
      expect(Array.from(operations(p4))).toEqual([
        { type: "retain", start: 0, end: 6 },
        { type: "insert", start: 6, inserted: "buddy" },
        { type: "delete", start: 6, end: 11 },
      ]);
    });

    test("operations 5", () => {
      expect(Array.from(operations(p5))).toEqual([
        { type: "retain", start: 0, end: 5 },
        { type: "toggle", start: 5, inserted: "_" },
        { type: "retain", start: 5, end: 11 },
      ]);
    });
  });

  describe("factor", () => {
    test("factor 1", () => {
      expect(factor(p1)).toEqual({
        inserted: "era",
        insertSeq: [1, 3, 10],
        deleteSeq: [4, 8, 2],
      });
    });

    test("factor 2", () => {
      expect(factor(p2)).toEqual({
        inserted: "je",
        insertSeq: [0, 2, 11],
        deleteSeq: [2, 2, 3, 6],
      });
    });

    test("factor 3", () => {
      expect(factor(p3)).toEqual({
        inserted: " n Earth",
        insertSeq: [4, 1, 1, 7, 6],
        deleteSeq: [13, 6],
      });
    });

    test("factor 4", () => {
      expect(factor(p4)).toEqual({
        inserted: "buddy",
        insertSeq: [6, 5, 5],
        deleteSeq: [11, 5],
      });
    });

    test("factor 5", () => {
      expect(factor(p5)).toEqual({
        inserted: "_",
        insertSeq: [5, 1, 6],
        deleteSeq: [5, 1, 6],
      });
    });
  });

  describe("synthesize", () => {
    test("mismatched inserted and insertSeq throws", () => {
      expect(() => {
        synthesize({ inserted: "foo", insertSeq: [2, 2] });
      }).toThrow();
    });

    test("insertions after deletions", () => {
      const inserted = "bro";
      const insertSeq = [11, 3];
      const deleteSeq = [6, 5, 3];
      const patch = synthesize({ inserted, insertSeq, deleteSeq });
      expect(patch).toEqual([0, 6, 11, "bro", 11]);
      expect(factor(patch)).toEqual({ inserted, insertSeq, deleteSeq });
    });

    test("empty", () => {
      expect(synthesize({ inserted: "", insertSeq: [] })).toEqual([0]);
    });

    test("simple", () => {
      const inserted = "foo";
      const insertSeq = [3, 3, 7];
      const deleteSeq = [6, 3, 3, 1];
      const result = [0, 3, "foo", 6, 9, 10];
      expect(synthesize({ inserted, insertSeq, deleteSeq })).toEqual(result);
    });

    test("deletions only", () => {
      const deleteSeq = [1, 3, 1, 1, 2, 3];
      expect(synthesize({ deleteSeq })).toEqual([0, 1, 4, 5, 6, 8, 11]);
    });

    test("intersecting", () => {
      const inserted = "goodbyes";
      const insertSeq = [0, 7, 11, 1];
      const deleteSeq = [4, 3, 12];
      const result = ["good", -1, "bye", 0, 11, "s", 11];
      expect(synthesize({ inserted, insertSeq, deleteSeq })).toEqual(result);
    });

    // TODO: make this a property test
    test("factored", () => {
      for (const p of [p1, p2, p3, p4, p5]) {
        expect(synthesize(factor(p))).toEqual(p);
      }
    });

    test("apply", () => {
      const { inserted, insertSeq, deleteSeq } = factor(p1);
      const merged = apply(text, synthesize({ inserted, insertSeq }));
      const inserted1 = apply(
        merged,
        synthesize({
          inserted: "",
          insertSeq: subseq.clear(insertSeq),
          deleteSeq: subseq.complement(insertSeq),
        }),
      );
      expect(inserted).toEqual(inserted1);
      const deleted = apply(
        merged,
        synthesize({
          inserted: "",
          insertSeq: subseq.clear(deleteSeq),
          deleteSeq: subseq.complement(deleteSeq),
        }),
      );
      const result = [0, 1, 4, "ello wor", 4, 6];
      expect(
        synthesize({
          inserted: deleted,
          insertSeq: deleteSeq,
          deleteSeq: insertSeq,
        }),
      ).toEqual(result);
    });
  });

  describe("squash", () => {
    test("squashed patches produce same result as unsquashed patches 1", () => {
      const snapshot: Snapshot = {
        visible: "a1f",
        hidden: "",
        hiddenSeq: [3],
      };
      const patches: Patch[] = [[0, 2, "d", 2, 3], [0, 1, "s", 2, 4]];
      const snapshot1 = patches.reduce(snapshotApply, snapshot);
      expect(snapshot1).toEqual({
        visible: "asdf",
        hidden: "1",
        hiddenSeq: [2, 1, 2],
      });
      const squashed = squash(patches[0], patches[1]);
      expect(snapshotApply(snapshot, squashed)).toEqual(snapshot1);
    });

    test("squashed patches produce same result as unsquashed patches 2", () => {
      const snapshot: Snapshot = {
        visible: "hello world",
        hidden: "",
        hiddenSeq: [11],
      };
      const patches: Patch[] = [["H", 1, 6, "W", 7, 11], [0, 6, 7, 13]];
      const snapshot1 = patches.reduce(snapshotApply, snapshot);
      expect(snapshot1).toEqual({
        visible: "HelloWorld",
        hidden: "h w",
        hiddenSeq: [1, 1, 4, 1, 1, 1, 4],
      });
      const squashed = squash(patches[0], patches[1]);
      expect(snapshotApply(snapshot, squashed)).toEqual(snapshot1);
    });

    // gotta start keeping track of a hiddenSeq if we want this test to work
    // TODO: unskip
    test.skip("build", () => {
      let patch = build(5, 6, "__", 11);
      let patch1: Patch;
      expect(patch).toEqual([0, 5, "__", 6, 11]);
      patch1 = build(0, 5, "Hi", 12);
      expect(patch1).toEqual(["Hi", 5, 12]);
      patch = squash(patch, patch1);
      expect(patch).toEqual(["Hi__", 6, 11]);
      patch1 = build(0, 4, "", 9);
      expect(patch1).toEqual([4, 9]);
      patch = squash(patch, patch1);
      expect(patch).toEqual([6, 11]);
      patch1 = build(3, 5, "m", 5);
      expect(patch1).toEqual([0, 3, "m", 5]);
      patch = squash(patch, patch1);
      expect(patch).toEqual([6, 9, "m", 11]);
      patch1 = build(0, 0, "goodbye ", 4);
      expect(patch1).toEqual(["goodbye ", 0, 4]);
      patch = squash(patch, patch1);
      expect(patch).toEqual(["goodbye ", 6, 9, "m", 11]);
    });
  });
});