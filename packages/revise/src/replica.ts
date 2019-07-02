import { Checkpoint, Revision } from "./connection";
import {
  factor,
  expandHidden,
  normalize,
  Patch,
  shrinkHidden,
  squash,
  synthesize,
} from "./patch";
import { rebase, rewind, slideBackward, slideForward } from "./revision";
import { apply, INITIAL_SNAPSHOT, Snapshot, unapply } from "./snapshot";
import { contains, difference, Subseq, push } from "./subseq";

export interface Version {
  readonly commit: number;
  readonly change: number;
}

export interface Update extends Version {
  readonly patch?: Patch;
}

export class Replica {
  // TODO: document what each of these members represent
  private snapshot: Snapshot;
  private commits: Revision[];

  // These properties could probably could be grouped into a history class.
  private changes: Patch[] = [];
  private marks: number[] = [];
  private accepted: number[] = [];
  private sent = -1;

  get received(): number {
    return this.commits.length - 1;
  }

  get currentVersion(): Version {
    return {
      commit: this.commits.length - 1,
      change: this.changes.length - 1,
    };
  }

  constructor(
    public client: string,
    checkpoint: Checkpoint = { version: -1, snapshot: INITIAL_SNAPSHOT },
  ) {
    if (checkpoint.version < -1) {
      throw new RangeError(
        `checkpoint.version (${checkpoint.version}) out of range`,
      );
    }
    this.snapshot = checkpoint.snapshot;
    this.commits = new Array(checkpoint.version + 1);
  }

  clone(client: string): Replica {
    if (client === this.client) {
      throw new Error("Cannot have multiple replicas with the same client id");
    }
    const checkpoint = { version: this.received, snapshot: this.snapshot };
    return new Replica(client, checkpoint);
  }

  private completeVersion(version: Partial<Version>): Version {
    const {
      commit = this.commits.length - 1,
      change = this.changes.length - 1,
    } = version;
    if (commit < -1 || commit > this.commits.length - 1) {
      throw new RangeError(`commit (${commit}) out of range`);
    } else if (change < -1 || change > this.changes.length - 1) {
      throw new RangeError(`change (${change}) out of range`);
    }
    return { commit, change };
  }

  hiddenSeqAt(version: Partial<Version> = {}): Subseq {
    return this.snapshotAt(version).hiddenSeq;
  }

  snapshotAt(version: Partial<Version> = {}): Snapshot {
    const { commit, change } = this.completeVersion(version);
    const local = change === -1 ? -1 : this.marks.findIndex((m) => m > change);
    const commit1 =
      change === -1
        ? -1
        : this.accepted[local] == null
        ? this.commits.length - 1
        : this.accepted[local];
    const commits = this.commits.slice(commit + 1);
    let changes: Patch[] = [];
    if (commit <= commit1) {
      const known: Subseq = [];
      for (const rev of commits.slice(0, commit1 - commit)) {
        if (rev.client === this.client && rev.local === local) {
          const changes1 = this.changes.slice(
            this.marks[rev.local - 1],
            Math.min(this.marks[rev.local], change + 1),
          );
          changes = changes.concat(changes1);
          push(known, changes1.length, true);
        } else {
          changes.push(rev.patch);
          push(known, 1, rev.client === this.client);
        }
      }
      const changes1 = this.changes.slice(
        this.marks[this.accepted.length - 1],
        change + 1,
      );
      changes = changes.concat(changes1);
      push(known, changes1.length, true);
      changes = slideBackward(changes, (i) => contains(known, i));
    }
    let snapshot = this.snapshot;
    if (commits.length) {
      const patch = commits.map((commit) => commit.patch).reduce(squash);
      snapshot = unapply(snapshot, patch);
    }
    if (changes.length) {
      const patch = changes.reduce(squash);
      snapshot = apply(snapshot, patch);
    }
    return snapshot;
  }

  private patchesSince(version: Partial<Version> = {}): Patch[] {
    const { commit, change } = this.completeVersion(version);
    let patches: Patch[] = [];
    const local = change === -1 ? -1 : this.marks.findIndex((m) => m > change);
    const known: Subseq = [];
    for (const rev of this.commits.slice(commit + 1)) {
      if (rev.client === this.client && rev.local === local) {
        const changes = this.changes.slice(
          this.marks[rev.local - 1],
          this.marks[rev.local],
        );
        patches = patches.concat(changes);
        push(known, changes.length, true);
      } else {
        patches.push(rev.patch);
        push(known, 1, false);
      }
    }
    const changes = this.changes.slice(this.marks[this.accepted.length - 1]);
    patches = patches.concat(changes);
    push(known, changes.length, true);
    let change1 = this.changes.length;
    return slideForward(patches, (i) => {
      if (contains(known, i)) {
        // TODO: stop relying on side-effects
        change1--;
        return change < change1;
      }
      return true;
    });
  }

  // TODO: allow an edit to push a new mark so it isn’t squashed with other edits when sent
  edit(
    patch: Patch,
    options: { before?: boolean } & Partial<Version> = {},
  ): Update {
    const { before = false } = options;
    const version = this.completeVersion(options);
    patch = expandHidden(patch, this.hiddenSeqAt(version), { before });
    let patches: Patch[] = this.patchesSince(version);
    [patch, patches] = rebase(patch, patches, () => (before ? -1 : 1));
    this.changes.push(patch);
    if (patches.length) {
      // TODO: there must be a better way to do this
      let patch1 = patches.reduce(squash);
      let [inserted1, insertSeq1, deleteSeq1] = factor(patch1);
      deleteSeq1 = difference(deleteSeq1, factor(patch)[2]);
      patch1 = synthesize(inserted1, insertSeq1, deleteSeq1);
      const hiddenSeq = rewind(this.hiddenSeqAt(), [patch1]);
      patch1 = shrinkHidden(patch1, hiddenSeq);
      return {
        commit: this.commits.length - 1,
        change: this.changes.length - 1,
        patch: patch1,
      };
    }
    return { commit: this.commits.length - 1, change: this.changes.length - 1 };
  }

  ingest(rev: Revision): void {
    let { version, received, client, local, patch } = rev;
    if (received < -1 || received > this.received) {
      throw new RangeError(`rev.received (${received}) out of range`);
    } else if (version !== this.received + 1) {
      throw new RangeError(`rev.version (${version}) out of range`);
    } else if (client === this.client && local !== this.accepted.length) {
      throw new RangeError(`rev.local (${local}) out of range`);
    }
    const commits = this.commits.slice(received + 1);
    let clients: string[] = [];
    // TODO: stop relying on side-effects
    // TODO: add more tests to see if this is required
    const patches = slideForward(commits.map((commit) => commit.patch), (i) => {
      const client1 = commits[i].client;
      if (client !== client1) {
        clients.unshift(client1);
      }
      return client !== client1;
    });
    [patch] = rebase(patch, patches, (i) => {
      const client1 = clients[i];
      if (client === client1) {
        throw new Error(
          "slideForward failed to remove patch with the same client",
        );
      } else if (client < client1) {
        return -1;
      } else {
        return 1;
      }
    });
    patch = normalize(patch, this.hiddenSeqAt({ change: -1 }));
    if (client === this.client) {
      this.accepted.push(version);
    } else {
      const change = this.marks[this.accepted.length - 1] || 0;
      const [, changes] = rebase(patch, this.changes.slice(change), () =>
        rev.client < this.client ? -1 : 1,
      );
      this.changes = this.changes.slice(0, change).concat(changes);
    }
    this.snapshot = apply(this.snapshot, patch);
    this.commits.push({
      version,
      local,
      received: this.received,
      client,
      patch,
    });
  }

  updateSince(version: Partial<Version> = {}): Update {
    const patches = this.patchesSince(version);
    if (patches.length) {
      let patch = patches.reduce(squash);
      patch = shrinkHidden(patch, this.hiddenSeqAt(version));
      return {
        patch,
        commit: this.commits.length - 1,
        change: this.changes.length - 1,
      };
    }
    return { commit: this.commits.length - 1, change: this.changes.length - 1 };
  }

  pending(): Revision[] {
    if (
      (!this.marks.length && this.changes.length) ||
      this.marks[this.marks.length - 1] < this.changes.length
    ) {
      this.marks.push(this.changes.length);
    }
    let start = this.marks[this.sent] || 0;
    const messages: Revision[] = [];
    for (const [i, end] of this.marks.slice(this.sent + 1).entries()) {
      messages.push({
        version: this.received + i + 1,
        local: this.sent + i + 1,
        received: this.received,
        client: this.client,
        patch: this.changes.slice(start, end).reduce(squash),
      });
      start = end;
    }
    this.sent += messages.length;
    return messages;
  }
}
