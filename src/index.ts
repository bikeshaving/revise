// [flag, ...lengths]
export type Subseq = number[];

export function flagAt(subseq: Subseq, index: number): boolean {
  return !subseq[0] === (index % 2 === 0);
}

export function push(subseq: Subseq, length: number, flag: boolean): number {
  if (length <= 0) {
    throw new Error("Cannot push empty segment");
  } else if (!subseq.length) {
    subseq.push(flag ? 1 : 0, length);
  } else {
    const flag1 = flagAt(subseq, subseq.length - 1);
    if (flag === flag1) {
      subseq[subseq.length - 1] += length;
    } else {
      subseq.push(length);
    }
  }
  return subseq.length;
}

export function concat(subseq1: Subseq, subseq2: Subseq): Subseq {
  if (!subseq2.length) {
    return subseq1;
  }
  const flag1 = flagAt(subseq1, subseq1.length - 1);
  const flag2 = flagAt(subseq2, 0);
  const length = subseq2[1];
  if (length && flag1 === flag2) {
    subseq1 = subseq1.slice();
    push(subseq1, length, flag1);
  }
  return subseq1.concat(subseq2.slice(2));
}

// [length, ...flags]
export type Segment = [number, ...boolean[]];

export class SegmentIterator implements IterableIterator<Segment> {
  private i = 1;

  constructor(private subseq: Subseq) {}

  next(): IteratorResult<Segment> {
    const length = this.subseq[this.i];
    if (length == null) {
      return { done: true } as any;
    }
    const flag = flagAt(this.subseq, this.i);
    this.i++;
    return { done: false, value: [length, flag] };
  }

  [Symbol.iterator]() {
    return this;
  }
}

export function print(subseq: Subseq): string {
  let result = "";
  for (const [length, flag] of new SegmentIterator(subseq)) {
    result += flag ? "+".repeat(length) : "=".repeat(length);
  }
  return result;
}

export function count(subseq: Subseq, test?: boolean): number {
  let result = 0;
  for (const [length, flag] of new SegmentIterator(subseq)) {
    if (test == null || test === flag) {
      result += length;
    }
  }
  return result;
}

export function empty(length: number): Subseq {
  const result: Subseq = [];
  if (length) {
    push(result, length, false);
  }
  return result;
}

export function clear(subseq: Subseq): Subseq {
  return empty(count(subseq));
}

export function full(length: number): Subseq {
  const result: Subseq = [];
  if (length) {
    push(result, length, true);
  }
  return result;
}

export function fill(subseq: Subseq): Subseq {
  return full(count(subseq));
}

export function complement(subseq: Subseq): Subseq {
  if (!subseq.length) {
    return subseq;
  }
  return [subseq[0] ? 0 : 1].concat(subseq.slice(1));
}

export class ZippedSegmentIterator implements IterableIterator<Segment> {
  private iter1: SegmentIterator;
  private iter2: SegmentIterator;
  private it1: IteratorResult<Segment>;
  private it2: IteratorResult<Segment>;
  constructor(subseq1: Subseq, subseq2: Subseq) {
    this.iter1 = new SegmentIterator(subseq1);
    this.iter2 = new SegmentIterator(subseq2);
    this.it1 = this.iter1.next();
    this.it2 = this.iter2.next();
  }

  next(): IteratorResult<Segment> {
    if (this.it1.done || this.it2.done) {
      if (!this.it1.done || !this.it2.done) {
        throw new Error("Length mismatch");
      }
      return { done: true } as any;
    }
    const [length1, flag1] = this.it1.value;
    const [length2, flag2] = this.it2.value;
    const length = Math.min(length1, length2);
    if (length1 - length > 0) {
      this.it1.value[0] -= length;
    } else {
      this.it1 = this.iter1.next();
    }
    if (length2 - length > 0) {
      this.it2.value[0] -= length;
    } else {
      this.it2 = this.iter2.next();
    }
    return {
      done: false,
      value: [length, flag1, flag2],
    };
  }

  [Symbol.iterator]() {
    return this;
  }

  join(fn: (flag1: boolean, flag2: boolean) => boolean): Subseq {
    const subseq: Subseq = [];
    for (const [length, flag1, flag2] of this) {
      push(subseq, length, fn(flag1, flag2));
    }
    return subseq;
  }
}

export function zip(subseq1: Subseq, subseq2: Subseq): ZippedSegmentIterator {
  return new ZippedSegmentIterator(subseq1, subseq2);
}

export function union(subseq1: Subseq, subseq2: Subseq): Subseq {
  return zip(subseq1, subseq2).join((flag1, flag2) => flag1 || flag2);
}

export function intersection(subseq1: Subseq, subseq2: Subseq): Subseq {
  return zip(subseq1, subseq2).join((flag1, flag2) => flag1 && flag2);
}

export function difference(subseq1: Subseq, subseq2: Subseq): Subseq {
  return zip(subseq1, subseq2).join((flag1, flag2) => flag1 && !flag2);
}

export function expand(
  subseq1: Subseq,
  subseq2: Subseq,
  options: { union?: boolean } = {},
): Subseq {
  const union = !!options.union;
  const result: Subseq = [];
  let length1: number | undefined;
  let flag1: boolean;
  const iter = new SegmentIterator(subseq1);
  for (let [length2, flag2] of new SegmentIterator(subseq2)) {
    if (flag2) {
      push(result, length2, union);
    } else {
      while (length2 > 0) {
        if (length1 == null || length1 === 0) {
          const it = iter.next();
          if (it.done) {
            throw new Error("Length mismatch");
          }
          [length1, flag1] = it.value;
        }
        const length = Math.min(length1, length2);
        push(result, length, flag1!);
        length1 -= length;
        length2 -= length;
      }
    }
  }
  if (!iter.next().done || (length1 != null && length1 > 0)) {
    throw new Error("Length mismatch");
  }
  return result;
}

export function shrink(subseq1: Subseq, subseq2: Subseq): Subseq {
  const result: Subseq = [];
  for (const [length, flag1, flag2] of zip(subseq1, subseq2)) {
    if (!flag2) {
      push(result, length, flag1);
    }
  }
  return result;
}

export function interleave(subseq1: Subseq, subseq2: Subseq): [Subseq, Subseq] {
  const iter1 = new SegmentIterator(subseq1);
  const iter2 = new SegmentIterator(subseq2);
  let it1 = iter1.next();
  let it2 = iter2.next();
  const result1: Subseq = [];
  const result2: Subseq = [];

  while (!it1.done && !it2.done) {
    const [length1, flag1] = it1.value;
    const [length2, flag2] = it2.value;
    if (flag1 && flag2) {
      push(result1, length1, true);
      push(result1, length2, false);
      push(result2, length1, false);
      push(result2, length2, true);
      it1 = iter1.next();
      it2 = iter2.next();
    } else if (flag1) {
      push(result1, length1, true);
      push(result2, length1, false);
      it1 = iter1.next();
    } else if (flag2) {
      push(result1, length2, false);
      push(result2, length2, true);
      it2 = iter2.next();
    } else {
      const length = Math.min(length1, length2);
      push(result1, length, false);
      push(result2, length, false);
      if (length1 - length > 0) {
        it1.value[0] = length1 - length;
      } else {
        it1 = iter1.next();
      }
      if (length2 - length > 0) {
        it2.value[0] = length2 - length;
      } else {
        it2 = iter2.next();
      }
    }
  }

  if (!it1.done) {
    const [length1, flag1] = it1.value;
    if (!flag1 || !iter1.next().done) {
      throw new Error("Length mismatch");
    }
    push(result1, length1, true);
    push(result2, length1, false);
  }

  if (!it2.done) {
    const [length2, flag2] = it2.value;
    if (!flag2 || !iter2.next().done) {
      throw new Error("Length mismatch");
    }
    push(result1, length2, false);
    push(result2, length2, true);
  }

  return [result1, result2];
}

export function split(text: string, subseq: Subseq): [string, string] {
  let consumed = 0;
  let result1 = "";
  let result2 = "";
  for (const [length, flag] of new SegmentIterator(subseq)) {
    if (flag) {
      result1 += text.slice(consumed, consumed + length);
    } else {
      result2 += text.slice(consumed, consumed + length);
    }
    consumed += length;
  }
  return [result1, result2];
}

export function merge(text1: string, text2: string, subseq: Subseq): string {
  let result = "";
  let consumed1 = 0;
  let consumed2 = 0;
  for (const [length, flag] of new SegmentIterator(subseq)) {
    if (flag) {
      result += text1.slice(consumed1, consumed1 + length);
      consumed1 += length;
    } else {
      result += text2.slice(consumed2, consumed2 + length);
      consumed2 += length;
    }
  }
  return result;
}

export function shuffle(
  text1: string,
  text2: string,
  subseq1: Subseq,
  subseq2: Subseq,
): [string, string] {
  return split(merge(text1, text2, subseq1), subseq2);
}

// Patches are arrays of strings and numbers which represent changes to text.
// Numbers represent indexes into the text. Two consecutive indexes represent a copy or retain operation, where the numbers represent the start-inclusive and end-exclusive range which should be copied over to the result.
// Deletions are represented via omission.
// Strings within a patch represent insertions at the latest index.
// The last element of a patch will always be a number which represent the length of the text being modified.
// TODO: allow for move operations to be defined as three consecutive numbers, the first being a number less than the latest index which indicates a position to move a range of text, and the next two representing the range to be moved.
// TODO: allow for revive operations to be defined as three consecutive numbers, where the first and the second are the same number.
export type Patch = (string | number)[];

export function apply(text: string, patch: Patch): string {
  const length = patch[patch.length - 1];
  if (typeof length !== "number") {
    throw new Error("Malformed patch");
  } else if (length !== text.length) {
    throw new Error("Length mismatch");
  }
  let result = "";
  let index = 0;
  let start: number | undefined;
  for (const p of patch) {
    if (start != null) {
      if (typeof p !== "number" || p < index) {
        throw new Error("Malformed patch");
      }
      result += text.slice(start, p);
      index = p;
      start = undefined;
    } else if (typeof p === "number") {
      if (p < index) {
        throw new Error("Malformed patch");
      }
      index = p;
      start = p;
    } else {
      result += p;
    }
  }
  return result;
}

// TODO
// export interface Moves {
//   [to: number]: Subseq;
// }

export interface FactoredPatch {
  inserted: string;
  insertSeq: Subseq;
  deleteSeq: Subseq;
  // TODO
  // reviveSeq: Subseq;
  // moves: { [number] : Subseq };
}

export function factor(patch: Patch): FactoredPatch {
  const length = patch[patch.length - 1];
  if (typeof length !== "number") {
    throw new Error("Malformed patch");
  }
  let inserted = "";
  const insertSeq: Subseq = [];
  const deleteSeq: Subseq = [];
  let consumed = 0;
  let start: number | undefined;
  for (const p of patch) {
    if (start != null) {
      // TODO: repeated number means we’re reviving a segment
      if (typeof p !== "number" || p <= consumed || p > length) {
        throw new Error("Malformed patch");
      }
      push(insertSeq, p - start, false);
      push(deleteSeq, p - start, false);
      consumed = p;
      start = undefined;
    } else if (typeof p === "number") {
      // TODO: number less than consumed means we’re moving the segment
      if (p < consumed) {
        throw new Error("Malformed patch");
      } else if (p > consumed) {
        push(insertSeq, p - consumed, false);
        push(deleteSeq, p - consumed, true);
      }
      consumed = p;
      start = p;
    } else {
      push(insertSeq, p.length, true);
      inserted += p;
    }
  }
  if (length > consumed) {
    push(insertSeq, length - consumed, false);
    push(deleteSeq, length - consumed, true);
  }
  return { inserted, insertSeq, deleteSeq };
}

export function synthesize(
  inserted: string,
  insertSeq: Subseq,
  deleteSeq: Subseq = empty(count(insertSeq, false)),
): Patch {
  const patch: Patch = [];
  let index = 0;
  let consumed = 0;
  deleteSeq = expand(deleteSeq, insertSeq);
  for (const [length, iFlag, dFlag] of zip(insertSeq, deleteSeq)) {
    if (iFlag) {
      index += length;
      patch.push(inserted.slice(index - length, index));
    } else {
      consumed += length;
      if (!dFlag) {
        patch.push(consumed - length, consumed);
      }
    }
  }
  if (index !== inserted.length) {
    throw new Error("Length mismatch");
  }
  const last = patch[patch.length - 1];
  const length = count(insertSeq, false);
  if (typeof last !== "number" || last < length) {
    patch.push(length);
  }
  return patch;
}

export interface Snapshot {
  visible: string;
  hidden: string;
  hiddenSeq: Subseq;
  version: number;
}

export interface Revision {
  patch: Patch;
  clientId: string;
  priority: number;
  version?: number;
  localVersion: number;
  lastKnownVersion: number;
}

function rebase(
  revision: Revision,
  revisions: Revision[],
  hiddenSeq: Subseq,
): [Revision, Revision[]] {
  let { inserted, insertSeq, deleteSeq } = factor(revision.patch);
  const revisions1: Revision[] = [];
  for (const revision1 of revisions) {
    if (
      revision.priority === revision1.priority &&
      revision.clientId === revision1.clientId
    ) {
      throw new Error("Concurrent edits with the same client and priority");
    }
    const before =
      revision.priority === revision1.priority
        ? revision.clientId < revision1.clientId
        : revision.priority < revision1.priority;
    let {
      inserted: inserted1,
      insertSeq: insertSeq1,
      deleteSeq: deleteSeq1,
    } = factor(revision1.patch);
    deleteSeq1 = difference(deleteSeq1, deleteSeq);
    deleteSeq = expand(deleteSeq, insertSeq1);
    if (before) {
      [insertSeq, insertSeq1] = interleave(insertSeq, insertSeq1);
    } else {
      [insertSeq1, insertSeq] = interleave(insertSeq1, insertSeq);
    }
    deleteSeq1 = expand(deleteSeq1, shrink(insertSeq, insertSeq1));
    revisions1.push({
      ...revision1,
      patch: synthesize(inserted1, insertSeq1, deleteSeq1),
    });
  }
  deleteSeq = difference(deleteSeq, hiddenSeq);
  revision = { ...revision, patch: synthesize(inserted, insertSeq, deleteSeq) };
  return [revision, revisions1];
}

// TODO: remove deleteSeq from result
function summarize(revisions: Revision[], clientId?: string): [Subseq, Subseq] {
  if (!revisions.length) {
    throw new Error("Empty revisions");
  }
  let { insertSeq, deleteSeq } = factor(revisions[0].patch);
  deleteSeq = expand(deleteSeq, insertSeq);
  if (revisions[0].clientId === clientId) {
    insertSeq = clear(insertSeq);
    deleteSeq = clear(deleteSeq);
  }
  for (const revision of revisions.slice(1)) {
    const own = clientId === revision.clientId;
    const { insertSeq: insertSeq1, deleteSeq: deleteSeq1 } = factor(
      revision.patch,
    );
    insertSeq = expand(insertSeq, insertSeq1, { union: !own });
    deleteSeq = own
      ? difference(deleteSeq, deleteSeq1)
      : union(deleteSeq, deleteSeq1);
    deleteSeq = expand(deleteSeq, insertSeq1);
  }
  return [insertSeq, deleteSeq];
}

export class Document {
  // TODO: add factored patches to improve performance
  protected constructor(
    // TODO: document doesn’t need to know its own id
    public id: string,
    // TODO: document doesn’t need to know its own client besides clientId
    public client: Client,
    public snapshot: Snapshot,
    // TODO: make revisions a possibly sparse array of revisions
    public revisions: Revision[],
    public lastKnownVersion = -1,
    public localVersion = 0,
  ) {}

  static create(id: string, client: Client, initial: string = ""): Document {
    const snapshot: Snapshot = {
      visible: initial,
      hidden: "",
      hiddenSeq: empty(initial.length),
      version: 0,
    };
    const revision: Revision = {
      patch: synthesize(initial, full(initial.length)),
      clientId: client.id,
      priority: 0,
      localVersion: 0,
      lastKnownVersion: -1,
    };
    return new Document(id, client, snapshot, [revision], -1, 1);
  }

  static from(
    id: string,
    client: Client,
    snapshot: Snapshot,
    revisions: Revision[],
  ): Document {
    const doc = new Document(id, client, snapshot, [], snapshot.version);
    for (const revision of revisions) {
      doc.ingest(revision);
    }
    return doc;
  }

  hiddenSeqAt(version: number): Subseq {
    let hiddenSeq = this.snapshot.hiddenSeq;
    const revisions = this.revisions.slice(version + 1).reverse();
    for (const revision of revisions) {
      const { insertSeq, deleteSeq } = factor(revision.patch);
      hiddenSeq = shrink(hiddenSeq, insertSeq);
      hiddenSeq = difference(hiddenSeq, deleteSeq);
    }
    return hiddenSeq;
  }

  snapshotAt(version: number): Snapshot {
    if (version >= this.revisions.length - 1) {
      return this.snapshot;
    }
    let { visible, hidden, hiddenSeq } = this.snapshot;
    const [insertSeq] = summarize(this.revisions.slice(version + 1));
    let merged = merge(hidden, visible, hiddenSeq);
    [, merged] = split(merged, insertSeq);
    const hiddenSeq1 = this.hiddenSeqAt(version);
    [hidden, visible] = split(merged, hiddenSeq1);
    return { visible, hidden, hiddenSeq: hiddenSeq1, version };
  }

  patchAt(version: number): Patch {
    const snapshot = this.snapshotAt(version);
    const revision =
      this.revisions[version] || this.revisions[this.revisions.length - 1];
    let { inserted, insertSeq, deleteSeq } = factor(revision.patch);
    deleteSeq = expand(deleteSeq, insertSeq);
    const hiddenSeq = difference(snapshot.hiddenSeq, deleteSeq);
    insertSeq = shrink(insertSeq, hiddenSeq);
    deleteSeq = shrink(deleteSeq, hiddenSeq);
    return synthesize(inserted, insertSeq, shrink(deleteSeq, insertSeq));
  }

  clone(client: Client = this.client): Document {
    return new Document(
      this.id,
      client,
      { ...this.snapshot },
      this.revisions.slice(),
      this.lastKnownVersion,
    );
  }

  apply(revision: Revision, snapshot: Snapshot = this.snapshot): Snapshot {
    let { inserted, insertSeq, deleteSeq } = factor(revision.patch);
    let { visible, hidden, hiddenSeq } = snapshot;

    if (count(deleteSeq, true) > 0) {
      let hiddenSeq1: Subseq;
      hiddenSeq1 = union(hiddenSeq, deleteSeq);
      [hidden, visible] = shuffle(hidden, visible, hiddenSeq, hiddenSeq1);
      hiddenSeq = hiddenSeq1;
    }

    if (inserted.length) {
      hiddenSeq = expand(hiddenSeq, insertSeq);
      const insertSeq1 = shrink(insertSeq, hiddenSeq);
      visible = merge(inserted, visible, insertSeq1);
    }

    return { visible, hidden, hiddenSeq, version: snapshot.version + 1 };
  }

  edit(
    patch: Patch,
    priority: number = 0,
    version: number = this.revisions.length - 1,
  ): void {
    if (version < 0 || version > this.revisions.length - 1) {
      throw new Error("Version out of range");
    }
    let { inserted, insertSeq, deleteSeq } = factor(patch);
    const hiddenSeq = this.hiddenSeqAt(version);
    [, insertSeq] = interleave(hiddenSeq, insertSeq);
    deleteSeq = expand(deleteSeq, hiddenSeq);
    let revision: Revision = {
      patch: synthesize(inserted, insertSeq, deleteSeq),
      clientId: this.client.id,
      priority,
      localVersion: this.localVersion,
      lastKnownVersion: this.lastKnownVersion,
    };
    [revision] = rebase(
      revision,
      this.revisions.slice(version + 1),
      this.snapshot.hiddenSeq,
    );
    this.snapshot = this.apply(revision);
    this.revisions.push(revision);
    this.localVersion++;
    this.client.save(this.id);
  }

  undo(version: number): void {
    const [revision, ...revisions] = this.revisions.slice(version);
    let { insertSeq: deleteSeq, deleteSeq: insertSeq } = factor(revision.patch);
    insertSeq = expand(insertSeq, deleteSeq);
    const [insertSeq1] = summarize(revisions);
    deleteSeq = expand(deleteSeq, insertSeq1);
    insertSeq = expand(insertSeq, insertSeq1);
    const { visible, hidden, hiddenSeq } = this.snapshot;
    const [inserted] = split(merge(hidden, visible, hiddenSeq), insertSeq);
    [, insertSeq] = interleave(insertSeq, insertSeq);
    const revision1: Revision = {
      patch: synthesize(inserted, insertSeq, deleteSeq),
      clientId: this.client.id,
      priority: 0,
      localVersion: this.localVersion,
      lastKnownVersion: this.lastKnownVersion,
    };
    this.snapshot = this.apply(revision1);
    this.revisions.push(revision1);
    this.localVersion++;
    this.client.save(this.id);
  }

  ingest(revision: Revision): void {
    if (revision.version == null) {
      throw new Error("Missing revision version");
    } else if (
      this.lastKnownVersion + 1 < revision.version ||
      this.lastKnownVersion < revision.lastKnownVersion
    ) {
      // TODO: attempt repair
      throw new Error("Missing revision");
    } else if (revision.version <= this.lastKnownVersion) {
      return;
    } else if (revision.clientId === this.client.id) {
      this.lastKnownVersion = revision.version;
      return;
    }
    let lastKnownVersion = Math.max(revision.lastKnownVersion, 0);
    for (let v = this.lastKnownVersion; v >= lastKnownVersion; v--) {
      if (revision.clientId === this.revisions[v].clientId) {
        lastKnownVersion = v;
        break;
      }
    }
    let { inserted, insertSeq, deleteSeq } = factor(revision.patch);
    if (
      revision.lastKnownVersion > -1 &&
      revision.lastKnownVersion < lastKnownVersion
    ) {
      const revisions = this.revisions.slice(
        revision.lastKnownVersion + 1,
        lastKnownVersion + 1,
      );
      const [baseInsertSeq] = summarize(revisions, revision.clientId);
      insertSeq = expand(insertSeq, baseInsertSeq);
      deleteSeq = expand(deleteSeq, baseInsertSeq);
    }
    revision = {
      ...revision,
      patch: synthesize(inserted, insertSeq, deleteSeq),
    };
    let revisions = this.revisions.slice(
      lastKnownVersion + 1,
      this.lastKnownVersion + 1,
    );
    [revision] = rebase(
      revision,
      revisions,
      this.hiddenSeqAt(this.lastKnownVersion),
    );
    revision = { ...revision, lastKnownVersion: revision.version! };
    revisions = this.revisions.slice(this.lastKnownVersion + 1);
    this.revisions.splice(
      this.lastKnownVersion + 1,
      revisions.length,
      revision,
    );
    [revision, revisions] = rebase(
      revision,
      revisions,
      this.snapshot.hiddenSeq,
    );
    this.revisions = this.revisions.concat(revisions);
    this.snapshot = this.apply(revision);
    this.lastKnownVersion = revision.version!;
  }

  pendingRevisions(): Revision[] {
    return this.revisions.slice(this.lastKnownVersion + 1);
  }
}

export interface Connection {
  fetchSnapshot(id: string, min?: number): Promise<Snapshot>;
  fetchRevisions(id: string, from?: number, to?: number): Promise<Revision[]>;
  sendSnapshot(id: string, snapshot: Snapshot): Promise<Snapshot>;
  sendRevisions(id: string, revisions: Revision[]): Promise<Revision[]>;
  updates(id: string, from?: number): Promise<AsyncIterable<Revision[]>>;
}

interface ClientSaveOptions {
  force?: boolean;
}

export class Client {
  protected documents: Record<string, Document> = {};
  protected pending: Set<string> = new Set();
  protected pollTimeout: any;
  protected saveResolves: (() => void)[] = [];
  constructor(public id: string, public connection: Connection) {
    this.poll();
  }

  save(id: string, options: ClientSaveOptions = {}): Promise<void> {
    this.pending.add(id);
    if (options.force) {
      return this.sync();
    }
    return this.whenSynced();
  }

  async sync(): Promise<void> {
    if (this.pending.size) {
      await Promise.all(
        Array.from(this.pending).map(async (id) => {
          const doc = this.documents[id];
          if (doc) {
            // TODO: error recovery
            await this.connection.sendRevisions(id, doc.pendingRevisions());
          }
          this.pending.delete(id);
        }),
      );
      this.saveResolves.forEach((resolve) => resolve());
      this.saveResolves = [];
    }
  }

  whenSynced(): Promise<void> {
    if (this.pending.size) {
      return new Promise((resolve) => {
        this.saveResolves.push(resolve);
      });
    }
    return Promise.resolve();
  }

  hasPending(): boolean {
    return !!this.pending.size;
  }

  protected pollInternal = async () => {
    await this.sync();
    this.pollTimeout = setTimeout(this.pollInternal, 4000);
  };

  poll(): void {
    if (this.pollTimeout) {
      return;
    }
    this.pollInternal();
  }

  // TODO: when to connect to the document?
  async connect(id: string): Promise<void> {
    const doc = this.documents[id];
    if (doc == null) {
      throw new Error("Unknown document");
    }
    const updates = await this.connection.updates(id, doc.snapshot.version);
    for await (const revisions of updates) {
      for (const revision of revisions) {
        doc.ingest(revision);
      }
    }
  }

  async createDocument(id: string, initial?: string): Promise<Document> {
    const doc = Document.create(id, this, initial);
    this.documents[id] = doc;
    this.save(doc.id, { force: true });
    return doc;
  }

  async getDocument(id: string): Promise<Document> {
    if (this.documents[id]) {
      return this.documents[id];
    }
    const snapshot = await this.connection.fetchSnapshot(id);
    const revisions = await this.connection.fetchRevisions(
      id,
      snapshot.version,
    );
    const doc = Document.from(id, this, snapshot, revisions);
    this.documents[id] = doc;
    return doc;
  }
}

import { Channel, FixedBuffer } from "./channel";

export class InMemoryStorage implements Connection {
  protected clientVersionsById: Record<string, Record<string, number>> = {};
  protected snapshotsById: Record<string, Snapshot[]> = {};
  protected revisionsById: Record<string, Revision[]> = {};
  protected channelsById: Record<string, Channel<Revision[]>[]> = {};

  async fetchRevisions(
    id: string,
    from?: number,
    to?: number,
  ): Promise<Revision[]> {
    if (this.clientVersionsById[id] == null) {
      throw new Error("Unknown document");
    }
    if (from == null) {
      const snapshots = this.snapshotsById[id];
      if (snapshots.length) {
        from = snapshots[snapshots.length - 1].version + 1;
      } else {
        from = 0;
      }
    }
    return this.revisionsById[id].slice(from, to);
  }

  async fetchSnapshot(id: string, min?: number): Promise<Snapshot> {
    if (this.clientVersionsById[id] == null) {
      throw new Error("Unknown document");
    }
    const snapshots = this.snapshotsById[id];
    if (snapshots == null || !snapshots.length) {
      return { visible: "", hidden: "", hiddenSeq: [], version: -1 };
    } else if (min == null) {
      return snapshots[snapshots.length - 1];
    }
    for (let i = snapshots.length - 1; i > 0; i--) {
      const snapshot = snapshots[i];
      if (snapshot.version <= min) {
        return snapshot;
      }
    }
    return snapshots[0];
  }

  saveRevision(id: string, revision: Revision): Revision {
    const clientVersions: Record<string, number> = this.clientVersionsById[id];
    if (clientVersions == null) {
      if (revision.localVersion !== 0) {
        throw new Error("Unknown document");
      }
      this.clientVersionsById[id] = {};
      this.clientVersionsById[id][revision.clientId] = revision.localVersion;
      revision = { ...revision, version: 0 };
      this.revisionsById[id] = [revision];
      this.snapshotsById[id] = [];
      this.channelsById[id] = [];
      return revision;
    }
    const expectedLocalVersion =
      clientVersions[revision.clientId] == null
        ? 0
        : clientVersions[revision.clientId] + 1;
    // TODO: reject revision if lastKnownVersion is too far off current version
    // TODO: reject if we don’t have a recent-enough snapshot
    if (revision.localVersion > expectedLocalVersion) {
      throw new Error("Missing revision");
    } else if (revision.localVersion < expectedLocalVersion) {
      if (
        revision.version === 0 &&
        revision.clientId !== this.revisionsById[id][0].clientId
      ) {
        throw new Error("Document already exists");
      }
      return revision;
    }
    revision = { ...revision, version: this.revisionsById[id].length };
    this.revisionsById[id].push(revision);
    clientVersions[revision.clientId] = revision.localVersion;
    return revision;
  }

  // TODO: run this in a transaction
  async sendRevisions(id: string, revisions: Revision[]): Promise<Revision[]> {
    revisions = revisions.map((revision) => this.saveRevision(id, revision));
    this.channelsById[id].map(async (channel, i) => {
      try {
        await channel.put(revisions);
      } catch (err) {
        channel.close();
        this.channelsById[id].splice(i, 1);
      }
    });
    return revisions;
  }

  async sendSnapshot(id: string, snapshot: Snapshot): Promise<Snapshot> {
    if (this.clientVersionsById[id] == null) {
      throw new Error("Unknown document");
    }
    const snapshots = this.snapshotsById[id];
    if (!snapshots.length) {
      snapshots.push(snapshot);
      return snapshot;
    }
    for (let i = snapshots.length - 1; i > 0; i--) {
      const snapshot1 = snapshots[i];
      if (snapshot1.version === snapshot.version) {
        return snapshot;
      } else if (snapshot1.version < snapshot.version) {
        snapshots.splice(i + 1, 0, snapshot);
        return snapshot;
      }
    }
    snapshots.unshift(snapshot);
    return snapshot;
  }

  async updates(id: string, from?: number): Promise<AsyncIterable<Revision[]>> {
    if (this.clientVersionsById[id] == null) {
      throw new Error("Unknown document");
    }
    let channels: Channel<Revision[]>[] = this.channelsById[id];
    const channel = new Channel(new FixedBuffer<Revision[]>(1000));
    channels.push(channel);
    channel.onclose = () => {
      const i = channels.indexOf(channel);
      if (i > -1) {
        channels.splice(i, 1);
      }
    };
    if (from != null) {
      const revisions = await this.fetchRevisions(id, from);
      channel.put(revisions);
    }
    return channel;
  }

  async close(id: string): Promise<void> {
    if (this.clientVersionsById[id] == null) {
      throw new Error("Unknown document");
    }
    await Promise.all(this.channelsById[id].map((channel) => channel.close()));
    this.channelsById[id] = [];
  }
}
