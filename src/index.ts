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

type SubseqIteratorValue = [number, boolean];

export class SubseqIterator implements IterableIterator<SubseqIteratorValue> {
  private i: number = 1;

  constructor(private subseq: Subseq) {}

  next(): IteratorResult<SubseqIteratorValue> {
    const length = this.subseq[this.i];
    if (length == null) {
      return { done: true } as IteratorResult<SubseqIteratorValue>;
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
  for (const [length, flag] of new SubseqIterator(subseq)) {
    result += flag ? "+".repeat(length) : "=".repeat(length);
  }
  return result;
}

export function count(subseq: Subseq, test?: boolean): number {
  let result = 0;
  for (const [length, flag] of new SubseqIterator(subseq)) {
    if (test == null || test === flag) {
      result += length;
    }
  }
  return result;
}

export function clear(subseq: Subseq): Subseq {
  const length = count(subseq);
  const result: Subseq = [];
  if (length) {
    push(result, length, false);
  }
  return result;
}

export function extract(str: string, subseq: Subseq): string {
  let consumed = 0;
  let result = "";
  for (const [length, flag] of new SubseqIterator(subseq)) {
    consumed += length;
    if (flag) {
      result += str.slice(consumed - length, consumed);
    }
  }
  return result;
}

export function complement(subseq: Subseq): Subseq {
  if (!subseq.length) {
    return subseq;
  }
  return [subseq[0] ? 0 : 1].concat(subseq.slice(1));
}

type ZipIteratorValue = [number, boolean, boolean];

export class ZipIterator implements IterableIterator<ZipIteratorValue> {
  private i1: number = 1;
  private i2: number = 1;
  private consumed: number = 0;
  private consumed1: number = 0;
  private consumed2: number = 0;
  constructor(private subseq1: Subseq, private subseq2: Subseq) {}

  next(): IteratorResult<ZipIteratorValue> {
    const length1 = this.subseq1[this.i1];
    const length2 = this.subseq2[this.i2];
    const flag1 = flagAt(this.subseq1, this.i1);
    const flag2 = flagAt(this.subseq2, this.i2);
    if (length1 == null || length2 == null) {
      if (length1 || length2) {
        throw new Error("Length mismatch");
      }
      return { done: true } as IteratorResult<ZipIteratorValue>;
    }
    let length: number;
    if (length1 + this.consumed1 === length2 + this.consumed2) {
      this.consumed1 += length1;
      this.consumed2 += length2;
      this.i1++;
      this.i2++;
      length = this.consumed1 - this.consumed;
    } else if (length1 + this.consumed1 < length2 + this.consumed2) {
      this.consumed1 += length1;
      this.i1++;
      length = this.consumed1 - this.consumed;
    } else {
      this.consumed2 += length2;
      this.i2++;
      length = this.consumed2 - this.consumed;
    }
    this.consumed += length;
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

export function union(subseq1: Subseq, subseq2: Subseq): Subseq {
  return new ZipIterator(subseq1, subseq2).join(
    (flag1, flag2) => flag1 || flag2,
  );
}

export function difference(subseq1: Subseq, subseq2: Subseq): Subseq {
  return new ZipIterator(subseq1, subseq2).join(
    (flag1, flag2) => flag1 && !flag2,
  );
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
  const iter1 = new SubseqIterator(subseq1);
  for (let [length2, flag2] of new SubseqIterator(subseq2)) {
    if (flag2) {
      push(result, length2, union);
    } else {
      while (length2 > 0) {
        if (length1 == null || length1 === 0) {
          const it = iter1.next();
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
  if (!iter1.next().done || (length1 != null && length1 > 0)) {
    throw new Error("Length mismatch");
  }
  return result;
}

export function shrink(subseq1: Subseq, subseq2: Subseq): Subseq {
  const result: Subseq = [];
  for (const [length, flag1, flag2] of new ZipIterator(subseq1, subseq2)) {
    if (!flag2) {
      push(result, length, flag1);
    }
  }
  return result;
}

export function interleave(subseq1: Subseq, subseq2: Subseq): [Subseq, Subseq] {
  const iter1 = new SubseqIterator(subseq1);
  const iter2 = new SubseqIterator(subseq2);
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
    push(resultBefore, length1, flag1);
    push(resultAfter, length1, flag1);
    if (!iter1.next().done) {
      throw new Error("Length mismatch");
    }
  }

  if (!it2.done) {
    const [length2] = it2.value;
    push(resultBefore, length2, false);
    push(resultAfter, length2, false);
    if (!iter2.next().done) {
      throw new Error("Length mismatch");
    }
  }

  return [resultBefore, resultAfter];
}

// TODO: explain patch format
export type Patch = (string | number)[];

export function apply(text: string, patch: Patch): string {
  const length = patch[patch.length - 1];
  if (typeof length !== "number") {
    throw new Error("Malformed patch");
  } else if (length !== text.length) {
    throw new Error("Length mismatch");
  }
  let text1 = "";
  let consumed = 0;
  let start: number | undefined;
  for (const p of patch) {
    if (start != null) {
      if (typeof p !== "number" || p < consumed) {
        throw new Error("Malformed patch");
      }
      text1 += text.slice(start, p);
      consumed = p;
      start = undefined;
    } else if (typeof p === "number") {
      if (p < consumed) {
        throw new Error("Malformed patch");
      }
      consumed = p;
      start = p;
    } else {
      text1 += p;
    }
  }
  return text1;
}

export function factor(patch: Patch): [string, Subseq, Subseq] {
  const insertSeq: Subseq = [];
  const deleteSeq: Subseq = [];
  const length = patch[patch.length - 1];
  if (typeof length !== "number") {
    throw new Error("Malformed patch");
  }
  // TODO: maybe use type of string[]
  let inserted: string = "";
  let consumed = 0;
  let start: number | undefined;
  for (const p of patch) {
    if (start != null) {
      if (typeof p !== "number" || p < consumed || p > length) {
        throw new Error("Malformed patch");
      }
      push(insertSeq, p - start, false);
      push(deleteSeq, p - start, false);
      consumed = p;
      start = undefined;
    } else if (typeof p === "number") {
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
  return [inserted, insertSeq, deleteSeq];
}

export function synthesize(
  inserted: string,
  insertSeq: Subseq,
  deleteSeq: Subseq = clear(insertSeq),
): Patch {
  const patch: Patch = [];
  let i = 0; // insert index
  let consumed = 0;
  for (const [length, iFlag, dFlag] of new ZipIterator(insertSeq, deleteSeq)) {
    if (iFlag) {
      i += length;
      if (!dFlag) {
        patch.push(inserted.slice(i - length, i));
      }
    } else {
      consumed += length;
      if (!dFlag) {
        patch.push(consumed - length, consumed);
      }
    }
  }
  const last = patch[patch.length - 1];
  const length = count(insertSeq, false);
  if (typeof last !== "number" || last < length) {
    patch.push(length);
  }
  return patch;
}

export function shuffle(
  text1: string,
  text2: string,
  subseq1: Subseq,
  subseq2: Subseq,
): [string, string] {
  return [
    apply(text1, synthesize(text2, subseq1, subseq2)),
    apply(text2, synthesize(text1, complement(subseq1), complement(subseq2))),
  ];
}

export interface Snapshot {
  visible: string;
  hidden: string;
  hiddenSeq: Subseq;
  version: number;
}

export interface Message {
  patch: Patch;
  clientId: string;
  priority: number;
  version?: number;
  localVersion: number;
  lastKnownVersion: number;
}

export interface Revision {
  clientId: string;
  priority: number;
  localVersion: number;
  insertSeq: Subseq;
  deleteSeq: Subseq;
}

export class Document {
  public connected = false;
  protected constructor(
    // TODO: does a document need to know its own id
    public id: string,
    // TODO: does a document need to know its own client
    public client: Client,
    public snapshot: Snapshot,
    protected revisions: Revision[],
    protected lastKnownVersion = -1,
    protected localVersion = 0,
  ) {}

  static create(id: string, client: Client, initial: string = ""): Document {
    const snapshot: Snapshot = {
      visible: initial,
      hidden: "",
      hiddenSeq: initial.length ? [0, initial.length] : [],
      version: 0,
    };
    const revision: Revision = {
      clientId: client.id,
      priority: 0,
      localVersion: 0,
      insertSeq: initial.length ? [1, initial.length] : [],
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

  hiddenSeqAt(version: number, clientId?: string): Subseq {
    let hiddenSeq: Subseq = this.snapshot.hiddenSeq;
    const revisions = this.revisions.slice(version + 1).reverse();
    for (const revision of revisions) {
      if (clientId === revision.clientId) {
        // TODO: figure out what to do here
      }
      hiddenSeq = shrink(hiddenSeq, revision.insertSeq);
      hiddenSeq = difference(hiddenSeq, revision.deleteSeq);
    }
    return hiddenSeq;
  }

  snapshotAt(version: number): Snapshot {
    const hiddenSeq: Subseq = this.hiddenSeqAt(version);
    let insertSeq: Subseq = clear(hiddenSeq);
    for (const revision of this.revisions.slice(version + 1)) {
      insertSeq = expand(insertSeq, revision.insertSeq, { union: true });
    }
    let { visible, hidden, hiddenSeq: hiddenSeq1 } = this.snapshot;
    const hiddenSeq2 = expand(hiddenSeq, insertSeq);
    visible = apply(
      visible,
      synthesize(hidden, hiddenSeq1, union(hiddenSeq2, insertSeq)),
    );
    hidden = apply(
      hidden,
      synthesize("", complement(hiddenSeq1), complement(hiddenSeq2)),
    );
    return { visible, hidden, hiddenSeq, version };
  }

  patchAt(version: number): Patch {
    const revision: Revision =
      this.revisions[version] || this.revisions[this.revisions.length - 1];
    const snapshot: Snapshot = this.snapshotAt(version);
    let insertSeq = revision.insertSeq;
    let deleteSeq = expand(revision.deleteSeq, revision.insertSeq);
    const hiddenSeq = difference(snapshot.hiddenSeq, deleteSeq);
    insertSeq = shrink(insertSeq, hiddenSeq);
    deleteSeq = shrink(deleteSeq, hiddenSeq);
    const inserted = extract(snapshot.visible, shrink(insertSeq, deleteSeq));
    const patch = synthesize(inserted, insertSeq, deleteSeq);
    return patch;
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
  ): [string, Revision, Snapshot] {
    let { insertSeq, deleteSeq } = revision;
    let { visible, hidden, hiddenSeq } = snapshot;

    if (count(deleteSeq, true) > 0) {
      let hiddenSeq1: Subseq;
      hiddenSeq1 = union(hiddenSeq, deleteSeq);
      [visible, hidden] = shuffle(visible, hidden, hiddenSeq, hiddenSeq1);
      hiddenSeq = hiddenSeq1;
    }

    if (inserted.length) {
      hiddenSeq = expand(hiddenSeq, insertSeq);
      const insertSeq1 = shrink(insertSeq, hiddenSeq);
      visible = apply(visible, synthesize(inserted, insertSeq1));
    }

    snapshot = { visible, hidden, hiddenSeq, version: snapshot.version + 1 };
    return [inserted, revision, snapshot];
  }

  edit(
    patch: Patch,
    priority: number = 0,
    version: number = this.revisions.length - 1,
  ): void {
    if (version < 0 || version > this.revisions.length - 1) {
      throw new Error("Version out of range");
    }
    let [inserted, insertSeq, deleteSeq] = factor(patch);
    {
      const hiddenSeq = this.hiddenSeqAt(version);
      [, insertSeq] = interleave(insertSeq, hiddenSeq);
      deleteSeq = expand(deleteSeq, hiddenSeq);
    }

    for (const revision of this.revisions.slice(version + 1)) {
      if (
        priority === revision.priority &&
        this.client.id === revision.clientId
      ) {
        throw new Error(
          "Cannot have concurrent edits with the same client and priority",
        );
      }
      const before =
        priority !== revision.priority
          ? priority < revision.priority
          : this.client.id < revision.clientId;
      deleteSeq = difference(deleteSeq, revision.deleteSeq);
      if (before) {
        [insertSeq] = interleave(insertSeq, revision.insertSeq);
      } else {
        [, insertSeq] = interleave(insertSeq, revision.insertSeq);
      }
      deleteSeq = expand(deleteSeq, revision.insertSeq);
    }
    let revision: Revision = {
      clientId: this.client.id,
      priority,
      localVersion: this.localVersion,
      insertSeq,
      deleteSeq,
    };
    let snapshot: Snapshot;
    [, revision, snapshot] = this.apply(inserted, revision);
    this.revisions.push(revision);
    this.localVersion += 1;
    this.snapshot = snapshot;
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
    let snapshot = this.snapshot;
    const inserted = extract(
      apply(snapshot.visible, synthesize(snapshot.hidden, snapshot.hiddenSeq)),
      insertSeq,
    );
    [, insertSeq] = interleave(insertSeq, insertSeq);
    const revision1: Revision = {
      clientId: this.client.id,
      priority: 0,
      localVersion: this.localVersion,
      insertSeq,
      deleteSeq,
    };
    [, , snapshot] = this.apply(inserted, revision1);
    this.revisions.push(revision);
    this.localVersion += 1;
    this.snapshot = snapshot;
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
    let [inserted, insertSeq, deleteSeq] = factor(message.patch);
    {
      const hiddenSeq = this.hiddenSeqAt(
        message.lastKnownVersion,
        message.clientId,
      );
      [, insertSeq] = interleave(insertSeq, hiddenSeq);
      deleteSeq = expand(deleteSeq, hiddenSeq);
    }
    for (const revision of this.revisions.slice(
      message.lastKnownVersion + 1,
      this.lastKnownVersion + 1,
    )) {
      if (message.clientId === revision.clientId) {
        [, insertSeq] = interleave(insertSeq, revision.insertSeq);
        deleteSeq = expand(deleteSeq, revision.insertSeq);
      } else {
        const before =
          message.priority !== revision.priority
            ? message.priority < revision.priority
            : message.clientId < revision.clientId;
        if (before) {
          [insertSeq] = interleave(insertSeq, revision.insertSeq);
        } else {
          [, insertSeq] = interleave(insertSeq, revision.insertSeq);
        }
        deleteSeq = difference(deleteSeq, revision.deleteSeq);
        deleteSeq = expand(deleteSeq, revision.insertSeq);
      }
    }
    const revision: Revision = {
      clientId: message.clientId,
      priority: message.priority,
      localVersion: message.localVersion,
      insertSeq,
      deleteSeq,
    };
    this.revisions.splice(this.lastKnownVersion + 1, 0, revision);
    for (const revision1 of this.revisions.slice(this.lastKnownVersion + 2)) {
      const before =
        message.priority !== revision1.priority
          ? message.priority < revision1.priority
          : message.clientId < revision1.clientId;
      if (before) {
        [insertSeq] = interleave(insertSeq, revision1.insertSeq);
      } else {
        [, insertSeq] = interleave(insertSeq, revision1.insertSeq);
      }
      deleteSeq = difference(deleteSeq, revision1.deleteSeq);
      deleteSeq = expand(deleteSeq, revision1.insertSeq);
      revision1.insertSeq = expand(revision1.insertSeq, insertSeq);
      revision1.deleteSeq = expand(
        revision1.deleteSeq,
        shrink(insertSeq, revision1.insertSeq),
      );
    }
    const revision1: Revision = { ...revision, insertSeq, deleteSeq };
    const [, , snapshot] = this.apply(inserted, revision1);
    this.snapshot = snapshot;
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

import { Channel, FixedBuffer } from "./channel";

export interface Connection {
  fetchSnapshot(id: string, min?: number): Promise<Snapshot>;
  fetchMessages(id: string, from?: number, to?: number): Promise<Message[]>;
  sendMessages(id: string, messages: Message[]): Promise<Message[]>;
  sendSnapshot(id: string, snapshot: Snapshot): Promise<Snapshot>;
  messagesChannel(id: string, from?: number): Promise<Channel<Message[]>>;
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
