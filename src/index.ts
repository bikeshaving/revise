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

// [length, flag]
export type Segment = [number, boolean];

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

// [length, flag1, flag2]
export type ZippedSegment = [number, boolean, boolean];

export class ZippedSegmentIterator implements IterableIterator<ZippedSegment> {
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

  next(): IteratorResult<ZippedSegment> {
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

// TODO: return subseq1 expanded against the insertions of subseq2 and subseq2 expanded against the insertions of subseq1 instead of subseq1 expanded before/after
export function interleave(subseq1: Subseq, subseq2: Subseq): [Subseq, Subseq] {
  const iter1 = new SegmentIterator(subseq1);
  const iter2 = new SegmentIterator(subseq2);
  let it1 = iter1.next();
  let it2 = iter2.next();
  const resultBefore: Subseq = [];
  const resultAfter: Subseq = [];

  while (!it1.done && !it2.done) {
    const [length1, flag1] = it1.value;
    const [length2, flag2] = it2.value;
    if (flag1 && flag2) {
      push(resultBefore, length1, true);
      push(resultBefore, length2, false);
      push(resultAfter, length2, false);
      push(resultAfter, length1, true);
      it1 = iter1.next();
      it2 = iter2.next();
    } else if (flag1) {
      push(resultBefore, length1, true);
      push(resultAfter, length1, true);
      it1 = iter1.next();
    } else if (flag2) {
      push(resultBefore, length2, false);
      push(resultAfter, length2, false);
      it2 = iter2.next();
    } else {
      const length = Math.min(length1, length2);
      push(resultBefore, length, false);
      push(resultAfter, length, false);
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
    push(resultBefore, length1, flag1);
    push(resultAfter, length1, flag1);
  }

  if (!it2.done) {
    const [length2, flag2] = it2.value;
    if (!flag2 || !iter2.next().done) {
      throw new Error("Length mismatch");
    }
    push(resultBefore, length2, false);
    push(resultAfter, length2, false);
  }

  return [resultBefore, resultAfter];
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

interface FactorResult {
  inserted: string;
  insertSeq: Subseq;
  deleteSeq: Subseq;
}

export function factor(patch: Patch): FactorResult {
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
  insertSeq: Subseq;
  deleteSeq: Subseq;
  clientId: string;
  priority: number;
  localVersion: number;
}

// TODO: combine Revision and Message by using patch in Revision
export interface Message {
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
): [Revision, Revision[]] {
  let { insertSeq, deleteSeq } = revision;
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
    insertSeq = interleave(insertSeq, revision1.insertSeq)[before ? 0 : 1];
    let deleteSeq1 = difference(revision1.deleteSeq, deleteSeq);
    deleteSeq = expand(deleteSeq, revision1.insertSeq);
    const insertSeq1 = expand(revision1.insertSeq, insertSeq);
    deleteSeq1 = expand(deleteSeq1, shrink(insertSeq, insertSeq1));
    revisions1.push({
      ...revision1,
      insertSeq: insertSeq1,
      deleteSeq: deleteSeq1,
    });
  }
  revision = { ...revision, insertSeq, deleteSeq };
  return [revision, revisions1];
}

function summarize(revisions: Revision[], clientId?: string): [Subseq, Subseq] {
  if (!revisions.length) {
    throw new Error("Empty revisions");
  }
  let { insertSeq, deleteSeq } = revisions[0];
  deleteSeq = expand(deleteSeq, insertSeq);
  if (revisions[0].clientId === clientId) {
    insertSeq = clear(insertSeq);
    deleteSeq = clear(deleteSeq);
  }
  for (const revision of revisions.slice(1)) {
    const own = clientId === revision.clientId;
    insertSeq = expand(insertSeq, revision.insertSeq, { union: !own });
    deleteSeq = own
      ? difference(deleteSeq, revision.deleteSeq)
      : union(deleteSeq, revision.deleteSeq);
    deleteSeq = expand(deleteSeq, revision.insertSeq);
  }
  return [insertSeq, deleteSeq];
}

export class Document {
  protected constructor(
    // TODO: does a document need to know its own id
    public id: string,
    // TODO: does a document need to know its own client besides clientId
    public client: Client,
    public snapshot: Snapshot,
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
      clientId: client.id,
      priority: 0,
      localVersion: 0,
      insertSeq: full(initial.length),
      deleteSeq: [],
    };
    return new Document(id, client, snapshot, [revision], -1, 1);
  }

  static from(
    id: string,
    client: Client,
    snapshot: Snapshot,
    messages: Message[],
  ): Document {
    const doc = new Document(id, client, snapshot, [], snapshot.version);
    for (const message of messages) {
      doc.ingest(message);
    }
    return doc;
  }

  hiddenSeqAt(version: number): Subseq {
    let hiddenSeq = this.snapshot.hiddenSeq;
    const revisions = this.revisions.slice(version + 1).reverse();
    for (const revision of revisions) {
      hiddenSeq = shrink(hiddenSeq, revision.insertSeq);
      hiddenSeq = difference(hiddenSeq, revision.deleteSeq);
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
    let insertSeq = revision.insertSeq;
    let deleteSeq = expand(revision.deleteSeq, revision.insertSeq);
    const hiddenSeq = difference(snapshot.hiddenSeq, deleteSeq);
    insertSeq = shrink(insertSeq, hiddenSeq);
    deleteSeq = shrink(deleteSeq, hiddenSeq);
    const [inserted] = split(snapshot.visible, shrink(insertSeq, deleteSeq));
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

  apply(
    inserted: string,
    revision: Revision,
    snapshot: Snapshot = this.snapshot,
  ): Snapshot {
    let { insertSeq, deleteSeq } = revision;
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
    let revision: Revision = {
      clientId: this.client.id,
      priority,
      localVersion: this.localVersion,
      insertSeq: interleave(insertSeq, hiddenSeq)[1],
      deleteSeq: expand(deleteSeq, hiddenSeq),
    };
    [revision] = rebase(revision, this.revisions.slice(version + 1));
    revision = {
      ...revision,
      deleteSeq: difference(revision.deleteSeq, this.snapshot.hiddenSeq),
    };
    this.snapshot = this.apply(inserted, revision);
    this.revisions.push(revision);
    this.localVersion++;
    this.client.save(this.id);
  }

  undo(version: number): void {
    const [revision, ...revisions] = this.revisions.slice(version);
    let deleteSeq = revision.insertSeq;
    let insertSeq = expand(revision.deleteSeq, revision.insertSeq);
    for (const revision of revisions) {
      deleteSeq = expand(deleteSeq, revision.insertSeq);
      insertSeq = expand(insertSeq, revision.insertSeq);
    }
    const { visible, hidden, hiddenSeq } = this.snapshot;
    const [inserted] = split(merge(hidden, visible, hiddenSeq), insertSeq);
    insertSeq = interleave(insertSeq, insertSeq)[1];
    const revision1: Revision = {
      clientId: this.client.id,
      priority: 0,
      localVersion: this.localVersion,
      insertSeq,
      deleteSeq: difference(deleteSeq, this.snapshot.hiddenSeq),
    };
    this.snapshot = this.apply(inserted, revision1);
    this.revisions.push(revision1);
    this.localVersion++;
    this.client.save(this.id);
  }

  ingest(message: Message): void {
    if (message.version == null) {
      throw new Error("Missing message version");
    } else if (
      this.lastKnownVersion + 1 < message.version ||
      this.lastKnownVersion < message.lastKnownVersion
    ) {
      // TODO: attempt repair
      throw new Error("Missing message");
    } else if (message.version <= this.lastKnownVersion) {
      return;
    } else if (message.clientId === this.client.id) {
      this.lastKnownVersion = message.version;
      return;
    }
    let lastKnownVersion = message.lastKnownVersion;
    for (let v = this.lastKnownVersion; v >= lastKnownVersion; v--) {
      if (message.clientId === this.revisions[v].clientId) {
        lastKnownVersion = v;
        break;
      }
    }
    let hiddenSeq = this.hiddenSeqAt(lastKnownVersion);
    let baseInsertSeq: Subseq | undefined;
    if (message.lastKnownVersion < lastKnownVersion) {
      const revisions = this.revisions.slice(
        message.lastKnownVersion + 1,
        lastKnownVersion + 1,
      );
      let baseDeleteSeq: Subseq | undefined;
      [baseInsertSeq, baseDeleteSeq] = summarize(revisions, message.clientId);
      hiddenSeq = difference(hiddenSeq, baseDeleteSeq);
      hiddenSeq = shrink(hiddenSeq, baseInsertSeq);
    }
    let { inserted, insertSeq, deleteSeq } = factor(message.patch);
    let revision: Revision = {
      clientId: message.clientId,
      priority: message.priority,
      localVersion: message.localVersion,
      insertSeq: interleave(insertSeq, hiddenSeq)[1],
      deleteSeq: expand(deleteSeq, hiddenSeq),
    };
    if (baseInsertSeq != null) {
      revision.insertSeq = expand(revision.insertSeq, baseInsertSeq);
      revision.deleteSeq = expand(revision.deleteSeq, baseInsertSeq);
    }
    let revisions = this.revisions.slice(
      lastKnownVersion + 1,
      this.lastKnownVersion + 1,
    );
    [revision] = rebase(revision, revisions);
    revisions = this.revisions.slice(this.lastKnownVersion + 1);
    this.revisions.splice(
      this.lastKnownVersion + 1,
      revisions.length,
      revision,
    );
    [revision, revisions] = rebase(revision, revisions);
    this.revisions = this.revisions.concat(revisions);
    this.snapshot = this.apply(inserted, revision);
    this.lastKnownVersion = message.version;
  }

  createMessages(
    from: number = this.lastKnownVersion + 1,
    to?: number,
  ): Message[] {
    if (from > this.revisions.length) {
      throw new Error("from greater than this.revisions.length");
    }
    const revisions = this.revisions.slice(from, to);
    return revisions.map((revision, i) => {
      return {
        // TODO: only compute this once and bring it forward?
        patch: this.patchAt(from + i),
        clientId: revision.clientId,
        priority: revision.priority,
        localVersion: revision.localVersion,
        lastKnownVersion: this.lastKnownVersion,
      };
    });
  }
}

export interface Connection {
  fetchSnapshot(id: string, min?: number): Promise<Snapshot>;
  fetchMessages(id: string, from?: number, to?: number): Promise<Message[]>;
  sendMessages(id: string, messages: Message[]): Promise<Message[]>;
  sendSnapshot(id: string, snapshot: Snapshot): Promise<Snapshot>;
  messagesChannel(id: string, from?: number): Promise<AsyncIterable<Message[]>>;
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
            await this.connection.sendMessages(id, doc.createMessages());
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

  async connect(id: string): Promise<void> {
    const doc = this.documents[id];
    if (doc == null) {
      throw new Error("Unknown document");
    }
    const messagesChannel = await this.connection.messagesChannel(
      id,
      doc.snapshot.version,
    );
    for await (const messages of messagesChannel) {
      for (const message of messages) {
        doc.ingest(message);
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
    const messages = await this.connection.fetchMessages(id, snapshot.version);
    const doc = Document.from(id, this, snapshot, messages);
    this.documents[id] = doc;
    return doc;
  }
}

import { Channel, FixedBuffer } from "./channel";

export class InMemoryStorage implements Connection {
  protected clientVersionsById: Record<string, Record<string, number>> = {};
  protected snapshotsById: Record<string, Snapshot[]> = {};
  protected messagesById: Record<string, Message[]> = {};
  protected channelsById: Record<string, Channel<Message[]>[]> = {};

  async fetchMessages(
    id: string,
    from?: number,
    to?: number,
  ): Promise<Message[]> {
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
    return this.messagesById[id].slice(from, to);
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

  saveMessage(id: string, message: Message): Message {
    const clientVersions: Record<string, number> = this.clientVersionsById[id];
    if (clientVersions == null) {
      if (message.localVersion !== 0) {
        throw new Error("Unknown document");
      }
      this.clientVersionsById[id] = {};
      this.clientVersionsById[id][message.clientId] = message.localVersion;
      message = { ...message, version: 0 };
      this.messagesById[id] = [message];
      this.snapshotsById[id] = [];
      this.channelsById[id] = [];
      return message;
    }
    const expectedLocalVersion =
      clientVersions[message.clientId] == null
        ? 0
        : clientVersions[message.clientId] + 1;
    // TODO: reject message if lastKnownVersion is too far off current version
    // TODO: reject if we don’t have a recent-enough snapshot
    if (message.localVersion > expectedLocalVersion) {
      throw new Error("Missing message");
    } else if (message.localVersion < expectedLocalVersion) {
      if (
        message.version === 0 &&
        message.clientId !== this.messagesById[id][0].clientId
      ) {
        throw new Error("Document already exists");
      }
      return message;
    }
    message = { ...message, version: this.messagesById[id].length };
    this.messagesById[id].push(message);
    clientVersions[message.clientId] = message.localVersion;
    return message;
  }

  // TODO: run this in a transaction
  async sendMessages(id: string, messages: Message[]): Promise<Message[]> {
    messages = messages.map((message) => this.saveMessage(id, message));
    this.channelsById[id].map(async (channel, i) => {
      try {
        await channel.put(messages);
      } catch (err) {
        channel.close();
        this.channelsById[id].splice(i, 1);
      }
    });
    return messages;
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

  async messagesChannel(
    id: string,
    from?: number,
  ): Promise<Channel<Message[]>> {
    if (this.clientVersionsById[id] == null) {
      throw new Error("Unknown document");
    }
    let channels: Channel<Message[]>[] = this.channelsById[id];
    const channel = new Channel(new FixedBuffer<Message[]>(1000));
    channels.push(channel);
    channel.onclose = () => {
      const i = channels.indexOf(channel);
      if (i > -1) {
        channels.splice(i, 1);
      }
    };
    if (from != null) {
      const messages = await this.fetchMessages(id, from);
      channel.put(messages);
    }
    return channel;
  }
}
