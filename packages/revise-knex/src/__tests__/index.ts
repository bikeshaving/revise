import * as Knex from "knex";
import { KnexConnection } from "../index";
// @ts-ignore
import * as knexfile from "../../knexfile";
import { Revision } from "@createx/revise/lib/connection";

describe("KnexConnection", () => {
  let knex: Knex;
  beforeAll(() => {
    knex = Knex(knexfile);
  });

  beforeEach(async () => {
    await knex("revise_revision").truncate();
  });

  afterAll(async () => {
    await knex("revise_revision").truncate();
    knex.destroy();
  });

  test("revisions", async () => {
    const conn = new KnexConnection(knex);
    const revisions: Revision[] = [
      { patch: "a", client: "client1", local: 0, received: -1, version: -1 },
      { patch: "b", client: "client1", local: 1, received: -1, version: -1 },
      { patch: "c", client: "client1", local: 2, received: -1, version: -1 },
      { patch: "d", client: "client1", local: 3, received: -1, version: -1 },
      { patch: "e", client: "client1", local: 4, received: -1, version: -1 },
    ];
    await conn.sendRevisions("doc1", revisions);
    const revisions1 = await conn.fetchRevisions("doc1");
    const revisions2 = revisions.map((rev, version) => ({ ...rev, version }));
    expect(revisions1).toEqual(revisions2);
  });

  test("multiple sendRevisions", async () => {
    const conn = new KnexConnection(knex);
    const revisions: Revision[] = [
      { patch: "a", client: "client1", local: 0, received: -1, version: -1 },
      { patch: "b", client: "client1", local: 1, received: -1, version: -1 },
      { patch: "c", client: "client1", local: 2, received: -1, version: -1 },
      { patch: "d", client: "client1", local: 3, received: -1, version: -1 },
      { patch: "e", client: "client1", local: 4, received: -1, version: -1 },
    ];
    await conn.sendRevisions("doc1", revisions.slice(0, 2));
    await conn.sendRevisions("doc1", revisions.slice(2));
    const revisions1 = await conn.fetchRevisions("doc1");
    const revisions2 = revisions.map((rev, version) => ({ ...rev, version }));
    expect(revisions1).toEqual(revisions2);
  });

  test("sendRevisions idempotent", async () => {
    const conn = new KnexConnection(knex);
    const revisions: Revision[] = [
      { patch: "a", client: "client1", local: 0, received: -1, version: -1 },
      { patch: "b", client: "client1", local: 1, received: -1, version: -1 },
      { patch: "c", client: "client1", local: 2, received: -1, version: -1 },
      { patch: "d", client: "client1", local: 3, received: -1, version: -1 },
      { patch: "e", client: "client1", local: 4, received: -1, version: -1 },
    ];
    await conn.sendRevisions("doc1", revisions.slice(0, 3));
    await conn.sendRevisions("doc1", revisions.slice(2));
    const revisions1 = await conn.fetchRevisions("doc1");
    const revisions2 = revisions.map((rev, version) => ({ ...rev, version }));
    expect(revisions1).toEqual(revisions2);
  });

  test("multiple clients", async () => {
    const conn = new KnexConnection(knex);
    const revisions: Revision[] = [
      { patch: "a", client: "client1", local: 0, received: -1, version: -1 },
      { patch: "b", client: "client1", local: 1, received: -1, version: -1 },
      { patch: "c", client: "client1", local: 2, received: 2, version: -1 },
      { patch: "d", client: "client1", local: 3, received: 2, version: -1 },
      { patch: "e", client: "client1", local: 4, received: 2, version: -1 },
      { patch: "1", client: "client2", local: 0, received: 2, version: -1 },
      { patch: "2", client: "client2", local: 1, received: 2, version: -1 },
      { patch: "3", client: "client2", local: 2, received: 2, version: -1 },
      { patch: "4", client: "client2", local: 3, received: 2, version: -1 },
    ];
    await conn.sendRevisions("doc1", revisions.slice(0, 2));
    await conn.sendRevisions("doc1", revisions.slice(5, 8));
    await conn.sendRevisions(
      "doc1",
      revisions.slice(2, 4).concat(revisions.slice(8)),
    );
  });

  test("missing rev throws", async () => {
    const conn = new KnexConnection(knex);
    const revisions: Revision[] = [
      { patch: "a", client: "client1", local: 0, received: -1, version: -1 },
      { patch: "b", client: "client1", local: 1, received: -1, version: -1 },
      { patch: "d", client: "client1", local: 3, received: -1, version: -1 },
      { patch: "e", client: "client1", local: 4, received: -1, version: -1 },
    ];
    await expect(conn.sendRevisions("doc1", revisions)).rejects.toThrow();
  });

  test("missing rev with multiple clients throws", async () => {
    const conn = new KnexConnection(knex);
    const revisions: Revision[] = [
      { patch: "a", client: "client1", local: 0, received: -1, version: -1 },
      { patch: "b", client: "client1", local: 1, received: -1, version: -1 },
      { patch: "c", client: "client1", local: 2, received: 2, version: -1 },
      { patch: "d", client: "client1", local: 3, received: 2, version: -1 },
      { patch: "e", client: "client1", local: 4, received: 2, version: -1 },
      { patch: "1", client: "client2", local: 0, received: 2, version: -1 },
      { patch: "2", client: "client2", local: 1, received: 2, version: -1 },
      { patch: "4", client: "client2", local: 3, received: 2, version: -1 },
    ];
    await conn.sendRevisions("doc1", revisions.slice(0, 2));
    await conn.sendRevisions("doc1", revisions.slice(5, 7));
    await expect(
      conn.sendRevisions(
        "doc1",
        revisions.slice(2, 5).concat(revisions.slice(7)),
      ),
    ).rejects.toThrow();
  });

  test("revisions with start", async () => {
    const conn = new KnexConnection(knex);

    const revisions: Revision[] = [
      { patch: "a", client: "client1", local: 0, received: -1, version: -1 },
      { patch: "b", client: "client1", local: 1, received: -1, version: -1 },
      { patch: "c", client: "client1", local: 2, received: -1, version: -1 },
      { patch: "d", client: "client1", local: 3, received: -1, version: -1 },
      { patch: "e", client: "client1", local: 4, received: -1, version: -1 },
    ];
    await conn.sendRevisions("doc1", revisions);
    const revisions1 = await conn.fetchRevisions("doc1", 1);
    const revisions2 = revisions.slice(1).map((rev, version) => ({
      ...rev,
      version: version + 1,
    }));
    expect(revisions1).toEqual(revisions2);
  });

  test("revisions with end", async () => {
    const conn = new KnexConnection(knex);

    const revisions: Revision[] = [
      { patch: "a", client: "client1", local: 0, received: -1, version: -1 },
      { patch: "b", client: "client1", local: 1, received: -1, version: -1 },
      { patch: "c", client: "client1", local: 2, received: -1, version: -1 },
      { patch: "d", client: "client1", local: 3, received: -1, version: -1 },
      { patch: "e", client: "client1", local: 4, received: -1, version: -1 },
    ];
    await conn.sendRevisions("doc1", revisions);

    const revisions1 = await conn.fetchRevisions("doc1", undefined, 2);
    const revisions2 = revisions.slice(0, 2).map((rev, version) => ({
      ...rev,
      version: version,
    }));
    expect(revisions1).toEqual(revisions2);
  });

  test("revisions with start and end", async () => {
    const conn = new KnexConnection(knex);
    const revisions: Revision[] = [
      { patch: "a", client: "client1", local: 0, received: -1, version: -1 },
      { patch: "b", client: "client1", local: 1, received: -1, version: -1 },
      { patch: "c", client: "client1", local: 2, received: -1, version: -1 },
      { patch: "d", client: "client1", local: 3, received: -1, version: -1 },
      { patch: "e", client: "client1", local: 4, received: -1, version: -1 },
    ];

    await conn.sendRevisions("doc1", revisions);

    const revisions1 = await conn.fetchRevisions("doc1", 1, 2);
    const revisions2 = revisions.slice(1, 2).map((rev, version) => ({
      ...rev,
      version: version + 1,
    }));
    expect(revisions1).toEqual(revisions2);
  });

  test("fetchRevisions with negative indexes", async () => {
    const conn = new KnexConnection(knex);

    await expect(conn.fetchRevisions("doc1", -1)).rejects.toThrow(RangeError);
    await expect(conn.fetchRevisions("doc1", 1, -2)).rejects.toThrow(
      RangeError,
    );
  });

  test("fetchRevisions with end less than or equal to start", async () => {
    const conn = new KnexConnection(knex);

    await expect(conn.fetchRevisions("doc1", 2, 2)).rejects.toThrow(RangeError);
    await expect(conn.fetchRevisions("doc1", 5, 3)).rejects.toThrow(RangeError);
  });

  test("subscribe", async () => {
    const conn = new KnexConnection(knex);

    const subscription = conn.subscribe("doc", 0);
    const revisions: Promise<Revision[]> = (async () => {
      let revisions: Revision[] = [];
      for await (const revisions1 of subscription) {
        revisions = revisions.concat(revisions1);
        if (revisions.length === 3) {
          break;
        }
      }
      return revisions;
    })();
    const revisions1 = [
      { patch: "a", client: "client1", local: 0, received: -1, version: -1 },
      { patch: "b", client: "client1", local: 1, received: -1, version: -1 },
      { patch: "c", client: "client1", local: 2, received: 1, version: -1 },
    ];
    await conn.sendRevisions("doc", revisions1.slice(0, 2));
    await conn.sendRevisions("doc", revisions1.slice(2));
    const revisions2 = revisions1.map((rev, version) => ({ ...rev, version }));
    await expect(revisions).resolves.toEqual(revisions2);
  });
});
