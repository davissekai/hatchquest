import Fastify from "fastify";

const server = Fastify({ logger: true });

server.get("/health", async () => {
  return { status: "ok", service: "hatchquest-backend" };
});

const start = async (): Promise<void> => {
  try {
    const port = Number(process.env.PORT ?? 3001);
    await server.listen({ port, host: "0.0.0.0" });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
