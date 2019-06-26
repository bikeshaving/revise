export interface Checkpoint {
  version: number;
  snapshot: any;
}

export interface Revision {
  version: number;
  local: number;
  received: number;
  client: string;
  patch: any;
}

export enum ConnectState {
  CONNECTING,
  OPEN,
  CLOSING,
  CLOSED,
}

export interface Connection {
  fetchCheckpoint(id: string, start?: number): Promise<Checkpoint | undefined>;
  fetchRevisions(
    id: string,
    start?: number,
    end?: number,
  ): Promise<Revision[] | undefined>;
  sendCheckpoint(id: string, checkpoint: Checkpoint): Promise<void>;
  sendRevisions(id: string, revs: Revision[]): Promise<void>;
  subscribe(id: string, start?: number): AsyncIterableIterator<Revision[]>;
  close(): void;
}
