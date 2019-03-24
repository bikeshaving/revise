import { WebSocket } from "mock-socket";
import { WebSocketConnection } from "../websocket";

describe("WebSocketConnection", () => {
  test("it initializes", () => {
    const socket = new WebSocket("ws://localhost:8000");
    new WebSocketConnection(socket);
  });
});
