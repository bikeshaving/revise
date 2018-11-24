import uuid from "uuid/v4";
import EventEmitter from "events";

// [flag, ...lengths]
export type Subseq = number[];

export function count(subseq: Subseq, test?: boolean): number {
  let flag: boolean = !!subseq[0];
  let result: number = 0;
  for (const length of subseq.slice(1)) {
    if (test == null || test === flag) {
      result += length;
    }
    flag = !flag;
  }
  return result;
}

export function pushSegment(
  subseq: Subseq,
  length: number,
  flag: boolean,
): number {
  if (length <= 0) {
    throw new Error("Cannot push empty segment");
  } else if (!subseq.length) {
    subseq.push(flag ? 1 : 0, length);
  } else {
    const flag1: boolean = !!subseq[0] === (subseq.length % 2 === 0);
    if (flag === flag1) {
      subseq[subseq.length - 1] += length;
    } else {
      subseq.push(length);
    }
  }
  return subseq.length;
}

type ZipValue = [number, boolean, boolean];
class ZipIterator implements IterableIterator<ZipValue> {
  private i1: number = 1;
  private i2: number = 1;
  private consumed1: number = 0;
  private consumed2: number = 0;
  private consumed: number = 0;
  constructor(private subseq1: Subseq, private subseq2: Subseq) {}

  public next(): IteratorResult<ZipValue> {
    const length1 = this.subseq1[this.i1];
    const length2 = this.subseq2[this.i2];
    const flag1 = !this.subseq1[0] === (this.i1 % 2 === 0);
    const flag2 = !this.subseq2[0] === (this.i2 % 2 === 0);
    if (length1 == null || length2 == null) {
      if (length1 || length2) {
        throw new Error("Length mismatch");
      }
      return ({ done: true } as any) as IteratorResult<ZipValue>;
    }
    let length: number;
    if (length1 + this.consumed1 === length2 + this.consumed2) {
      this.consumed1 += length1;
      this.consumed2 += length2;
      this.i1 += 1;
      this.i2 += 1;
      length = this.consumed1 - this.consumed;
    } else if (length1 + this.consumed1 < length2 + this.consumed2) {
      this.consumed1 += length1;
      this.i1 += 1;
      length = this.consumed1 - this.consumed;
    } else {
      this.consumed2 += length2;
      this.i2 += 1;
      length = this.consumed2 - this.consumed;
    }
    this.consumed += length;
    return {
      done: false,
      value: [length, flag1, flag2],
    };
  }

  public [Symbol.iterator]() {
    return this;
  }

  public join(fn: (flag1: boolean, flag2: boolean) => boolean): Subseq {
    const subseq: Subseq = [];
    for (const [length, flag1, flag2] of this) {
      pushSegment(subseq, length, fn(flag1, flag2));
    }
    return subseq;
  }
}

export function zip(a: Subseq, b: Subseq): ZipIterator {
  return new ZipIterator(a, b);
}

export function complement(subseq: Subseq): Subseq {
  return [subseq[0] ? 0 : 1, ...subseq.slice(1)];
}

export function union(subseq1: Subseq, subseq2: Subseq): Subseq {
  return zip(subseq1, subseq2).join((flag1, flag2) => flag1 || flag2);
}

export function difference(subseq1: Subseq, subseq2: Subseq): Subseq {
  return zip(subseq1, subseq2).join((flag1, flag2) => flag1 && !flag2);
}

export function intersection(subseq1: Subseq, subseq2: Subseq): Subseq {
  return zip(subseq1, subseq2).join((flag1, flag2) => flag1 && flag2);
}

export function expand(subseq1: Subseq, subseq2: Subseq): Subseq {
  const result: Subseq = [];

  let length1: number | undefined;
  let flag1: boolean = !subseq1[0];
  let flag2: boolean = !subseq2[0];
  subseq1 = subseq1.slice(1);
  for (let length2 of subseq2.slice(1)) {
    flag2 = !flag2;
    if (flag2) {
      pushSegment(result, length2, false);
    } else {
      while (length2 > 0) {
        if (length1 == null || length1 === 0) {
          if (!subseq1.length) {
            throw new Error("Length mismatch");
          }
          flag1 = !flag1;
          [length1, ...subseq1] = subseq1;
        }
        const consumed = Math.min(length1, length2);
        pushSegment(result, consumed, flag1);
        length1 -= consumed;
        length2 -= consumed;
      }
    }
  }
  if (subseq1.length || length1 == null || length1 > 0) {
    throw new Error("Length mismatch");
  }
  return result;
}

export function shrink(subseq1: Subseq, subseq2: Subseq): Subseq {
  const result: Subseq = [];
  for (const [length, flag1, flag2] of zip(subseq1, subseq2)) {
    if (!flag2) {
      pushSegment(result, length, flag1);
    }
  }
  return result;
}

export function rebase(
  subseq1: Subseq,
  subseq2: Subseq,
  before?: boolean,
): Subseq {
  if (count(subseq1, false) !== count(subseq2, false)) {
    throw new Error("Length mismatch");
  }
  const result: Subseq = [];
  let flag1: boolean = !!subseq1[0];
  let flag2: boolean = !!subseq2[0];
  let length1: number | undefined;
  let length2: number | undefined;
  [length1, ...subseq1] = subseq1.slice(1);
  [length2, ...subseq2] = subseq2.slice(1);
  while (length1 != null || length2 != null) {
    if (length1 == null) {
      if (flag2) {
        pushSegment(result, length2, false);
      }
      [length2, ...subseq2] = subseq2;
      flag2 = !flag2;
    } else if (length2 == null) {
      pushSegment(result, length1, flag1);
      [length1, ...subseq1] = subseq1;
      flag1 = !flag1;
    } else {
      if (flag2) {
        if (before) {
          pushSegment(result, length1, flag1);
        }
        pushSegment(result, length2, false);
        if (!before) {
          pushSegment(result, length1, flag1);
        }
        [length1, ...subseq1] = subseq1;
        flag1 = !flag1;
        [length2, ...subseq2] = subseq2;
        flag2 = !flag2;
      } else if (flag1) {
        pushSegment(result, length1, flag1);
        [length1, ...subseq1] = subseq1;
        flag1 = !flag1;
      } else {
        const length = Math.min(length1, length2);
        pushSegment(result, length, false);
        if (length1 - length > 0) {
          length1 -= length;
        } else {
          [length1, ...subseq1] = subseq1;
          flag1 = !flag1;
        }
        if (length2 - length > 0) {
          length2 -= length;
        } else {
          [length2, ...subseq2] = subseq2;
          flag2 = !flag2;
        }
      }
    }
  }
  return result;
}

// To apply a patch, copy from start (inclusive) to end (exclusive) and splice insert at end.
// Deletes are represented via omission
export interface PatchElement {
  start: number;
  end: number;
  insert: string;
}

export type Patch = PatchElement[];

export function apply(text: string, patch: Patch): string {
  let result = text.slice(0, 0);
  for (const { start, end, insert } of patch) {
    result += text.slice(start, end);
    result += insert;
  }
  return result;
}

export function factor(patch: Patch, length: number): [Subseq, Subseq, string] {
  const inserts: Subseq = [];
  const deletes: Subseq = [];
  let inserted: string = "";
  let consumed = 0;
  for (const { start, end, insert } of patch) {
    if (end - start > 0) {
      pushSegment(inserts, end - consumed, false);
      if (start > consumed) {
        pushSegment(deletes, start - consumed, true);
      }
      pushSegment(deletes, end - start, false);
    }
    if (insert.length) {
      inserted += insert;
      pushSegment(inserts, insert.length, true);
    }
    consumed = end;
  }
  if (length > consumed) {
    pushSegment(inserts, length - consumed, false);
    pushSegment(deletes, length - consumed, true);
  }
  return [inserts, deletes, inserted];
}

export function synthesize(
  inserted: string,
  from: Subseq,
  to: Subseq = [0, count(from)],
): Patch {
  const patch: Patch = [];
  let consumed = 0;
  let index = 0;
  let pe: PatchElement = {
    start: consumed,
    end: consumed,
    insert: "",
  };
  for (const [length, flag1, flag2] of zip(from, to)) {
    if (!flag1) {
      if (pe.insert.length || pe.end > pe.start) {
        patch.push(pe);
        pe = { start: consumed, end: consumed, insert: "" };
      }
      consumed += length;
      if (!flag2) {
        pe.start = consumed - length;
        pe.end = consumed;
      }
    } else {
      if (pe.end < consumed) {
        if (pe.end > pe.start) {
          patch.push(pe);
        }
        pe = { start: consumed, end: consumed, insert: "" };
      }
      index += length;
      if (!flag2) {
        pe.insert += inserted.slice(index - length, index);
      }
    }
  }
  if (pe.insert.length || pe.end > pe.start) {
    patch.push(pe);
  }
  return patch;
}

// TODO: Do the variable names make sense?
export function shuffle(
  from: string,
  to: string,
  inserts: Subseq,
  deletes: Subseq,
): [string, string] {
  const fromPatch = synthesize(to, inserts, deletes);
  const toPatch = synthesize(from, complement(inserts), complement(deletes));
  return [apply(from, fromPatch), apply(to, toPatch)];
}

export function createId(clientId: string, version: number) {
  return clientId + "@" + version;
}

export function splitId(id: string): [string, number] {
  const i = id.lastIndexOf("@");
  const clientId = id.slice(0, i);
  const version = parseInt(id.slice(i + 1));
  return [clientId, version];
}

export interface Message {
  patch: Patch;
  clientId: string;
  version: number;
  parentClientId?: string;
  parentVersion?: number;
  intent?: string;
}

export interface Snapshot {
  visible: string;
  hidden: string;
  deletes: Subseq;
  parentId?: string;
}

export interface Revision {
  clientId: string;
  version: number;
  // sequence of characters based on union which were inserted by this revision
  inserts: Subseq;
  // sequence of characters based on union which were deleted by this revision
  deletes: Subseq;
  intent?: string;
}

export interface RevisionLog {
  slice(start?: number, end?: number): Revision[];
  push(revision: Revision): number;
  locate(clientId: string, version: number): number;
  length: number;
}

export interface RevisionLogConstructor {
  new (): RevisionLog;
}

export class ArrayRevisionLog implements RevisionLog {
  public length: number;
  constructor(private revisions: Revision[] = []) {
    this.length = revisions.length;
  }

  public locate(clientId: string, version: number) {
    for (let i = this.revisions.length - 1; i >= 0; i--) {
      const revision = this.revisions[i];
      if (revision.clientId === clientId && revision.version === version) {
        return i;
      }
    }
    return -1;
  }

  public slice(start?: number, end?: number): Revision[] {
    return this.revisions.slice(start, end);
  }

  public push(revision: Revision): number {
    this.length = this.revisions.push(revision);
    return this.length;
  }
}

export class Document extends EventEmitter {
  public constructor(
    public clientId: string,
    public visible: string,
    public hidden: string,
    public deletes: Subseq,
    public intents: string[],
    public revisions: RevisionLog,
  ) {
    super();
  }

  public static initialize(
    clientId: string,
    initial: string = "",
    intents: string[] = [],
    RevisionLog: RevisionLogConstructor = ArrayRevisionLog,
  ) {
    const revisions = new RevisionLog();
    revisions.push({
      clientId,
      version: 0,
      inserts: initial.length ? [1, initial.length] : [],
      deletes: initial.length ? [0, initial.length] : [],
    });
    return new Document(
      clientId,
      initial,
      initial.slice(0, 0),
      initial.length ? [0, initial.length] : [],
      intents,
      revisions,
    );
  }

  public static fromMessages(
    clientId: string,
    messages: Message[],
    snapshot: Snapshot = { visible: "", hidden: "", deletes: [] },
    intents: string[] = [],
    RevisionLog: RevisionLogConstructor = ArrayRevisionLog,
  ) {
    let doc = new Document(
      clientId,
      snapshot.visible,
      snapshot.hidden,
      snapshot.deletes,
      intents,
      new RevisionLog(),
    );
    for (const message of messages) {
      doc.revise(
        message.patch,
        doc.revisions.length - 1,
        message.clientId,
        message.intent,
        message.clientId === clientId ? undefined : message.version,
      );
    }
    return doc;
  }

  public getDeletesForIndex(index: number): Subseq {
    let deletes: Subseq = this.deletes;
    for (const revision of this.revisions.slice(index + 1).reverse()) {
      deletes = difference(deletes, revision.deletes);
      deletes = shrink(deletes, revision.inserts);
    }
    return deletes;
  }

  protected revise(
    patch: Patch,
    // parent index
    pi: number,
    clientId: string = this.clientId,
    intent?: string,
    version?: number,
  ): Message {
    if (clientId === this.clientId && version != null) {
      throw new Error("Cannot specify version for local edit");
    } else if (pi < 0 || pi > this.revisions.length - 1) {
      throw new Error("Index out of range of revisions");
    }
    version = version == null ? this.revisions.length : version;
    // intent index
    const ii = intent == null ? -1 : this.intents.indexOf(intent);
    if (ii === -1) {
      intent = undefined;
    }
    const oldDeletes = this.getDeletesForIndex(pi);
    const oldLength = count(oldDeletes, false);
    let [inserts, deletes, inserted] = factor(patch, oldLength);
    inserts = rebase(inserts, oldDeletes);
    deletes = expand(deletes, oldDeletes);
    const [parent, ...revisions] = this.revisions.slice(pi);
    for (const revision of revisions) {
      if (intent === revision.intent && clientId === revision.clientId) {
        throw new Error(
          "Cannot have concurrent edits with the same client and source",
        );
      }
      // revision intent index
      const rii =
        revision.intent == null ? -1 : this.intents.indexOf(revision.intent);
      const before =
        intent === revision.intent ? clientId < revision.clientId : ii < rii;
      inserts = rebase(inserts, revision.inserts, before);
      deletes = expand(deletes, revision.inserts);
      deletes = difference(deletes, revision.deletes);
    }
    deletes = expand(deletes, inserts);
    // TODO: put revive logic here
    const currentDeletes = expand(this.deletes, inserts);
    const visibleInserts = shrink(inserts, currentDeletes);
    const visible = apply(this.visible, synthesize(inserted, visibleInserts));
    const newDeletes = union(deletes, currentDeletes);
    const [visible1, hidden] = shuffle(
      visible,
      this.hidden,
      currentDeletes,
      newDeletes,
    );
    this.revisions.push({
      clientId,
      version,
      inserts,
      deletes,
      intent,
    });
    this.visible = visible1;
    this.hidden = hidden;
    this.deletes = newDeletes;
    return {
      patch: synthesize(
        inserted,
        visibleInserts,
        shrink(deletes, currentDeletes),
      ),
      intent,
      clientId,
      version,
      parentClientId: parent.clientId,
      parentVersion: parent.version,
    };
  }

  public edit(
    patch: Patch,
    intent?: string,
    // parent index
    pi: number = this.revisions.length - 1,
  ): Message {
    const message = this.revise(patch, pi, this.clientId, intent);
    this.emit("message", message);
    return message;
  }

  public ingest(message: Message): Message | undefined {
    const {
      patch,
      clientId,
      version,
      parentClientId,
      parentVersion,
      intent,
    } = message;
    if (parentClientId == null || parentVersion == null) {
      throw new Error("Cannot ingest initial message");
    }
    // parent index
    const pi = this.revisions.locate(parentClientId, parentVersion);
    if (pi === -1) {
      return;
    }
    message = this.revise(patch, pi, clientId, intent, version);
    this.emit("message", message);
    return message;
  }
}

export class LocalClient extends EventEmitter {
  private documents: Record<string, Document> = {};
  constructor(public id: string = uuid()) {
    super();
  }

  async getSnapshot(
    docId: string,
    initial: string = "",
  ): Promise<Snapshot | undefined> {
    docId;
    initial;
    return;
  }

  async getMessages(
    docId: string,
    startId?: string,
    endId?: string,
    create?: Message,
  ): Promise<Message[]> {
    docId;
    startId;
    endId;
    const messages: Message[] = [];
    if (!messages.length && create) {
      return [create];
    }
    return messages;
  }

  async getDocument(
    docId: string,
    initial: string = "",
    intents?: string[],
  ): Promise<Document> {
    let doc: Document | undefined = this.documents[docId];
    if (doc) {
      return doc;
    }
    const snapshot: Snapshot = (await this.getSnapshot(docId, initial)) || {
      visible: initial,
      hidden: initial.slice(0, 0),
      deletes: initial.length ? [0, initial.length] : [],
    };
    const create: Message = {
      patch: [{ start: 0, end: 0, insert: initial }],
      clientId: this.id,
      version: 0,
    };
    const messages = await this.getMessages(
      docId,
      snapshot.parentId,
      undefined,
      create,
    );
    doc = Document.fromMessages(this.id, messages, snapshot, intents);
    this.documents[docId] = doc;
    // TODO: listen for edits from the document
    return doc;
  }
}
