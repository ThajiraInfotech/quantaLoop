require("dotenv").config();

const http = require("http");
const { loadEnv } = require("./config/env");
const { connectDatabase } = require("./config/database");
const { createApp } = require("./app");

async function start() {
  const env = loadEnv();
  await connectDatabase(env.MONGO_URI);
  const app = createApp(env);
  const server = http.createServer(app);

  server.listen(env.PORT, () => {
    process.stdout.write(`Quanta Loop API listening on port ${env.PORT}\n`);
  });
}

start().catch((err) => {
  process.stderr.write(`${err.message}\n`);
  process.exit(1);
});
