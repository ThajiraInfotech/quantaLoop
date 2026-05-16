const express = require("express");

const { authenticate } = require("../../middleware/auth");
const {
  getMyProfile,
  patchMyProfile,
  getProfileById,
} = require("./profile.controller");

function createProfileRouter(env) {
  const router = express.Router();
  const requireAuth = authenticate({ jwtSecret: env.JWT_SECRET });

  router.get("/me", requireAuth, getMyProfile);
  router.patch("/me", requireAuth, patchMyProfile);
  router.get("/:id", requireAuth, getProfileById);

  return router;
}

module.exports = { createProfileRouter };
