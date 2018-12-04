import uuid from "uuid/v4";
import EventEmitter from "events";

// [flag, ...lengths]
export type Subseq = number[];

export function push(subseq: Subseq, length: number, flag: boolean): number {
  if (length <= 0) {
    throw new Error("Cannot push empty segment");
  } else if (!subseq.length) {
    subseq.push(flag ? 1 : 0, length);
  } else {
    const flag1: boolean = !subseq[0] === (subseq.length % 2 === 1);
    if (flag === flag1) {
      subseq[subseq.length - 1] += length;
    } else {
      subseq.push(length);
    }
  }
  return subseq.length;
}

export function concat(subseq1: Subseq, subseq2: Subseq): Subseq {
  const result = subseq1.slice();
  const [flag, length, ...rest] = subseq2;
  if (length) {
    push(result, length, !!flag);
  }
  return result.concat(rest);
}

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

  public [Symbol.iterator]() {
    return this;
  }

  public join(fn: (flag1: boolean, flag2: boolean) => boolean): Subseq {
    const subseq: Subseq = [];
    for (const [length, flag1, flag2] of this) {
      push(subseq, length, fn(flag1, flag2));
    }
    return subseq;
  }
}

export function zip(a: Subseq, b: Subseq): ZipIterator {
  return new ZipIterator(a, b);
}

export function complement(subseq: Subseq): Subseq {
  if (!subseq.length) {
    return subseq;
  }
  return [subseq[0] ? 0 : 1, ...subseq.slice(1)];
}

export function union(subseq1: Subseq, subseq2: Subseq): Subseq {
  return zip(subseq1, subseq2).join((flag1, flag2) => flag1 || flag2);
}

export function difference(subseq1: Subseq, subseq2: Subseq): Subseq {
  return zip(subseq1, subseq2).join((flag1, flag2) => flag1 && !flag2);
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
      push(result, length2, false);
    } else {
      while (length2 > 0) {
        if (length1 == null || length1 === 0) {
          if (!subseq1.length) {
            throw new Error("Length mismatch");
          }
          flag1 = !flag1;
          [length1, ...subseq1] = subseq1;
        }
        const length = Math.min(length1, length2);
        push(result, length, flag1);
        length1 -= length;
        length2 -= length;
      }
    }
  }
  if (subseq1.length || (length1 != null && length1 > 0)) {
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

export function interleave(
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
        push(result, length2, false);
      }
      [length2, ...subseq2] = subseq2;
      flag2 = !flag2;
    } else if (length2 == null) {
      push(result, length1, flag1);
      [length1, ...subseq1] = subseq1;
      flag1 = !flag1;
    } else {
      if (flag2) {
        if (before) {
          push(result, length1, flag1);
        }
        push(result, length2, false);
        if (!before) {
          push(result, length1, flag1);
        }
        [length1, ...subseq1] = subseq1;
        [length2, ...subseq2] = subseq2;
        flag1 = !flag1;
        flag2 = !flag2;
      } else if (flag1) {
        push(result, length1, flag1);
        [length1, ...subseq1] = subseq1;
        flag1 = !flag1;
      } else {
        const length = Math.min(length1, length2);
        push(result, length, false);
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

// inclusive start, exclusive end
type Copy = [number, number];
type Insert = string;
// Deletes are represented via omission
export type Patch = (Copy | Insert)[];

export function apply(text: string, patch: Patch): string {
  let result = "";
  for (const el of patch) {
    if (typeof el === "string") {
      result += el;
    } else {
      const [start, end] = el;
      result += text.slice(start, end);
    }
  }
  return result;
}

export function factor(patch: Patch, length: number): [Subseq, Subseq, string] {
  const insertSeq: Subseq = [];
  const deleteSeq: Subseq = [];
  // TODO: maybe use type of string[] for performance
  let inserted: string = "";
  let consumed = 0;
  for (const el of patch) {
    if (typeof el === "string") {
      push(insertSeq, el.length, true);
      inserted += el;
    } else {
      const [start, end] = el;
      push(insertSeq, end - consumed, false);
      if (start > consumed) {
        push(deleteSeq, start - consumed, true);
      }
      push(deleteSeq, end - start, false);
      consumed = end;
    }
  }
  if (length > consumed) {
    push(insertSeq, length - consumed, false);
    push(deleteSeq, length - consumed, true);
  }
  return [insertSeq, deleteSeq, inserted];
}

export function synthesize(
  inserted: string,
  insertSeq: Subseq,
  deleteSeq: Subseq = [0, count(insertSeq)],
): Patch {
  const patch: Patch = [];
  let ii = 0;
  let ci = 0;
  for (const [length, insertFlag, deleteFlag] of zip(insertSeq, deleteSeq)) {
    if (insertFlag) {
      ii += length;
      if (!deleteFlag) {
        patch.push(inserted.slice(ii - length, ii));
      }
    } else {
      ci += length;
      if (!deleteFlag) {
        patch.push([ci - length, ci] as Copy);
      }
    }
  }
  return patch;
}

// TODO: maybe rename variables
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

export function overlapping(
  deleted: string,
  inserted: string,
): Subseq | undefined {
  const subseq: Subseq = [];
  let consumed = 0;
  let flag = false;
  let ii = 0;
  for (let di = 0; di < deleted.length; di++) {
    if (ii >= inserted.length) {
      if (di - consumed > 0) {
        push(subseq, di - consumed, flag);
      }
      consumed = di;
      flag = !flag;
      break;
    }
    const match = deleted[di] === inserted[ii];
    if (match) {
      ii++;
    }
    if (flag !== match) {
      if (di - consumed > 0) {
        push(subseq, di - consumed, flag);
      }
      consumed = di;
      flag = !flag;
    }
  }
  if (ii >= inserted.length) {
    push(subseq, deleted.length - consumed, flag);
    return subseq;
  }
}

export function revive(
  deleted: string,
  inserted: string,
  deleteSeq: Subseq,
  insertSeq: Subseq,
): [Subseq, Subseq, string] {
  let revivedDeleteSeq: Subseq = [];
  const revivedInsertSeq: Subseq = [];
  let inserted1 = "";
  // TODO: use indexes into string and not
  let del: string | undefined;
  let ins: string | undefined;
  deleteSeq = expand(deleteSeq, insertSeq);
  for (const [length, deleteFlag, insertFlag] of zip(deleteSeq, insertSeq)) {
    if (deleteFlag && insertFlag) {
      throw new Error("Deletes and inserts overlap");
    } else if (deleteFlag) {
      del = deleted.slice(0, length);
      if (ins != null) {
        const overlap = overlapping(del, ins);
        if (overlap != null) {
          revivedDeleteSeq = concat(revivedDeleteSeq, overlap);
          push(revivedInsertSeq, ins.length, true);
          del = undefined;
        } else {
          push(revivedInsertSeq, ins.length, false);
          inserted1 += ins;
        }
      }
      push(revivedInsertSeq, length, false);
      ins = undefined;
      deleted = deleted.slice(length);
    } else if (insertFlag) {
      ins = inserted.slice(0, length);
      if (del != null) {
        const overlap = overlapping(del, ins);
        if (overlap != null) {
          revivedDeleteSeq = concat(revivedDeleteSeq, overlap);
          push(revivedInsertSeq, ins.length, true);
          ins = undefined;
        } else {
          push(revivedDeleteSeq, del.length, false);
        }
      }
      push(revivedDeleteSeq, length, false);
      del = undefined;
      inserted = inserted.slice(length);
    } else {
      if (del != null) {
        push(revivedDeleteSeq, del.length, false);
      }
      if (ins != null) {
        push(revivedInsertSeq, ins.length, false);
        inserted1 += ins;
      }
      push(revivedDeleteSeq, length, false);
      push(revivedInsertSeq, length, false);
      del = undefined;
      ins = undefined;
    }
  }
  if (del != null) {
    push(revivedDeleteSeq, del.length, false);
  }
  if (ins != null) {
    push(revivedInsertSeq, ins.length, false);
    inserted1 += ins;
  }
  const reviveSeq = shrink(revivedDeleteSeq, revivedInsertSeq);
  insertSeq = shrink(insertSeq, revivedInsertSeq);
  return [reviveSeq, insertSeq, inserted1];
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
  hiddenSeq: Subseq;
  id?: string;
}

export interface Revision {
  clientId: string;
  version: number;
  insertSeq: Subseq;
  deleteSeq: Subseq;
  reviveSeq: Subseq;
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
    public hiddenSeq: Subseq,
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
      insertSeq: initial.length ? [1, initial.length] : [],
      deleteSeq: initial.length ? [0, initial.length] : [],
      reviveSeq: initial.length ? [0, initial.length] : [],
    });
    return new Document(
      clientId,
      initial,
      "",
      initial.length ? [0, initial.length] : [],
      intents,
      revisions,
    );
  }

  public static fromMessages(
    clientId: string,
    messages: Message[],
    snapshot: Snapshot = { visible: "", hidden: "", hiddenSeq: [] },
    intents: string[] = [],
    RevisionLog: RevisionLogConstructor = ArrayRevisionLog,
  ) {
    let doc = new Document(
      clientId,
      snapshot.visible,
      snapshot.hidden,
      snapshot.hiddenSeq,
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

  public hiddenSeqAt(i: number): Subseq {
    let hiddenSeq: Subseq = this.hiddenSeq;
    for (const revision of this.revisions.slice(i + 1).reverse()) {
      hiddenSeq = union(hiddenSeq, revision.reviveSeq);
      hiddenSeq = difference(hiddenSeq, revision.deleteSeq);
      hiddenSeq = shrink(hiddenSeq, revision.insertSeq);
    }
    return hiddenSeq;
  }

  protected factor(patch: Patch, i: number): [Subseq, Subseq, string] {
    const hiddenSeq = this.hiddenSeqAt(i);
    const length = count(hiddenSeq, false);
    let [insertSeq, deleteSeq, inserted] = factor(patch, length);
    insertSeq = interleave(insertSeq, hiddenSeq);
    deleteSeq = expand(deleteSeq, hiddenSeq);
    return [insertSeq, deleteSeq, inserted];
  }

  protected revise(
    patch: Patch,
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
    const ii = intent == null ? -1 : this.intents.indexOf(intent);
    intent = ii === -1 ? undefined : intent;

    let [insertSeq, deleteSeq, inserted] = this.factor(patch, pi);
    const [parentRevision, ...revisions] = this.revisions.slice(pi);
    for (const revision of revisions) {
      if (intent === revision.intent && clientId === revision.clientId) {
        throw new Error(
          "Cannot have concurrent edits with the same client and source",
        );
      }
      const rii =
        revision.intent == null ? -1 : this.intents.indexOf(revision.intent);
      const before =
        intent === revision.intent ? clientId < revision.clientId : ii < rii;
      insertSeq = interleave(insertSeq, revision.insertSeq, before);
      deleteSeq = expand(deleteSeq, revision.insertSeq);
      deleteSeq = difference(
        deleteSeq,
        union(revision.deleteSeq, revision.reviveSeq),
      );
    }
    if (revisions.length) {
      patch = synthesize(inserted, insertSeq, expand(deleteSeq, insertSeq));
    }

    let { visible, hidden, hiddenSeq } = this;
    if (count(deleteSeq, true) > 0) {
      const hiddenSeq1 = union(hiddenSeq, deleteSeq);
      [visible, hidden] = shuffle(visible, hidden, hiddenSeq, hiddenSeq1);
      hiddenSeq = hiddenSeq1;
    }

    let reviveSeq: Subseq;
    if (inserted.length) {
      [reviveSeq, insertSeq, inserted] = revive(
        hidden,
        inserted,
        hiddenSeq,
        insertSeq,
      );
    } else {
      reviveSeq = [0, count(insertSeq)];
    }

    if (inserted.length) {
      hiddenSeq = expand(hiddenSeq, insertSeq);
      deleteSeq = expand(deleteSeq, insertSeq);
      const visibleInsertSeq = shrink(insertSeq, hiddenSeq);
      visible = apply(visible, synthesize(inserted, visibleInsertSeq));
    }

    if (count(reviveSeq, true) > 0) {
      const hiddenSeq1 = difference(hiddenSeq, reviveSeq);
      [visible, hidden] = shuffle(visible, hidden, hiddenSeq, hiddenSeq1);
      hiddenSeq = hiddenSeq1;
    }

    this.revisions.push({
      clientId,
      version,
      insertSeq,
      deleteSeq,
      reviveSeq,
      intent,
    });
    this.visible = visible;
    this.hidden = hidden;
    this.hiddenSeq = hiddenSeq;
    return {
      patch,
      intent,
      clientId,
      version,
      parentClientId: parentRevision.clientId,
      parentVersion: parentRevision.version,
    };
  }

  public undo(i: number): Message {
    const [parentRevision, ...revisions] = this.revisions.slice(i);
    let reviveSeq = parentRevision.deleteSeq;
    let deleteSeq = union(parentRevision.insertSeq, parentRevision.reviveSeq);
    for (const revision of revisions) {
      reviveSeq = expand(reviveSeq, revision.insertSeq);
      const deleteOrReviveSeq = union(revision.reviveSeq, revision.deleteSeq);
      reviveSeq = difference(reviveSeq, deleteOrReviveSeq);
      deleteSeq = expand(deleteSeq, revision.insertSeq);
      deleteSeq = difference(deleteSeq, deleteOrReviveSeq);
    }
    let { visible, hidden, hiddenSeq } = this;
    const patch = synthesize(hidden, reviveSeq, deleteSeq);
    const hiddenSeq1 = union(difference(hiddenSeq, reviveSeq), deleteSeq);
    [visible, hidden] = shuffle(visible, hidden, hiddenSeq, hiddenSeq1);
    this.visible = visible;
    this.hidden = hidden;
    this.hiddenSeq = hiddenSeq1;
    const message = {
      patch,
      intent: "undo",
      clientId: this.clientId,
      version: this.revisions.length,
      parentClientId: parentRevision.clientId,
      parentVersion: parentRevision.version,
    };
    this.emit("message", message);
    return message;
  }

  public edit(
    patch: Patch,
    intent?: string,
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
      hidden: "",
      hiddenSeq: initial.length ? [0, initial.length] : [],
    };
    const create: Message = {
      patch: [initial],
      clientId: this.id,
      version: 0,
    };
    const messages = await this.getMessages(
      docId,
      snapshot.id,
      undefined,
      create,
    );
    doc = Document.fromMessages(this.id, messages, snapshot, intents);
    this.documents[docId] = doc;
    // TODO: listen for edits from the document
    return doc;
  }
}
