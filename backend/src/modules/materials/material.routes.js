const express = require("express");

const { authenticate, authorize } = require("../../middleware/auth");
const {
  listMaterials,
  getMaterialById,
  getMaterialTimeline,
  createMaterial,
  updateMaterial,
} = require("./material.controller");

function createMaterialsRouter(env) {
  const router = express.Router();
  const requireAuth = authenticate({ jwtSecret: env.JWT_SECRET });
  const canPublishMaterial = authorize("material_provider", "admin");

  router.post("/", requireAuth, canPublishMaterial, createMaterial);
  router.get("/", requireAuth, listMaterials);
  router.get("/:id/timeline", requireAuth, getMaterialTimeline);
  router.get("/:id", requireAuth, getMaterialById);
  router.patch("/:id", requireAuth, canPublishMaterial, updateMaterial);

  return router;
}

module.exports = { createMaterialsRouter };
