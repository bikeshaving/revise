import * as createFastify from "fastify";
import * as plugin from "fastify-plugin";
import * as ws from "ws";
import * as next from "next";
import { InMemoryConnection } from "@collabjs/collab/lib/connection/in-memory";
import { link } from "@collabjs/collab/lib/connection/socket-utils";

declare module "fastify" {
  export interface FastifyInstance {
    wss: ws.Server;
    next: next.Server;
  }
}

const fastify = createFastify({
  logger: { level: "error" },
});

fastify.register(
  plugin((fastify) => {
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
  plugin(async (fastify) => {
    const app = next({ dev });
    await app.prepare();
    fastify.decorate("next", app);

    if (dev) {
      fastify.get("/_next/*", async (req, rep) => {
        await fastify.next.handleRequest(req.req, rep.res);
        rep.sent = true;
      });
    }

    fastify.setNotFoundHandler(async (req, rep) => {
      await fastify.next.render404(req.req, rep.res);
      rep.sent = true;
    });
  }),
);

fastify.get("/", async (req, rep) => {
  await fastify.next.handleRequest(req.req, rep.res);
  rep.sent = true;
});

fastify.ready((err) => {
  if (err) {
    throw err;
  }
  const conn = new InMemoryConnection();
  fastify.wss.on("connection", (socket: WebSocket) => {
    link(conn, socket);
  });
});

const port = parseInt(process.env.PORT || "3000", 10);
fastify.listen(port, (err) => {
  if (err) {
    fastify.log.error(err);
    throw err;
  }
});

process.on("uncaughtException", (err) => {
  fastify.log.error(err);
  throw err;
});

process.on("unhandledRejection", (reason) => {
  fastify.log.error(reason!);
  throw reason;
});
