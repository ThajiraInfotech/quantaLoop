const express = require("express");

const { authenticate, authorize } = require("../../middleware/auth");
const {
  listPendingVerifications,
  patchUserVerification,
} = require("./verification.controller");

function createVerificationRouter(env) {
  const router = express.Router();
  const requireAuth = authenticate({ jwtSecret: env.JWT_SECRET });
  const adminOnly = authorize("admin");

  router.get("/pending", requireAuth, adminOnly, listPendingVerifications);
  router.patch(
    "/users/:userId",
    requireAuth,
    adminOnly,
    patchUserVerification
  );

  return router;
}

module.exports = { createVerificationRouter };
