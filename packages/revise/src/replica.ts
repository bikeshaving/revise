import { Checkpoint, Revision } from "./connection";
import { expandHidden, normalize, Patch, shrinkHidden, squash } from "./patch";
import { rebase, rewind, slideBackward, slideForward } from "./revision";
import { apply, INITIAL_SNAPSHOT, Snapshot, unapply } from "./snapshot";
import { contains, Subseq, push } from "./subseq";

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
    const checkpoint: Checkpoint = {
      version: this.received,
      snapshot: this.snapshot,
    };
    return new Replica(client, checkpoint);
  }

  private validateVersion(version: Partial<Version>): Version {
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
    const { commit, change } = this.validateVersion(version);
    const local = change === -1 ? -1 : this.marks.findIndex((m) => m > change);
    const commit1 =
      this.accepted[local] == null
        ? change === -1
          ? -1
          : this.commits.length - 1
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
    const { commit, change } = this.validateVersion(version);
    let patches: Patch[] = [];
    const known: Subseq = [];
    for (const rev of this.commits.slice(commit + 1)) {
      if (rev.client === this.client) {
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

  // TODO: allow an edit to push a new mark so it isn’t squashed with other edits when sent
  edit(
    patch: Patch,
    options: { before?: boolean } & Partial<Version> = {},
  ): Update {
    const { before = false } = options;
    const version = this.validateVersion(options);
    patch = expandHidden(patch, this.hiddenSeqAt(version), { before });
    let patches: Patch[] = this.patchesSince(version);
    [patch, patches] = rebase(patch, patches, () => before);
    this.changes.push(patch);
    if (patches.length) {
      const hiddenSeq = rewind(this.hiddenSeqAt(), patches);
      const patch1 = patches.reduce(squash);
      return {
        commit: this.commits.length - 1,
        change: this.changes.length - 1,
        patch: shrinkHidden(patch1, hiddenSeq),
      };
    }
    return { commit: this.commits.length - 1, change: this.changes.length - 1 };
  }

  ingest(rev: Revision): void {
    if (rev.received < -1 || rev.received > this.received) {
      throw new RangeError(`rev.received (${rev.received}) out of range`);
    } else if (rev.version !== this.received + 1) {
      throw new RangeError(`rev.version (${rev.version}) out of range`);
    } else if (
      rev.client === this.client &&
      rev.local !== this.accepted.length
    ) {
      throw new RangeError(`rev.local (${rev.local}) out of range`);
    }
    // TODO: get the rearranged/rebased patches by client id
    let commits = this.commits.slice(rev.received + 1);
    let clients: string[] = [];
    const patches = slideForward(commits.map((commit) => commit.patch), (i) => {
      const { client } = commits[i];
      if (rev.client !== client) {
        // TODO: stop relying on side-effects
        clients.unshift(client);
      }
      return rev.client !== client;
    });
    let patch = rev.patch;
    [patch] = rebase(patch, patches, (i) => rev.client < clients[i]);
    patch = normalize(patch, this.hiddenSeqAt({ change: -1 }));
    // TODO: cache the rearranged/rebased patches by client id
    if (rev.client === this.client) {
      this.accepted.push(rev.version);
    } else {
      const change = this.marks[this.accepted.length - 1] || 0;
      let patches = this.changes.slice(change);
      [, patches] = rebase(patch, patches, () => rev.client < this.client);
      this.changes = this.changes.slice(0, change).concat(patches);
    }
    this.snapshot = apply(this.snapshot, patch);
    this.commits.push({ ...rev, patch });
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
      const patch = this.changes.slice(start, end).reduce(squash);
      messages.push({
        version: this.received + i + 1,
        local: this.sent + i + 1,
        received: this.received,
        client: this.client,
        patch,
      });
      start = end;
    }
    this.sent += messages.length;
    return messages;
  }
}
