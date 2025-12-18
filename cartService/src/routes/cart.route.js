const express = require("express");
const { createCart } = require("../controllers/cart.controller");
const { createAuthMiddleware } = require("../middlewares/auth.middleware");
const { createCartValidation } = require("../validator/cart.validator");

const router = express.Router();

router.post(
  "/items",
  createAuthMiddleware(["user"]),
  createCartValidation,
  createCart
);

module.exports = router;
