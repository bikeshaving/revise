import { Checkpoint, Message } from "./index";

export interface AbstractAction {
  type: string;
  id: string;
  reqId: number;
}

export interface AcknowledgeAction extends AbstractAction {
  type: "ack";
}

export interface FetchCheckpointAction extends AbstractAction {
  type: "fc";
  start?: number;
}

export interface FetchMessagesAction extends AbstractAction {
  type: "fm";
  start?: number;
  end?: number;
}

export interface SendCheckpointAction extends AbstractAction {
  type: "sc";
  checkpoint: Checkpoint;
}

export interface SendMessagesAction extends AbstractAction {
  type: "sm";
  messages: Message[];
}

export interface SubscribeAction extends AbstractAction {
  type: "sub";
  start?: number;
}

export interface ErrorAction extends AbstractAction {
  type: "err";
  name: string;
  message: string;
}

export type Action =
  | AcknowledgeAction
  | ErrorAction
  | FetchCheckpointAction
  | FetchMessagesAction
  | SendCheckpointAction
  | SendMessagesAction
  | SubscribeAction;
