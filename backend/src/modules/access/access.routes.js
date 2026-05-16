const express = require("express");

const { authenticate } = require("../../middleware/auth");
const { getPlans } = require("./access.controller");

function createAccessRouter(env) {
  const router = express.Router();
  const requireAuth = authenticate({ jwtSecret: env.JWT_SECRET });

  router.get("/plans", requireAuth, getPlans);

  return router;
}

module.exports = { createAccessRouter };
