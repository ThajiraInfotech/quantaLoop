const express = require("express");

const { authenticate } = require("../../middleware/auth");
const {
  saveMaterial,
  unsaveMaterial,
  listSavedMaterials,
} = require("./saved-material.controller");

function createSavedMaterialsRouter(env) {
  const router = express.Router();
  const requireAuth = authenticate({ jwtSecret: env.JWT_SECRET });

  router.get("/", requireAuth, listSavedMaterials);
  router.post("/:materialId", requireAuth, saveMaterial);
  router.delete("/:materialId", requireAuth, unsaveMaterial);

  return router;
}

module.exports = { createSavedMaterialsRouter };
