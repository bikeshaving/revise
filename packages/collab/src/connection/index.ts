export interface Message {
  // TODO: rename "revision" to "data", remove client from revision and construct revision from message
  revision: any;
  client: string;
  local: number;
  latest: number;
  global?: number;
}

// TODO: rename to checkpoint maybe
export interface Milestone {
  snapshot: any;
  version: number;
}

export interface Connection {
  fetchMilestone(id: string, start?: number): Promise<Milestone | undefined>;
  fetchMessages(
    id: string,
    start?: number,
    end?: number,
  ): Promise<Message[] | undefined>;
  sendMilestone(id: string, milestone: Milestone): Promise<void>;
  sendMessages(id: string, messages: Message[]): Promise<void>;
  subscribe(id: string, start: number): AsyncIterableIterator<Message[]>;
}
