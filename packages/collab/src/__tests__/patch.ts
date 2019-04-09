import * as subseq from "../subseq";
import {
  apply,
  build,
  factor,
  meld,
  operations,
  Patch,
  synthesize,
} from "../patch";
describe("patch", () => {
  const text = "hello world";
  const p0: Patch = [0, 1, "era", 9, 11];
  const p1: Patch = ["je", 2, 5, 11];
  const p2: Patch = [0, 4, " ", 4, 5, "n Earth", 11];
  const p3: Patch = [0, 6, "buddy", 11];

  describe("apply", () => {
    test("apply", () => {
      expect(apply(text, p0)).toEqual("herald");
      expect(apply(text, p1)).toEqual("jello");
      expect(apply(text, p2)).toEqual("hell on Earth");
      expect(apply(text, p3)).toEqual("hello buddy");
    });
  });

  describe("operations", () => {
    test("operations", () => {
      expect(Array.from(operations(p0))).toEqual([
        { type: "retain", start: 0, end: 1 },
        { type: "insert", start: 1, inserted: "era" },
        { type: "delete", start: 1, end: 9 },
        { type: "retain", start: 9, end: 11 },
      ]);
      expect(Array.from(operations(p1))).toEqual([
        { type: "insert", start: 0, inserted: "je" },
        { type: "delete", start: 0, end: 2 },
        { type: "retain", start: 2, end: 5 },
        { type: "delete", start: 5, end: 11 },
      ]);
      expect(Array.from(operations(p2))).toEqual([
        { type: "retain", start: 0, end: 4 },
        { type: "insert", start: 4, inserted: " " },
        { type: "retain", start: 4, end: 5 },
        { type: "insert", start: 5, inserted: "n Earth" },
        { type: "delete", start: 5, end: 11 },
      ]);
      expect(Array.from(operations(p3))).toEqual([
        { type: "retain", start: 0, end: 6 },
        { type: "insert", start: 6, inserted: "buddy" },
        { type: "delete", start: 6, end: 11 },
      ]);
    });
  });

  describe("factor", () => {
    test("factor 1", () => {
      const { insertSeq, deleteSeq } = factor(p0);
      expect(insertSeq).toEqual([0, 1, 3, 10]);
      expect(deleteSeq).toEqual([0, 1, 8, 2]);
    });

    test("factor 2", () => {
      const { insertSeq, deleteSeq } = factor(p1);
      expect(insertSeq).toEqual([1, 2, 11]);
      expect(deleteSeq).toEqual([1, 2, 3, 6]);
    });

    test("factor 3", () => {
      const { insertSeq, deleteSeq } = factor(p2);
      expect(insertSeq).toEqual([0, 4, 1, 1, 7, 6]);
      expect(deleteSeq).toEqual([0, 5, 6]);
    });

    test("factor 4", () => {
      const { insertSeq, deleteSeq } = factor(p3);
      expect(insertSeq).toEqual([0, 6, 5, 5]);
      expect(deleteSeq).toEqual([0, 6, 5]);
    });
  });

  describe("synthesize", () => {
    test("mismatched inserted and insertSeq throws", () => {
      expect(() => {
        synthesize({ inserted: "foo", insertSeq: [0, 2, 2] });
      }).toThrow();
    });

    test("insertions after deletions are normalized", () => {
      const inserted = "bro";
      const insertSeq = [0, 11, 3];
      const deleteSeq = [0, 6, 5];
      const patch = synthesize({ inserted, insertSeq, deleteSeq });
      expect(patch).toEqual([0, 6, "bro", 11]);
      expect(factor(patch)).toEqual({
        inserted: "bro",
        insertSeq: [0, 6, 3, 5],
        deleteSeq: [0, 6, 5],
      });
    });

    test("empty", () => {
      expect(synthesize({ inserted: "", insertSeq: [] })).toEqual([0]);
    });

    test("simple", () => {
      const inserted = "foo";
      const insertSeq = [0, 3, 3, 7];
      const deleteSeq = [0, 3, 3, 3, 1];
      const result = [0, 3, "foo", 6, 9, 10];
      expect(synthesize({ inserted, insertSeq, deleteSeq })).toEqual(result);
    });

    test("deletions only", () => {
      const deleteSeq = [0, 1, 3, 1, 1, 2, 3];
      expect(synthesize({ deleteSeq })).toEqual([0, 1, 4, 5, 6, 8, 11]);
    });

    // TODO: make this a property test
    test("factored", () => {
      for (const p of [p0, p1, p2, p3]) {
        expect(synthesize(factor(p))).toEqual(p);
      }
    });

    test("apply", () => {
      const { inserted, insertSeq, deleteSeq } = factor(p0);
      const combined = apply(text, synthesize({ inserted, insertSeq }));
      const inserted1 = apply(
        combined,
        synthesize({
          inserted: "",
          insertSeq: subseq.clear(insertSeq),
          deleteSeq: subseq.complement(insertSeq),
        }),
      );
      expect(inserted).toEqual(inserted1);
      const deleteSeq1 = subseq.expand(deleteSeq, insertSeq);
      const deleted = apply(
        combined,
        synthesize({
          inserted: "",
          insertSeq: subseq.clear(deleteSeq1),
          deleteSeq: subseq.complement(deleteSeq1),
        }),
      );
      const result = [0, 1, "ello wor", 4, 6];
      expect(
        synthesize({
          inserted: deleted,
          insertSeq: deleteSeq1,
          deleteSeq: subseq.shrink(insertSeq, deleteSeq1),
        }),
      ).toEqual(result);
    });
  });

  describe("build/meld", () => {
    test("comprehensive", () => {
      let patch = build(5, 6, "__", 11);
      let patch1: Patch;
      expect(patch).toEqual([0, 5, "__", 6, 11]);
      patch1 = build(0, 5, "Hi", 12);
      expect(patch1).toEqual(["Hi", 5, 12]);
      patch = meld(patch, patch1);
      expect(patch).toEqual(["Hi__", 6, 11]);
      patch1 = build(0, 4, "", 9);
      expect(patch1).toEqual([4, 9]);
      patch = meld(patch, patch1);
      expect(patch).toEqual([6, 11]);
      patch1 = build(3, 5, "m", 5);
      expect(patch1).toEqual([0, 3, "m", 5]);
      patch = meld(patch, patch1);
      expect(patch).toEqual([6, 9, "m", 11]);
      patch1 = build(0, 0, "goodbye ", 4);
      expect(patch1).toEqual(["goodbye ", 0, 4]);
      patch = meld(patch, patch1);
      expect(patch).toEqual(["goodbye ", 6, 9, "m", 11]);
    });
  });
});
