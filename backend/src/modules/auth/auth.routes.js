const express = require("express");
const { createAuthController } = require("./auth.controller");

function createAuthRouter(env) {
  const router = express.Router();
  const controller = createAuthController(env);

  router.post("/register", controller.register);
  router.post("/login", controller.login);
  router.post("/logout", controller.logout);

  return router;
}

module.exports = { createAuthRouter };
