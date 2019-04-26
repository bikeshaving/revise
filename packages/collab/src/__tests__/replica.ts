import { Replica } from "../replica";

describe("Replica", () => {
  describe("Replica.hiddenSeqAt", () => {
    test("edits", () => {
      const replica = new Replica("client1");
      replica.edit(["hello world", 0]);
      replica.edit(["H", 1, 6, "W", 7, 11]);
      replica.edit([0, 5, ", Brian", 11]);
      replica.edit([0, 5, ", Dr. Evil", 11], { change: 0 });
      expect(replica.hiddenSeqAt(-1, -1)).toEqual([]);
      expect(replica.hiddenSeqAt(-1, 0)).toEqual([0, 11]);
      expect(replica.hiddenSeqAt(-1, 1)).toEqual([0, 1, 1, 6, 1, 4]);
      expect(replica.hiddenSeqAt(-1, 2)).toEqual([0, 1, 1, 11, 7]);
      expect(replica.hiddenSeqAt(-1, 3)).toEqual([0, 1, 1, 21, 7]);
      expect(replica.hiddenSeqAt(-1, 3)).toEqual(replica.snapshot.hiddenSeq);
    });
  });

  describe("Replica.snapshotAt", () => {
    test("edits", () => {
      const replica = new Replica("client1");
      replica.edit(["hello world", 0]);
      replica.edit(["H", 1, 6, "W", 7, 11]);
      replica.edit([0, 5, ", Brian", 11]);
      replica.edit([0, 5, ", Dr. Evil", 11], { change: 0 });
      expect(replica.snapshotAt(-1, -1)).toEqual({
        visible: "",
        hidden: "",
        hiddenSeq: [],
      });
      expect(replica.snapshotAt(-1, 0)).toEqual({
        visible: "hello world",
        hidden: "",
        hiddenSeq: [0, 11],
      });
      expect(replica.snapshotAt(-1, 1)).toEqual({
        visible: "Hello World",
        hidden: "hw",
        hiddenSeq: [0, 1, 1, 6, 1, 4],
      });
      expect(replica.snapshotAt(-1, 2)).toEqual({
        visible: "Hello, Brian",
        hidden: "h Wworld",
        hiddenSeq: [0, 1, 1, 11, 7],
      });
      expect(replica.snapshotAt(-1, 3)).toEqual({
        visible: "Hello, Brian, Dr. Evil",
        hidden: "h Wworld",
        hiddenSeq: [0, 1, 1, 21, 7],
      });
      expect(replica.snapshotAt(-1, 3)).toEqual(replica.snapshot);
    });

    test("edits and ingests 1", () => {
      const replica1 = new Replica("client1");
      const replica2 = new Replica("client2");
      replica1.edit(["hello world", 0]);
      let version = 0;
      for (const message of replica1.pending()) {
        replica1.ingest({ ...message, version });
        replica2.ingest({ ...message, version });
        version++;
      }
      replica2.edit([0, 5, "_", 6, 11, "!", 11]);
      replica2.edit([0, 11, 12]);
      for (const message of replica2.pending()) {
        replica1.ingest({ ...message, version });
        replica2.ingest({ ...message, version });
        version++;
      }
      replica1.edit(["H", 1, 6, "W", 7, 11], { commit: -1, change: 0 });
      replica1.edit([0, 5, 6, 11], { commit: 0, change: 1 });
      for (const message of replica1.pending()) {
        replica1.ingest({ ...message, version });
        replica2.ingest({ ...message, version });
        version++;
      }

      expect(replica1.snapshotAt(-1, -1)).toEqual({
        visible: "",
        hidden: "",
        hiddenSeq: [],
      });
      expect(replica1.snapshotAt(-1, 0)).toEqual({
        visible: "hello world",
        hidden: "",
        hiddenSeq: [0, 11],
      });
      expect(replica1.snapshotAt(-1, 1)).toEqual({
        visible: "Hello World",
        hidden: "hw",
        hiddenSeq: [0, 1, 1, 6, 1, 4],
      });
      expect(replica1.snapshotAt(-1, 2)).toEqual({
        visible: "HelloWorld",
        hidden: "h w",
        hiddenSeq: [0, 1, 1, 4, 1, 1, 1, 4],
      });
      expect(replica1.snapshotAt(0, -1)).toEqual({
        visible: "hello world",
        hidden: "",
        hiddenSeq: [0, 11],
      });
      expect(replica1.snapshotAt(0, 0)).toEqual({
        visible: "hello world",
        hidden: "",
        hiddenSeq: [0, 11],
      });
      expect(replica1.snapshotAt(0, 1)).toEqual({
        visible: "Hello World",
        hidden: "hw",
        hiddenSeq: [0, 1, 1, 6, 1, 4],
      });
      expect(replica1.snapshotAt(0, 2)).toEqual({
        visible: "HelloWorld",
        hidden: "h w",
        hiddenSeq: [0, 1, 1, 4, 1, 1, 1, 4],
      });
      expect(replica1.snapshotAt(1, -1)).toEqual({
        visible: "hello_world!",
        hidden: " ",
        hiddenSeq: [0, 6, 1, 6],
      });
      expect(replica1.snapshotAt(1, 0)).toEqual({
        visible: "hello_world!",
        hidden: " ",
        hiddenSeq: [0, 6, 1, 6],
      });
      expect(replica1.snapshotAt(1, 1)).toEqual({
        visible: "Hello_World!",
        hidden: "h w",
        hiddenSeq: [0, 1, 1, 5, 1, 1, 1, 5],
      });
      expect(replica1.snapshotAt(1, 2)).toEqual({
        visible: "Hello_World!",
        hidden: "h w",
        hiddenSeq: [0, 1, 1, 5, 1, 1, 1, 5],
      });
      expect(replica1.snapshotAt(2, -1)).toEqual({
        visible: "hello_world",
        hidden: " !",
        hiddenSeq: [0, 6, 1, 5, 1],
      });
      expect(replica1.snapshotAt(2, 0)).toEqual({
        visible: "hello_world",
        hidden: " !",
        hiddenSeq: [0, 6, 1, 5, 1],
      });
      expect(replica1.snapshotAt(2, 1)).toEqual({
        visible: "Hello_World",
        hidden: "h w!",
        hiddenSeq: [0, 1, 1, 5, 1, 1, 1, 4, 1],
      });
      expect(replica1.snapshotAt(2, 2)).toEqual({
        visible: "Hello_World",
        hidden: "h w!",
        hiddenSeq: [0, 1, 1, 5, 1, 1, 1, 4, 1],
      });
    });

    test("edits and ingests 2", () => {
      const replica1 = new Replica("client1");
      const replica2 = new Replica("client2");
      replica2.edit(["hello world", 0]);
      let version = 0;
      for (const message of replica2.pending()) {
        replica1.ingest({ ...message, version });
        replica2.ingest({ ...message, version });
        version++;
      }
      replica2.edit([0, 5, "_", 6, 11, "!", 11]);
      replica2.edit([0, 11, 12]);
      for (const message of replica2.pending()) {
        replica1.ingest({ ...message, version });
        replica2.ingest({ ...message, version });
        version++;
      }
      replica1.edit(["H", 1, 6, "W", 7, 11], { commit: 0, change: -1 });
      replica1.edit([0, 5, 6, 11], { commit: 0, change: 0 });
      for (const message of replica1.pending()) {
        replica1.ingest({ ...message, version });
        replica2.ingest({ ...message, version });
        version++;
      }

      expect(replica1.snapshotAt(-1, -1)).toEqual({
        visible: "",
        hidden: "",
        hiddenSeq: [],
      });
      expect(replica1.snapshotAt(-1, 0)).toEqual({
        visible: "HW",
        hidden: "",
        hiddenSeq: [0, 2],
      });
      expect(replica1.snapshotAt(-1, 1)).toEqual({
        visible: "HW",
        hidden: "",
        hiddenSeq: [0, 2],
      });
      expect(replica1.snapshotAt(0, -1)).toEqual({
        visible: "hello world",
        hidden: "",
        hiddenSeq: [0, 11],
      });
      expect(replica1.snapshotAt(0, 0)).toEqual({
        visible: "Hello World",
        hidden: "hw",
        hiddenSeq: [0, 1, 1, 6, 1, 4],
      });
      expect(replica1.snapshotAt(0, 1)).toEqual({
        visible: "HelloWorld",
        hidden: "h w",
        hiddenSeq: [0, 1, 1, 4, 1, 1, 1, 4],
      });
      expect(replica1.snapshotAt(1, -1)).toEqual({
        visible: "hello_world!",
        hidden: " ",
        hiddenSeq: [0, 6, 1, 6],
      });
      expect(replica1.snapshotAt(1, 0)).toEqual({
        visible: "Hello_World!",
        hidden: "h w",
        hiddenSeq: [0, 1, 1, 5, 1, 1, 1, 5],
      });
      expect(replica1.snapshotAt(1, 1)).toEqual({
        visible: "Hello_World!",
        hidden: "h w",
        hiddenSeq: [0, 1, 1, 5, 1, 1, 1, 5],
      });
      expect(replica1.snapshotAt(2, -1)).toEqual({
        visible: "hello_world",
        hidden: " !",
        hiddenSeq: [0, 6, 1, 5, 1],
      });
      expect(replica1.snapshotAt(2, 0)).toEqual({
        visible: "Hello_World",
        hidden: "h w!",
        hiddenSeq: [0, 1, 1, 5, 1, 1, 1, 4, 1],
      });
      expect(replica1.snapshotAt(2, 1)).toEqual({
        visible: "Hello_World",
        hidden: "h w!",
        hiddenSeq: [0, 1, 1, 5, 1, 1, 1, 4, 1],
      });
    });
  });

  describe("Replica.pending", () => {
    test("simple", () => {
      const replica = new Replica("client1");
      replica.edit(["a", 0]);
      replica.edit(["b", 0, 1]);
      expect(replica.pending().length).toEqual(2);
      expect(replica.pending().length).toEqual(0);
      replica.edit(["c", 0, 2]);
      replica.edit(["d", 0, 3]);
      expect(replica.pending().length).toEqual(2);
      expect(replica.pending().length).toEqual(0);
    });

    test("ingest", () => {
      const replica = new Replica("client1");
      replica.edit(["a", 0]);
      let messages = replica.pending();
      expect(messages.length).toEqual(1);
      let version = 0;
      for (const message of messages) {
        replica.ingest({ ...message, version });
        version++;
      }
      replica.edit(["b", 0, 1]);
      replica.edit(["c", 0, 2]);
      messages = replica.pending();
      expect(messages.length).toEqual(2);
      replica.ingest({ ...messages[0], version });
      version++;
      replica.edit(["d", 0, 3]);
      expect(replica.pending().length).toEqual(1);
      replica.ingest({ ...messages[1], version });
      version++;
      expect(replica.pending().length).toEqual(0);
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
      replica.edit(["goodbye ", 6, 11], { change: 0 });
      expect(replica.snapshot.visible).toEqual("goodbye hello world");
    });

    test("concurrent 2", () => {
      const replica = new Replica("client1");
      replica.edit(["hello world", 0]);
      replica.edit([0, 1, "era", 9, 11]);
      replica.edit(["Great H", 2, 5, 11], { change: 0 });
      expect(replica.snapshot.visible).toEqual("Great Hera");
    });

    test("concurrent 3", () => {
      const replica = new Replica("client1");
      replica.edit(["hello world", 0]);
      replica.edit(["H", 1, 6, "W", 7, 11]);
      replica.edit([0, 5, ", Brian", 11]);
      replica.edit([0, 5, ", Dr. Evil", 11], { change: 1 });
      expect(replica.snapshot.visible).toEqual("Hello, Brian, Dr. Evil");
    });

    test("concurrent 4", () => {
      const replica = new Replica("client1");
      replica.edit(["hello world", 0]);
      replica.edit([6, 11]);
      replica.edit(["hey ", 0, 5]);
      replica.edit(["goodbye ", 6, 11], { change: 0 });
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
      replica.edit(["hey ", 0, 5]);
      replica.edit(["goodbye ", 0, 5], { change: 1, before: true });
      expect(replica.snapshot).toEqual({
        visible: "goodbye hey world",
        hidden: "hello ",
        hiddenSeq: [0, 8, 6, 9],
      });
    });

    test("concurrent 6", () => {
      const replica = new Replica("client1");
      replica.edit(["hello world", 0]);
      replica.edit([6, 11]);
      replica.edit(["hey ", 0, 5]);
      replica.edit(["goodbye ", 6, 11], { change: 0 });
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
      replica.edit([0, 11, "star", 11], { change: 0 });
      // ======================++++
      //"why hello there worldsstar"
      expect(replica.snapshot.visible).toEqual("why hello there worldsstar");
    });
  });

  // TODO: use fastcheck commands or something to make testing more obvious
  describe("Replica.ingest", () => {
    test("simple 1", () => {
      const replica1 = new Replica("client1");
      replica1.edit(["hello world", 0]);
      let version = 0;
      for (const message of replica1.pending()) {
        replica1.ingest({ ...message, version });
        version++;
      }
      const replica2 = replica1.clone("client2");
      replica1.edit(["goodbye", 5, 11]);
      replica1.edit([0, 13, "s", 13]);
      replica2.edit([0, 5, "_", 6, 11]);
      for (const message of replica2.pending()) {
        replica1.ingest({ ...message, version });
        version++;
      }
      expect(replica1.snapshot).toEqual({
        visible: "goodbye_worlds",
        hidden: "hello ",
        hiddenSeq: [0, 7, 5, 1, 1, 6],
      });
      expect(replica1.hiddenSeqAt(0, 0)).toEqual([0, 11]);
    });

    test("simple 2", () => {
      const replica1 = new Replica("client1");
      replica1.edit(["hello world", 0]);
      let version = 0;
      for (const message of replica1.pending()) {
        replica1.ingest({ ...message, version });
        version++;
      }
      const replica2 = replica1.clone("client2");
      replica1.edit(["goodbye", 5, 11]);
      for (const message of replica1.pending()) {
        replica1.ingest({ ...message, version });
        replica2.ingest({ ...message, version });
        version++;
      }
      replica2.edit([0, 7, "hello", 7, 13]);
      for (const message of replica2.pending()) {
        replica1.ingest({ ...message, version });
        version++;
      }
      expect(replica1.snapshot).toEqual({
        visible: "goodbyehello world",
        hidden: "hello",
        hiddenSeq: [0, 7, 5, 11],
      });
      expect(replica1.hiddenSeqAt(0, 0)).toEqual([0, 11]);
    });

    test("concurrent 1", () => {
      const replica1 = new Replica("client1");
      replica1.edit(["hello world", 0]);
      let version = 0;
      for (const message of replica1.pending()) {
        replica1.ingest({ ...message, version });
        version++;
      }
      const replica2 = replica1.clone("client2");
      replica1.edit(["H", 1, 6, "W", 7, 11]);
      replica1.edit([0, 5, 6, 11]);
      replica2.edit([0, 5, "_", 6, 11, "!", 11]);
      replica2.edit([0, 11, 12]);
      for (const message of replica1.pending().concat(replica2.pending())) {
        replica1.ingest({ ...message, version });
        replica2.ingest({ ...message, version });
        version++;
      }
      expect(replica1.snapshot).toEqual(replica2.snapshot);
      expect(replica1.hiddenSeqAt(0, 0)).toEqual([0, 11]);
    });

    test("concurrent 2", () => {
      const replica1 = new Replica("client1");
      replica1.edit(["hello world", 0]);
      let version = 0;
      for (const message of replica1.pending()) {
        replica1.ingest({ ...message, version });
        version++;
      }
      const replica2 = replica1.clone("client2");
      replica1.edit(["H", 1, 6, "W", 7, 11]);
      replica1.edit([0, 5, 6, 11]);
      replica2.edit([0, 5, "_", 6, 11, "!", 11]);
      replica2.edit([0, 11, 12]);
      for (const message of replica2.pending().concat(replica1.pending())) {
        replica1.ingest({ ...message, version });
        replica2.ingest({ ...message, version });
        version++;
      }
      expect(replica1.snapshot).toEqual(replica2.snapshot);
      expect(replica1.hiddenSeqAt(0, 0)).toEqual([0, 11]);
    });

    test("concurrent 3", () => {
      const replica1 = new Replica("client1");
      replica1.edit(["hello world", 0]);
      let version = 0;
      for (const message of replica1.pending()) {
        replica1.ingest({ ...message, version });
        version++;
      }
      const replica2 = replica1.clone("client2");
      replica1.edit(["H", 1, 6, "W", 7, 11]);
      replica1.edit([0, 5, "-", 6, 11]);
      replica2.edit([0, 5, "__", 6, 11, "!", 11]);
      replica2.edit(["hey", 6, 13]);
      for (const message of replica1.pending().concat(replica2.pending())) {
        replica1.ingest({ ...message, version });
        replica2.ingest({ ...message, version });
        version++;
      }
      expect(replica1.snapshot).toEqual(replica2.snapshot);
      expect(replica1.hiddenSeqAt(0, 0)).toEqual([0, 11]);
    });

    test("concurrent 4", () => {
      const replica1 = new Replica("client1");
      replica1.edit(["hello world", 0]);
      let version = 0;
      for (const message of replica1.pending()) {
        replica1.ingest({ ...message, version });
        version++;
      }
      const replica2 = replica1.clone("client2");
      replica1.edit(["H", 1, 6, "W", 7, 11]);
      replica1.edit([0, 5, "-", 6, 11]);
      replica2.edit([0, 5, "__", 6, 11, "!", 11]);
      replica2.edit(["hey", 6, 13]);
      for (const message of replica2.pending().concat(replica1.pending())) {
        replica1.ingest({ ...message, version });
        replica2.ingest({ ...message, version });
        version++;
      }
      expect(replica1.snapshot).toEqual(replica2.snapshot);
      expect(replica1.hiddenSeqAt(0, 0)).toEqual([0, 11]);
    });

    test("concurrent 5", () => {
      const replica1 = new Replica("client1");
      replica1.edit(["abij", 0]);
      let version = 0;
      for (const message of replica1.pending()) {
        replica1.ingest({ ...message, version });
        version++;
      }
      const replica2 = replica1.clone("client2");
      replica1.edit([0, 2, "d", 2, 4]);
      replica1.edit([0, 2, "c", 2, 5]);
      replica2.edit([0, 2, "efgh", 2, 4]);
      for (const message of replica1.pending().concat(replica2.pending())) {
        replica1.ingest({ ...message, version });
        replica2.ingest({ ...message, version });
        version++;
      }
      expect(replica1.snapshot.visible).toEqual("abcdefghij");
      expect(replica1.snapshot).toEqual(replica2.snapshot);
      expect(replica1.hiddenSeqAt(0, 0)).toEqual([0, 4]);
    });

    test("concurrent 6", () => {
      const replica1 = new Replica("client1");
      replica1.edit(["abij", 0]);
      let version = 0;
      for (const message of replica1.pending()) {
        replica1.ingest({ ...message, version });
        version++;
      }
      const replica2 = replica1.clone("client2");
      replica1.edit([0, 2, "d", 2, 4]);
      replica1.edit([0, 2, "c", 2, 5]);
      replica2.edit([0, 2, "efgh", 2, 4]);
      for (const message of replica2.pending().concat(replica1.pending())) {
        replica1.ingest({ ...message, version });
        replica2.ingest({ ...message, version });
        version++;
      }
      expect(replica1.snapshot.visible).toEqual("abcdefghij");
      expect(replica1.snapshot).toEqual(replica2.snapshot);
      expect(replica1.hiddenSeqAt(0, 0)).toEqual([0, 4]);
    });

    test("concurrent 7", () => {
      const replica1 = new Replica("client1");
      const replica2 = new Replica("client2");
      replica1.edit(["a", 0]);
      const a = { ...replica1.pending()[0], version: 0 };
      replica1.edit([0, 1, "s", 1]);
      const s = { ...replica1.pending()[0], version: 2 };
      replica2.edit(["d", 0]);
      const d = { ...replica2.pending()[0], version: 1 };
      replica1.ingest(a);
      replica2.ingest(a);
      replica2.edit([0, 2, "f", 2]);
      const f = { ...replica2.pending()[0], version: 3 };
      replica1.ingest(d);
      replica2.ingest(d);
      replica1.ingest(s);
      replica2.ingest(s);
      replica1.ingest(f);
      replica2.ingest(f);
      expect(replica1.snapshot).toEqual(replica2.snapshot);
      expect(replica1.hiddenSeqAt(0, 0)).toEqual([0, 1]);
    });
  });
});
