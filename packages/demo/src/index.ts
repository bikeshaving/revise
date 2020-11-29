import * as ws from "ws";
import * as Knex from "knex";
import Fastify from "fastify";
import FastifyPlugin from "fastify-plugin";
import Next from "next";

// import { InMemoryConnection } from "@createx/revise/lib/connection/in-memory";
import { KnexConnection } from "@createx/revise-knex";
import { SocketProxy } from "@createx/revise/lib/connection/socket";

declare module "fastify" {
  export interface FastifyInstance {
    wss: ws.Server;
		// TODO: how do I access this type???
    next: any;
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
fastify.register(
  FastifyPlugin(async (fastify) => {
    const app = Next({ dev, dir: __dirname });
    await app.prepare();
    fastify.decorate("next", app);

    if (dev) {
      fastify.get("/_next/*", async (req, rep) => {
        await fastify.next.handleRequest(req.raw, rep.raw);
        rep.sent = true;
      });
    }

    fastify.setNotFoundHandler(async (req, rep) => {
      await fastify.next.render404(req.raw, rep.raw);
      rep.sent = true;
    });
  }),
);

fastify.get("/", async (req, rep) => {
  await fastify.next.handleRequest(req.raw, rep.raw);
  rep.sent = true;
});

fastify.ready((err) => {
  if (err) {
    throw err;
  }
  // const conn = new InMemoryConnection();
  const conn = new KnexConnection(
    Knex({
      client: "pg",
      connection: "postgresql://brian:poop@localhost/revise_knex",
    }),
  );

  fastify.wss.on("connection", async (socket: WebSocket) => {
    const proxy = new SocketProxy(socket, conn);
    try {
      await proxy.connect();
    } catch (err) {
      fastify.log.error(err);
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
