import * as ws from "ws";
//import * as Knex from "knex";
import Fastify from "fastify";
import FastifyPlugin from "fastify-plugin";
import FastifyNext from "fastify-nextjs";

import { InMemoryConnection } from "@createx/revise/lib/connection/in-memory";
// import { KnexConnection } from "@createx/revise-knex";
import { SocketProxy } from "@createx/revise/lib/connection/socket";

declare module "fastify" {
  export interface FastifyInstance {
    wss: ws.Server;
  }
}

const fastify = Fastify({
  logger: { level: "error" },
});

fastify.register(
  FastifyPlugin((fastify) => {
    const wss = new ws.Server({ server: fastify.server });
    fastify.decorate("wss", wss);
    fastify.addHook("onClose", (fastify, done) => {
      fastify.wss.close(done);
    });

		return Promise.resolve();
  }),
);

const dev = process.env.NODE_ENV !== "production";
fastify.register(FastifyNext, {dev}).after(() => {
	fastify.next("/");
});

fastify.ready((err) => {
  if (err) {
    throw err;
  }

  const conn = new InMemoryConnection();
  //const conn = new KnexConnection(
  //  Knex({
  //    client: "pg",
  //    connection: "postgresql://brian:poop@localhost/revise_knex",
  //  }),
  //);

  fastify.wss.on("connection", async (socket: WebSocket) => {
		console.log("SOCKET CONNECTING");
    const proxy = new SocketProxy(socket, conn);
    try {
      await proxy.connect();
    } catch (err) {
      fastify.log.error(err);
    } finally {
			socket.close();
		}
  });
});

const port = parseInt(process.env.PORT || "3000", 10);
fastify.listen(port, (err) => {
  if (err) {
    fastify.log.error({msg: err.toString()});
    throw err;
  }
});

process.on("uncaughtException", (err) => {
	fastify.log.error({msg: err.toString()});
  throw err;
});

process.on("unhandledRejection", (reason) => {
	fastify.log.error({msg: reason!.toString()});
  throw reason;
});
