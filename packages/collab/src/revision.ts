import { Patch } from "./patch";

export interface Revision {
  patch: Patch;
  client: string;
  // TODO: delete this property
  priority?: number;
}

// TODO: delete
export function compare(rev1: Revision, rev2: Revision): number {
  if ((rev1.priority || 0) < (rev2.priority || 0)) {
    return -1;
  } else if ((rev1.priority || 0) > (rev2.priority || 0)) {
    return 1;
  } else if (rev1.client < rev2.client) {
    return -1;
  } else if (rev1.client > rev2.client) {
    return 1;
  }
  return 0;
}
