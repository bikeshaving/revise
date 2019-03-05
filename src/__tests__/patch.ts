import * as subseq from "../subseq";
import { apply, factor, Patch, synthesize } from "../patch";
describe("patch", () => {
  const text = "hello world";
  const p0: Patch = [0, 1, "era", 9, 11];
  const p1: Patch = ["je", 2, 5, 11];
  const p2: Patch = [0, 4, " ", 4, 5, "n Earth", 11];
  const p3: Patch = [0, 6, "buddy", 11];

  test("apply", () => {
    expect(apply(text, p0)).toEqual("herald");
    expect(apply(text, p1)).toEqual("jello");
    expect(apply(text, p2)).toEqual("hell on Earth");
    expect(apply(text, p3)).toEqual("hello buddy");
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
    test("empty", () => {
      const inserted = "";
      const insertSeq: subseq.Subseq = [];
      expect(synthesize({ inserted, insertSeq })).toEqual([0]);
    });

    test("simple", () => {
      const insertSeq = [0, 3, 3, 7];
      const deleteSeq = [0, 3, 3, 3, 1];
      const result = [0, 3, "foo", 6, 9, 10];
      const inserted = "foo";
      expect(synthesize({ inserted, insertSeq, deleteSeq })).toEqual(result);
    });

    // TODO: make this a property test
    test("factored", () => {
      for (const p of [p0, p1, p2, p3]) {
        const { inserted, insertSeq, deleteSeq } = factor(p);
        expect(synthesize({ inserted, insertSeq, deleteSeq })).toEqual(p);
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
});
