const express = require("express");

const { authenticate } = require("../../middleware/auth");
const {
  listMyConversations,
  getConversationById,
  listConversationMessages,
} = require("./conversation.controller");

function createConversationsRouter(env) {
  const router = express.Router();
  const requireAuth = authenticate({ jwtSecret: env.JWT_SECRET });

  router.get("/mine", requireAuth, listMyConversations);
  router.get("/:id/messages", requireAuth, listConversationMessages);
  router.get("/:id", requireAuth, getConversationById);

  return router;
}

module.exports = { createConversationsRouter };
