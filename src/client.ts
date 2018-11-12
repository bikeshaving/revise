import uuid from "uuid/v4";
import {
  rebase,
  expand,
  lengthOf,
  Subset,
  subtract,
  shrink,
  union,
} from "./subset";
import { apply, Delta, factor, shuffle, synthesize } from "./delta";

export interface Revision {
  clientId: string;
  version: number;
  // sequence of characters based on union which were inserted by this revision
  inserts: Subset;
  // sequence of characters based on union which were deleted by this revision
  deletes: Subset;
  source?: string;
}

export default class Client {
  public visible: string;
  public hidden: string;
  public deletes: Subset;
  public revisions: Revision[];
  public id: string = uuid();
  public sources: string[] = [];
  public version: number = 0;
  constructor(initial: string = "") {
    this.visible = initial;
    this.hidden = initial.slice(0, 0);
    this.deletes = initial.length ? [[initial.length, 0]] : [];
    this.revisions = [
      {
        clientId: this.id,
        version: this.version++,
        inserts: initial.length ? [[initial.length, 1]] : [],
        deletes: initial.length ? [[initial.length, 0]] : [],
      },
    ];
  }

  public indexOf(clientId: string, version: number) {
    for (let i = this.revisions.length - 1; i >= 0; i--) {
      const revision = this.revisions[i];
      if (revision.clientId === clientId && revision.version === version) {
        return i;
      }
    }
    return -1;
  }

  public getDeletesForIndex(index: number): Subset {
    let deletes: Subset = this.deletes;
    for (let i = this.revisions.length - 1; i > index; i--) {
      const revision = this.revisions[i];
      deletes = subtract(deletes, revision.deletes);
      deletes = shrink(deletes, revision.inserts);
    }
    return deletes;
  }

  public getDeletesFromCurrentForIndex(index: number): Subset {
    let deletes = this.getDeletesForIndex(index);
    for (let i = index + 1; i < this.revisions.length; i++) {
      const revision = this.revisions[i];
      deletes = union(expand(deletes, revision.inserts), revision.inserts);
    }
    return deletes;
  }

  public getVisibleForIndex(index: number): string {
    const deletes = this.getDeletesFromCurrentForIndex(index);
    return apply(this.visible, synthesize(this.hidden, this.deletes, deletes));
  }

  public edit(
    delta: Delta,
    index: number = this.revisions.length - 1,
    source?: string,
    clientId: string = this.id,
    version?: number,
  ): Revision {
    if (clientId === this.id && version != null) {
      throw new Error("Can't specify version for local edit");
    } else if (index < 0 || index > this.revisions.length - 1) {
      throw new Error("Index out of range of revisions");
    }
    const sourceIndex = source == null ? -1 : this.sources.indexOf(source);
    if (sourceIndex === -1) {
      source = undefined;
    }
    const oldDeletes = this.getDeletesForIndex(index);
    const oldVisibleLength = lengthOf(oldDeletes, (c) => c === 0);
    let [inserts, deletes, inserted] = factor(delta, oldVisibleLength);
    inserts = rebase(inserts, oldDeletes);
    deletes = expand(deletes, oldDeletes);
    for (let i = index + 1; i < this.revisions.length; i++) {
      const revision = this.revisions[i];
      if (source === revision.source && clientId === revision.clientId) {
        throw new Error("Can’t have concurrent edits with the same source and client");
      }
      const revisionSourceIndex =
        revision.source == null
          ? -1
          : this.sources.indexOf(revision.source);
      const before =
        source === revision.source
          ? this.id < revision.clientId
          : sourceIndex < revisionSourceIndex;
      inserts = rebase(inserts, revision.inserts, before);
      deletes = expand(deletes, revision.inserts);
    }
    deletes = expand(deletes, inserts);
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
    const revision: Revision = {
      clientId: this.id,
      version: version || this.version++,
      inserts,
      deletes,
      source,
    };
    this.revisions.push(revision);
    this.visible = visible1;
    this.hidden = hidden;
    this.deletes = newDeletes;
    return revision;
  }

  public apply(message: Message): Revision | undefined {
    const index = this.indexOf(message.parentClientId, message.parentVersion);
    if (index === -1) {
      // TODO: put message in the orphanage
      return;
    }
    return this.edit(
      message.delta,
      index,
      message.source,
      message.clientId,
      message.version,
    );
  }
}

// TODO: better name for this maybe
export interface Message {
  delta: Delta;
  source?: string;
  clientId: string;
  version: number;
  parentClientId: string;
  parentVersion: number;
}
