const express = require("express");

const { authenticate } = require("../../middleware/auth");
const {
  listReminders,
  dismissReminderHandler,
} = require("./reminder.controller");

function createRemindersRouter(env) {
  const router = express.Router();
  const requireAuth = authenticate({ jwtSecret: env.JWT_SECRET });

  router.get("/", requireAuth, listReminders);
  router.patch("/:id/dismiss", requireAuth, dismissReminderHandler);

  return router;
}

module.exports = { createRemindersRouter };
