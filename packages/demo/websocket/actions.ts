import { Checkpoint, Message } from "@collabjs/collab/lib/connection";

export interface AbstractAction {
  type: string;
  id: string;
  reqId: number;
}

export interface FetchMessages extends AbstractAction {
  type: "fetchMessages";
  start?: number;
  end?: number;
}

export interface SendMessages extends AbstractAction {
  type: "sendMessages";
  messages: Message[];
}

export interface FetchCheckpoint extends AbstractAction {
  type: "fetchCheckpoint";
  start?: number;
}

export interface SendCheckpoint extends AbstractAction {
  type: "sendCheckpoint";
  checkpoint: Checkpoint;
}

export interface SendNothing extends AbstractAction {
  type: "sendNothing";
}

export interface Acknowledge extends AbstractAction {
  type: "acknowledge";
}

export interface Subscribe extends AbstractAction {
  type: "subscribe";
  start: number;
}

export type Action =
  | FetchMessages
  | SendMessages
  | FetchCheckpoint
  | SendCheckpoint
  | SendNothing
  | Acknowledge
  | Subscribe;
