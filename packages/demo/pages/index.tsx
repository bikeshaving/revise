import * as React from 'react'
import Link from 'next/link'

import { InMemoryConnection } from "@collabjs/collab/lib/connection/in-memory";
import { WebSocketConnection } from "@collabjs/collab/lib/connection/websocket";
import { Client } from "@collabjs/collab/lib/client";
const conn = new InMemoryConnection();
const client = new Client("id1", conn);

export default function IndexPage() {
  React.useEffect(() => {
    const socket = new WebSocket("ws://localhost:3000");
    const connection = new WebSocketConnection(socket);
    const client = new Client("hello-world", connection);
  });
  return (
    <div>HELLOOOOOOOOOOOOOO!</div>
  );
}
