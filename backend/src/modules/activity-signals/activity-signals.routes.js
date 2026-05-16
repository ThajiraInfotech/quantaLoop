const express = require("express");

const { authenticate } = require("../../middleware/auth");
const { listInsights } = require("./insight.controller");
const { asyncHandler } = require("../../utils/asyncHandler");
const { sendSuccess } = require("../../utils/apiResponse");
const {
  computeUserEngagementScore,
  getProviderResponseQuality,
} = require("../engagement/engagement.service");

function createActivitySignalsRouter(env) {
  const router = express.Router();
  const requireAuth = authenticate({ jwtSecret: env.JWT_SECRET });

  router.get("/insights", requireAuth, listInsights);

  /** Polling-ready engagement summary for responsive UI */
  router.get(
    "/summary",
    requireAuth,
    asyncHandler(async (req, res) => {
      const [engagementScore, responseQuality] = await Promise.all([
        computeUserEngagementScore(req.user.id),
        req.user.role === "material_provider"
          ? getProviderResponseQuality(req.user.id)
          : Promise.resolve(null),
      ]);

      sendSuccess(
        res,
        {
          engagementScore,
          responseQuality,
          refreshedAt: new Date().toISOString(),
        },
        "Activity signals retrieved"
      );
    })
  );

  return router;
}

module.exports = { createActivitySignalsRouter };
