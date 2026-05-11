const express = require("express");
const { listMaterials } = require("./materials.controller");
const { authenticate } = require("../../middleware/auth");

function createMaterialsRouter(env) {
  const router = express.Router();
  const requireAuth = authenticate({ jwtSecret: env.JWT_SECRET });

  router.get("/", requireAuth, listMaterials);

  return router;
}

module.exports = { createMaterialsRouter };
