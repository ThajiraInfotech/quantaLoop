const express = require("express");

const { authenticate } = require("../../middleware/auth");
const { listInsights } = require("./insight.controller");

function createInsightsRouter(env) {
  const router = express.Router();
  const requireAuth = authenticate({ jwtSecret: env.JWT_SECRET });

  router.get("/", requireAuth, listInsights);

  return router;
}

module.exports = { createInsightsRouter };
