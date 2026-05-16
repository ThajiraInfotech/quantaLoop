const express = require("express");

const { authenticate } = require("../../middleware/auth");
const { overview } = require("./network.controller");

function createNetworkRouter(env) {
  const router = express.Router();
  const requireAuth = authenticate({ jwtSecret: env.JWT_SECRET });

  router.get("/overview", requireAuth, overview);

  return router;
}

module.exports = { createNetworkRouter };
