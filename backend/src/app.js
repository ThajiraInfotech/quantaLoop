const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const errorHandler = require("./middleware/errorHandler");
const notFound = require("./middleware/notFound");
const { createAuthRouter } = require("./modules/auth/auth.routes");
const { createInterestsRouter } = require("./modules/interests/interest.routes");
const { createMatchesRouter } = require("./modules/matches/match.routes");
const { createMaterialsRouter } = require("./modules/materials/material.routes");
const { createNotificationsRouter } = require("./modules/notifications/notification.routes");

function createApp(env) {
  const app = express();
  app.disable("x-powered-by");
  app.use(helmet());
  if (env.NODE_ENV !== "test") {
    app.use(morgan("combined"));
  }
  app.use(
    cors({
      origin: env.CLIENT_ORIGIN,
      credentials: true,
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());

  app.get("/", (req, res) => {
    res.type("text/plain").send("Quanta Loop Backend Running");
  });

  app.use("/api/v1/auth", createAuthRouter(env));
  app.use("/api/v1/materials", createMaterialsRouter(env));
  app.use("/api/v1/interests", createInterestsRouter(env));
  app.use("/api/v1/notifications", createNotificationsRouter(env));
  app.use("/api/v1/matches", createMatchesRouter(env));

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
