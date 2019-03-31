import { Message, Milestone } from "@collabjs/collab/lib/connection";

export interface AbstractAction {
  type: string;
  id: string;
  reqId: number;
}

export interface FetchMilestone extends AbstractAction {
  type: "fetchMilestone";
  start?: number;
}

export interface FetchMessages extends AbstractAction {
  type: "fetchMessages";
  start?: number;
  end?: number;
}

export interface SendMilestone extends AbstractAction {
  type: "sendMilestone";
  milestone: Milestone;
}

export interface SendMessages extends AbstractAction {
  type: "sendMessages";
  messages: Message[];
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
  | FetchMilestone
  | FetchMessages
  | SendMilestone
  | SendMessages
  | SendNothing
  | Acknowledge
  | Subscribe;