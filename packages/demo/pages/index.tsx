import * as React from "react";

import { WebSocketConnection } from "../websocket/connection";

export default function IndexPage() {
  React.useEffect(() => {
    const socket = new WebSocket("ws://localhost:3000");
    new WebSocketConnection(socket);
  });
  return (
    <div>hey babe</div>
  );
}
