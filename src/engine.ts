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
  id: string;
  version: number;
  inserts: Subset;
  deletes: Subset;
}

export default class Engine {
  public visible: string;
  public hidden: string;
  public deletes: Subset;
  public revisions: Revision[];
  public id: string = uuid();
  constructor(initial: string = "") {
    this.visible = initial;
    this.hidden = "";
    this.deletes = initial.length ? [[initial.length, 0]] : [];
    this.revisions = [
      {
        id: this.id,
        version: 0,
        inserts: initial.length ? [[initial.length, 1]] : [],
        deletes: initial.length ? [[initial.length, 0]] : [],
      },
    ];
  }

  public findRevisionIndex(id: string, version: number): number | undefined {
    for (let i = this.revisions.length - 1; i >= 0; i--) {
      const revision: Revision = this.revisions[i];
      if (revision.id === id && revision.version === version) {
        return i;
      }
    }
  }

  public findRevision(id: string, version: number): Revision | undefined {
    const index = this.findRevisionIndex(id, version);
    return index != null ? this.revisions[index] : undefined;
  }

  public getVisibleForIndex(index: number): string {
    const deletes = this.getDeletesFromCurrentForIndex(index);
    return apply(this.visible, synthesize(this.hidden, this.deletes, deletes));
  }

  public getDeletesForIndex(index: number): Subset {
    let deletes: Subset = this.deletes;
    // should end condition be i > index?
    for (let i = this.revisions.length - 1; i >= index; i--) {
      const revision = this.revisions[i];
      deletes = subtract(deletes, revision.deletes);
      deletes = shrink(deletes, revision.inserts);
    }
    return deletes;
  }

  public getDeletesFromCurrentForIndex(index: number): Subset {
    let deletes = this.getDeletesForIndex(index);
    for (let i = index; i < this.revisions.length; i++) {
      const revision = this.revisions[i];
      deletes = union(expand(deletes, revision.inserts), revision.inserts);
    }
    return deletes;
  }

  public revise(index: number, delta: Delta): void {
    const oldDeletes = this.getDeletesForIndex(index + 1);
    const oldVisibleLength = lengthOf(oldDeletes, (c) => c === 0);
    let [inserts, deletes, inserted] = factor(delta, oldVisibleLength);
    inserts = rebase(inserts, oldDeletes);
    deletes = expand(deletes, oldDeletes);
    for (let i = index + 1; i < this.revisions.length; i++) {
      const revision = this.revisions[i];
      inserts = rebase(inserts, revision.inserts);
      deletes = expand(deletes, revision.inserts);
    }
    deletes = expand(deletes, inserts);

    const currentDeletes = expand(this.deletes, inserts);
    const visible = apply(
      this.visible,
      synthesize(inserted, inserts, [[lengthOf(inserts), 0]]),
    );

    deletes = union(currentDeletes, deletes);
    const [visible1, hidden] = shuffle(
      visible,
      this.hidden,
      currentDeletes,
      deletes,
    );

    this.revisions.push({
      id: this.id,
      version: this.revisions.length,
      inserts,
      deletes,
    });
    this.visible = visible1;
    this.hidden = hidden;
    this.deletes = deletes;
  }
}
