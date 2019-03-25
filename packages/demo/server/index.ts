import * as createFastify from "fastify";
import * as plugin from "fastify-plugin";
import * as ws from "ws";
import * as next from "next";

declare module "fastify" {
  export interface FastifyInstance {
    ws: ws.Server;
    next: next.Server;
  }
}

const dev = process.env.NODE_ENV !== "production";

const fastify = createFastify({
  logger: { level: "error" },
});

fastify.register(plugin((fastify) => {
  const wss = new ws.Server({ server: fastify.server });
  fastify.decorate("ws", wss);
  fastify.addHook("onClose", (fastify, done) => {
    fastify.ws.close(done);
  });
  return Promise.resolve();
}));

fastify.register(plugin(async (fastify) => {
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
}));

fastify.get("/", async (req, rep) => {
  await fastify.next.handleRequest(req.req, rep.res);
  rep.sent = true;
});

fastify.ready((err) => {
  if (err) {
    throw err;
  }
  fastify.ws.on("connection", (socket: WebSocket) => {
    socket.addEventListener("message", (ev) => {
      try {
        socket.send(ev.data);
      } catch (err) {
        fastify.log.error(err);
        socket.close();
      }
    });
    try {
      socket.send("😎");
    } catch (err) {
      fastify.log.error(err);
      socket.close();
    }
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
});

process.on("unhandledRejection", (reason) => {
  if (reason) {
    fastify.log.error(reason);
  }
});
