import * as React from 'react'
import Link from 'next/link'

import { InMemoryConnection } from "@collabjs/collab/lib/connection/in-memory";
import { Client } from "@collabjs/collab/lib/client";
const conn = new InMemoryConnection();
const client = new Client("id1", conn);

export default function IndexPage() {
  console.log(client);
  return (
    <div>Hello world</div>
  )
}
