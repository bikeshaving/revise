import { Revision, Snapshot } from "./replica";

export interface Connection {
  fetchSnapshot(id: string, start?: number): Promise<Snapshot>;
  fetchRevisions(id: string, start?: number, end?: number): Promise<Revision[]>;
  // TODO: determine a more informative return value from sendSnapshot and sendRevisions
  sendSnapshot(id: string, snapshot: Snapshot): Promise<void>;
  sendRevisions(id: string, revisions: Revision[]): Promise<void>;
  subscribe(id: string, start: number): Promise<AsyncIterable<Revision[]>>;
}
