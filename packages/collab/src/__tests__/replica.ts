import { Replica } from "../Replica";

describe("Replica", () => {
  describe("Replica.hiddenSeqAt", () => {
    test("comprehensive", () => {
      const replica = new Replica("client1");
      replica.edit(["hello world", 0]);
      replica.edit(["H", 1, 6, "W", 7, 11]);
      replica.edit([0, 5, ", Brian", 11]);
      replica.edit([0, 5, ", Dr. Evil", 11], 1, 1);
      expect(replica.hiddenSeqAt(0)).toEqual([]);
      expect(replica.hiddenSeqAt(1)).toEqual([0, 11]);
      expect(replica.hiddenSeqAt(2)).toEqual([0, 1, 1, 6, 1, 4]);
      expect(replica.hiddenSeqAt(3)).toEqual([0, 1, 1, 11, 7]);
      expect(replica.hiddenSeqAt(4)).toEqual([0, 1, 1, 21, 7]);
      expect(replica.hiddenSeqAt(4)).toEqual(replica.snapshot.hiddenSeq);
    });
  });

  describe("Replica.snapshotAt", () => {
    test("comprehensive", () => {
      const replica = new Replica("client1");
      replica.edit(["hello world", 0]);
      replica.edit(["H", 1, 6, "W", 7, 11]);
      replica.edit([0, 5, ", Brian", 11]);
      replica.edit([0, 5, ", Dr. Evil", 11], 1, 1);
      expect(replica.snapshotAt(1)).toEqual({
        visible: "hello world",
        hidden: "",
        hiddenSeq: [0, 11],
      });
      expect(replica.snapshotAt(2)).toEqual({
        visible: "Hello World",
        hidden: "hw",
        hiddenSeq: [0, 1, 1, 6, 1, 4],
      });
      expect(replica.snapshotAt(3)).toEqual({
        visible: "Hello, Brian",
        hidden: "h Wworld",
        hiddenSeq: [0, 1, 1, 11, 7],
      });
      expect(replica.snapshotAt(4)).toEqual({
        visible: "Hello, Brian, Dr. Evil",
        hidden: "h Wworld",
        hiddenSeq: [0, 1, 1, 21, 7],
      });
      expect(replica.snapshotAt(4)).toEqual(replica.snapshot);
    });
  });

  describe("patchAt", () => {
    test("comprehensive", () => {
      const replica = new Replica("client1");
      replica.edit(["hello world", 0]);
      replica.edit([0, 11, "!", 11]);
      replica.edit([0, 5, "_", 6, 12]);
      replica.edit([0, 11, 12]);
      expect(replica.patchAt(0)).toEqual(["hello world", 0]);
      expect(replica.patchAt(1)).toEqual([0, 11, "!", 11]);
      expect(replica.patchAt(2)).toEqual([0, 5, "_", 6, 12]);
      expect(replica.patchAt(3)).toEqual([0, 11, 12]);
    });
  });

  describe("Replica.edit", () => {
    test("simple", () => {
      const replica = new Replica("client1");
      replica.edit(["hello world", 0]);
      replica.edit([0, 1, "era", 9, 11]);
      expect(replica.snapshot).toEqual({
        visible: "herald",
        hidden: "ello wor",
        hiddenSeq: [0, 4, 8, 2],
      });
    });

    test("sequential 1", () => {
      const replica = new Replica("client1");
      replica.edit(["hello world", 0]);
      replica.edit([0, 1, "era", 9, 11]);
      replica.edit([0, 6, "ry", 6]);
      expect(replica.snapshot.visible).toEqual("heraldry");
    });

    test("sequential 2", () => {
      const replica = new Replica("client1");
      replica.edit(["hello world", 0]);
      replica.edit(["H", 1, 6, "W", 7, 11]);
      replica.edit([0, 5, ", Brian", 11]);
      expect(replica.snapshot.visible).toEqual("Hello, Brian");
    });

    test("concurrent 1", () => {
      const replica = new Replica("client1");
      replica.edit(["hello world", 0]);
      replica.edit([6, 11]);
      replica.edit(["hello ", 0, 5]);
      replica.edit(["goodbye ", 6, 11], 1, 1);
      expect(replica.snapshot.visible).toEqual("goodbye hello world");
    });

    test("concurrent 2", () => {
      const replica = new Replica("client1");
      replica.edit(["hello world", 0]);
      replica.edit([0, 1, "era", 9, 11]);
      replica.edit(["Great H", 2, 5, 11], 1, 1);
      expect(replica.snapshot.visible).toEqual("Great Hera");
    });

    test("concurrent 3", () => {
      const replica = new Replica("client1");
      replica.edit(["hello world", 0]);
      replica.edit(["H", 1, 6, "W", 7, 11]);
      replica.edit([0, 5, ", Brian", 11]);
      replica.edit([0, 5, ", Dr. Evil", 11], 1, 2);
      expect(replica.snapshot.visible).toEqual("Hello, Brian, Dr. Evil");
    });

    test("concurrent 4", () => {
      const replica = new Replica("client1");
      replica.edit(["hello world", 0]);
      replica.edit([6, 11]);
      replica.edit(["hey ", 0, 5]);
      replica.edit(["goodbye ", 6, 11], 1, 1);
      expect(replica.snapshot).toEqual({
        visible: "goodbye hey world",
        hidden: "hello ",
        hiddenSeq: [0, 8, 6, 9],
      });
    });

    test("concurrent 5", () => {
      const replica = new Replica("client1");
      replica.edit(["hello world", 0]);
      replica.edit([6, 11]);
      replica.edit(["hey ", 0, 5], 1);
      replica.edit(["goodbye ", 0, 5], 0, 2);
      expect(replica.snapshot).toEqual({
        visible: "goodbye hey world",
        hidden: "hello ",
        hiddenSeq: [1, 6, 17],
      });
    });

    test("concurrent 6", () => {
      const replica = new Replica("client1");
      replica.edit(["hello world", 0]);
      replica.edit([6, 11]);
      replica.edit(["hey ", 0, 5]);
      replica.edit(["goodbye ", 6, 11], 1, 1);
      expect(replica.snapshot).toEqual({
        visible: "goodbye hey world",
        hidden: "hello ",
        hiddenSeq: [0, 8, 6, 9],
      });
    });

    test("concurrent 7", () => {
      const replica = new Replica("client1");
      replica.edit(["hello world", 0]);
      //"hello world"
      // ===========++++
      replica.edit(["why ", 0, 5, " there", 5, 11, "s", 11]);
      // ++++=====++++++======+
      //"why hello there worlds"
      replica.edit([0, 11, "star", 11], 1, 1);
      // ======================++++
      //"why hello there worldsstar"
      expect(replica.snapshot.visible).toEqual("why hello there worldsstar");
    });
  });

  describe("Replica.ingest", () => {
    test("simple 1", () => {
      const replica1 = new Replica("client1");
      replica1.edit(["hello world", 0]);
      const [rev1] = replica1.pending();
      replica1.ingest(rev1, -1);
      const replica2 = replica1.clone("client2");
      replica1.edit(["goodbye", 5, 11]);
      replica1.edit([0, 13, "s", 13]);
      replica2.edit([0, 5, "_", 6, 11]);
      const [rev2] = replica2.pending();
      replica1.ingest(rev2, 0);
      expect(replica1.snapshot).toEqual({
        visible: "goodbye_worlds",
        hidden: "hello ",
        hiddenSeq: [0, 7, 5, 1, 1, 6],
      });
      expect(replica1.hiddenSeqAt(1)).toEqual([0, 11]);
    });

    test("simple 2", () => {
      const replica1 = new Replica("client1");
      replica1.edit(["hello world", 0]);
      const [rev1] = replica1.pending();
      replica1.ingest(rev1, -1);
      const replica2 = replica1.clone("client2");
      replica1.edit(["goodbye", 5, 11]);
      const [rev2] = replica1.pending();
      replica1.ingest(rev2, 0);
      replica2.ingest(rev2, 0);
      replica2.edit([0, 7, "hello", 7, 13]);
      const [rev3] = replica2.pending();
      replica1.ingest(rev3, 1);
      expect(replica1.snapshot).toEqual({
        visible: "goodbyehello world",
        hidden: "hello",
        hiddenSeq: [0, 7, 5, 11],
      });
      expect(replica1.hiddenSeqAt(1)).toEqual([0, 11]);
    });

    test("concurrent 1", () => {
      const replica1 = new Replica("client1");
      replica1.edit(["hello world", 0]);
      const [rev1] = replica1.pending();
      replica1.ingest(rev1, -1);
      const replica2 = replica1.clone("client2");
      replica1.edit(["H", 1, 6, "W", 7, 11]);
      replica1.edit([0, 5, 6, 11]);
      replica2.edit([0, 5, "_", 6, 11, "!", 11]);
      replica2.edit([0, 11, 12]);
      const pending1 = replica1.pending();
      const pending2 = replica2.pending();
      for (const rev of pending1) {
        replica1.ingest(rev, 0);
        replica2.ingest(rev, 0);
      }
      for (const rev of pending2) {
        replica1.ingest(rev, 0);
        replica2.ingest(rev, 0);
      }
      expect(replica1.snapshot).toEqual(replica2.snapshot);
      expect(replica1.hiddenSeqAt(1)).toEqual([0, 11]);
    });

    test("concurrent 2", () => {
      const replica1 = new Replica("client1");
      replica1.edit(["hello world", 0]);
      const [rev1] = replica1.pending();
      replica1.ingest(rev1, -1);
      const replica2 = replica1.clone("client2");
      replica1.edit(["H", 1, 6, "W", 7, 11]);
      replica1.edit([0, 5, 6, 11]);
      replica2.edit([0, 5, "_", 6, 11, "!", 11]);
      replica2.edit([0, 11, 12]);
      const pending1 = replica1.pending();
      const pending2 = replica2.pending();
      for (const rev of pending2) {
        replica1.ingest(rev, 0);
        replica2.ingest(rev, 0);
      }
      for (const rev of pending1) {
        replica1.ingest(rev, 0);
        replica2.ingest(rev, 0);
      }
      expect(replica1.snapshot).toEqual(replica2.snapshot);
      expect(replica1.hiddenSeqAt(1)).toEqual([0, 11]);
    });

    test("concurrent 3", () => {
      const replica1 = new Replica("client1");
      replica1.edit(["hello world", 0]);
      const [rev1] = replica1.pending();
      replica1.ingest(rev1, -1);
      const replica2 = replica1.clone("client2");
      replica1.edit(["H", 1, 6, "W", 7, 11]);
      replica1.edit([0, 5, "-", 6, 11]);
      replica2.edit([0, 5, "__", 6, 11, "!", 11]);
      replica2.edit(["hey", 6, 13]);
      const pending1 = replica1.pending();
      const pending2 = replica2.pending();
      for (const rev of pending1) {
        replica1.ingest(rev, 0);
        replica2.ingest(rev, 0);
      }
      for (const rev of pending2) {
        replica1.ingest(rev, 0);
        replica2.ingest(rev, 0);
      }
      expect(replica1.snapshot).toEqual(replica2.snapshot);
      expect(replica1.hiddenSeqAt(1)).toEqual([0, 11]);
    });

    test("concurrent 4", () => {
      const replica1 = new Replica("client1");
      replica1.edit(["hello world", 0]);
      const [rev1] = replica1.pending();
      replica1.ingest(rev1, -1);
      const replica2 = replica1.clone("client2");
      replica1.edit(["H", 1, 6, "W", 7, 11]);
      replica1.edit([0, 5, "-", 6, 11]);
      replica2.edit([0, 5, "__", 6, 11, "!", 11]);
      replica2.edit(["hey", 6, 13]);
      const pending1 = replica1.pending();
      const pending2 = replica2.pending();
      for (const rev of pending2) {
        replica1.ingest(rev, 0);
        replica2.ingest(rev, 0);
      }
      for (const rev of pending1) {
        replica1.ingest(rev, 0);
        replica2.ingest(rev, 0);
      }
      expect(replica1.snapshot).toEqual(replica2.snapshot);
      expect(replica1.hiddenSeqAt(1)).toEqual([0, 11]);
    });

    test("concurrent 5", () => {
      const replica1 = new Replica("client1");
      replica1.edit(["abij", 0]);
      for (const rev of replica1.pending()) {
        replica1.ingest(rev, -1);
      }
      const replica2 = replica1.clone("client2");
      replica1.edit([0, 2, "d", 2, 4]);
      replica1.edit([0, 2, "c", 2, 5]);
      replica2.edit([0, 2, "efgh", 2, 4]);
      const pending1 = replica1.pending();
      const pending2 = replica2.pending();
      for (const rev of pending1) {
        replica1.ingest(rev, 0);
        replica2.ingest(rev, 0);
      }
      for (const rev of pending2) {
        replica1.ingest(rev, 0);
        replica2.ingest(rev, 0);
      }
      expect(replica1.snapshot.visible).toEqual("abcdefghij");
      expect(replica1.snapshot).toEqual(replica2.snapshot);
      expect(replica1.hiddenSeqAt(1)).toEqual([0, 4]);
    });

    test("concurrent 6", () => {
      const replica1 = new Replica("client1");
      replica1.edit(["abij", 0]);
      for (const rev of replica1.pending()) {
        replica1.ingest(rev, -1);
      }
      const replica2 = replica1.clone("client2");
      replica1.edit([0, 2, "d", 2, 4]);
      replica1.edit([0, 2, "c", 2, 5]);
      replica2.edit([0, 2, "efgh", 2, 4]);
      const pending1 = replica1.pending();
      const pending2 = replica2.pending();
      for (const rev of pending2) {
        replica1.ingest(rev, 0);
        replica2.ingest(rev, 0);
      }
      for (const rev of pending1) {
        replica1.ingest(rev, 0);
        replica2.ingest(rev, 0);
      }
      expect(replica1.snapshot.visible).toEqual("abcdefghij");
      expect(replica1.snapshot).toEqual(replica2.snapshot);
      expect(replica1.hiddenSeqAt(1)).toEqual([0, 4]);
    });

    // TODO: add tests which tests ingest between more than two clients
    // TODO: add tests which edit replicas and ingest revisions in a different order
  });
});
