export interface Message {
  data: any;
  client: string;
  local: number;
  received: number;
  version?: number;
}

export interface Checkpoint {
  data: any;
  version: number;
}

export interface Connection {
  fetchCheckpoint(id: string, start?: number): Promise<Checkpoint | undefined>;
  fetchMessages(
    id: string,
    start?: number,
    end?: number,
  ): Promise<Message[] | undefined>;
  sendCheckpoint(id: string, checkpoint: Checkpoint): Promise<void>;
  sendMessages(id: string, messages: Message[]): Promise<void>;
  subscribe(id: string, start?: number): AsyncIterableIterator<Message[]>;
  close(): void;
}
