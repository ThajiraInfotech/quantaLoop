const express = require("express");

const { authenticate } = require("../../middleware/auth");
const { getSuggestions } = require("./match.controller");

function createMatchesRouter(env) {
  const router = express.Router();
  const requireAuth = authenticate({ jwtSecret: env.JWT_SECRET });

  router.get("/suggestions", requireAuth, getSuggestions);

  return router;
}

module.exports = { createMatchesRouter };
