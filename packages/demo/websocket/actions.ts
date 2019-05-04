import { Checkpoint, Message } from "@collabjs/collab/lib/connection";

export interface AbstractAction {
  type: string;
  id: string;
  reqId: number;
}

export interface Acknowledge extends AbstractAction {
  type: "ack";
}

export interface FetchMessages extends AbstractAction {
  type: "fm";
  start?: number;
  end?: number;
}

export interface SendMessages extends AbstractAction {
  type: "sm";
  messages: Message[];
}

export interface FetchCheckpoint extends AbstractAction {
  type: "fc";
  start?: number;
}

export interface SendCheckpoint extends AbstractAction {
  type: "sc";
  checkpoint: Checkpoint;
}

export interface Subscribe extends AbstractAction {
  type: "sub";
  start?: number;
}

export type Action =
  | FetchMessages
  | SendMessages
  | FetchCheckpoint
  | SendCheckpoint
  | Acknowledge
  | Subscribe;
