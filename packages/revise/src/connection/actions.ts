import { Checkpoint, Message } from "./index";

export interface AbstractAction {
  type: string;
  id: string;
  reqId: number;
}

export interface Acknowledge extends AbstractAction {
  type: "ack";
}

export interface FetchCheckpoint extends AbstractAction {
  type: "fc";
  start?: number;
}

export interface FetchMessages extends AbstractAction {
  type: "fm";
  start?: number;
  end?: number;
}

export interface SendCheckpoint extends AbstractAction {
  type: "sc";
  checkpoint: Checkpoint;
}

export interface SendMessages extends AbstractAction {
  type: "sm";
  messages: Message[];
}

export interface Subscribe extends AbstractAction {
  type: "sub";
  start?: number;
}

export type Action =
  | Acknowledge
  | FetchCheckpoint
  | FetchMessages
  | SendCheckpoint
  | SendMessages
  | Subscribe;
