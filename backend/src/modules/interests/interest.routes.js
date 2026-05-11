const express = require("express");

const { authenticate, authorize } = require("../../middleware/auth");
const {
  createInterest,
  listMyInterests,
  getMyInterestForMaterial,
  updateInterestStatus,
} = require("./interest.controller");

function createInterestsRouter(env) {
  const router = express.Router();
  const requireAuth = authenticate({ jwtSecret: env.JWT_SECRET });

  router.get("/my", requireAuth, listMyInterests);
  router.get("/material/:materialId/me", requireAuth, getMyInterestForMaterial);
  router.post("/", requireAuth, authorize("verified_buyer"), createInterest);
  router.patch(
    "/:id/status",
    requireAuth,
    authorize("material_provider", "admin"),
    updateInterestStatus
  );

  return router;
}

module.exports = { createInterestsRouter };
