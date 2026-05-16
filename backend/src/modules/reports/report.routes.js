const express = require("express");

const { authenticate, authorize } = require("../../middleware/auth");
const { createReport, listReports, resolveReport } = require("./report.controller");

function createReportsRouter(env) {
  const router = express.Router();
  const requireAuth = authenticate({ jwtSecret: env.JWT_SECRET });
  const adminOnly = authorize("admin");

  router.post("/", requireAuth, createReport);
  router.get("/", requireAuth, adminOnly, listReports);
  router.patch("/:id/resolve", requireAuth, adminOnly, resolveReport);

  return router;
}

module.exports = { createReportsRouter };
