const express = require("express");

const { authenticate } = require("../../middleware/auth");
const { asyncHandler } = require("../../utils/asyncHandler");
const { sendSuccess } = require("../../utils/apiResponse");
const { listForUser } = require("../timeline/timeline.service");

function createActivityRouter(env) {
  const router = express.Router();
  const requireAuth = authenticate({ jwtSecret: env.JWT_SECRET });

  router.get(
    "/",
    requireAuth,
    asyncHandler(async (req, res) => {
      const limit = Math.min(
        80,
        Math.max(1, Number.parseInt(String(req.query.limit ?? "40"), 10) || 40)
      );
      const items = await listForUser(req.user.id, limit);
      sendSuccess(res, { items }, "Activity retrieved");
    })
  );

  return router;
}

module.exports = { createActivityRouter };
