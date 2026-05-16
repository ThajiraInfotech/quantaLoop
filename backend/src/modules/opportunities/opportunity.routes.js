const express = require("express");

const { authenticate } = require("../../middleware/auth");
const {
  getOpportunityFeed,
  getOpportunityMetrics,
} = require("./opportunity.controller");

function createOpportunitiesRouter(env) {
  const router = express.Router();
  const requireAuth = authenticate({ jwtSecret: env.JWT_SECRET });

  router.get("/feed", requireAuth, getOpportunityFeed);
  router.get("/metrics", requireAuth, getOpportunityMetrics);

  return router;
}

module.exports = { createOpportunitiesRouter };
