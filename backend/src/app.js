const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const errorHandler = require("./middleware/errorHandler");
const notFound = require("./middleware/notFound");
const { createAccessRouter } = require("./modules/access/access.routes");
const { createActivityRouter } = require("./modules/activity/activity.routes");
const { createAuthRouter } = require("./modules/auth/auth.routes");
const { createConversationsRouter } = require("./modules/conversations/conversation.routes");
const { createInterestsRouter } = require("./modules/interests/interest.routes");
const { createMatchesRouter } = require("./modules/matches/match.routes");
const { createMaterialsRouter } = require("./modules/materials/material.routes");
const { createMessagesRouter } = require("./modules/messages/message.routes");
const { createNetworkRouter } = require("./modules/network/network.routes");
const { createNotificationsRouter } = require("./modules/notifications/notification.routes");
const { createOpportunitiesRouter } = require("./modules/opportunities/opportunity.routes");
const { createRecommendationsRouter } = require("./modules/recommendations/recommendation.routes");
const { createRemindersRouter } = require("./modules/reminders/reminder.routes");
const { createActivitySignalsRouter } = require("./modules/activity-signals/activity-signals.routes");
const { createInsightsRouter } = require("./modules/activity-signals/insights.routes");
const { createProfileRouter } = require("./modules/profiles/profile.routes");
const { createReportsRouter } = require("./modules/reports/report.routes");
const { createSavedMaterialsRouter } = require("./modules/saved-materials/saved-material.routes");
const { createVerificationRouter } = require("./modules/verification/verification.routes");

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
  app.use("/api/v1/profile", createProfileRouter(env));
  app.use("/api/v1/verification", createVerificationRouter(env));
  app.use("/api/v1/access", createAccessRouter(env));
  app.use("/api/v1/network", createNetworkRouter(env));
  app.use("/api/v1/materials", createMaterialsRouter(env));
  app.use("/api/v1/interests", createInterestsRouter(env));
  app.use("/api/v1/conversations", createConversationsRouter(env));
  app.use("/api/v1/messages", createMessagesRouter(env));
  app.use("/api/v1/saved-materials", createSavedMaterialsRouter(env));
  app.use("/api/v1/reports", createReportsRouter(env));
  app.use("/api/v1/opportunities", createOpportunitiesRouter(env));
  app.use("/api/v1/recommendations", createRecommendationsRouter(env));
  app.use("/api/v1/reminders", createRemindersRouter(env));
  app.use("/api/v1/insights", createInsightsRouter(env));
  app.use("/api/v1/activity-signals", createActivitySignalsRouter(env));
  app.use("/api/v1/activity", createActivityRouter(env));
  app.use("/api/v1/notifications", createNotificationsRouter(env));
  app.use("/api/v1/matches", createMatchesRouter(env));

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
