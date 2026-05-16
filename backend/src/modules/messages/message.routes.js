const express = require("express");

const { authenticate } = require("../../middleware/auth");
const { createMessage } = require("./message.controller");

function createMessagesRouter(env) {
  const router = express.Router();
  const requireAuth = authenticate({ jwtSecret: env.JWT_SECRET });

  router.post("/", requireAuth, createMessage);

  return router;
}

module.exports = { createMessagesRouter };
