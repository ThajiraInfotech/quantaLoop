const express = require("express");

const { authenticate } = require("../../middleware/auth");
const {
  listMaterialRecommendations,
  listParticipantRecommendations,
} = require("./recommendation.controller");

function createRecommendationsRouter(env) {
  const router = express.Router();
  const requireAuth = authenticate({ jwtSecret: env.JWT_SECRET });

  router.get("/materials", requireAuth, listMaterialRecommendations);
  router.get("/participants", requireAuth, listParticipantRecommendations);

  return router;
}

module.exports = { createRecommendationsRouter };
