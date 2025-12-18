const express = require("express");
const { createCart, updateCart, getCart } = require("../controllers/cart.controller");
const { createAuthMiddleware } = require("../middlewares/auth.middleware");
const {
  createCartValidation,
  updateCartValidation,
} = require("../validator/cart.validator");

const router = express.Router();

router.get(
  "/",
  createAuthMiddleware(["user"]),
  getCart
);
router.post(
  "/items",
  createAuthMiddleware(["user"]),
  createCartValidation,
  createCart
);
router.patch(
  "/items/:productId",
  createAuthMiddleware(["user"]),
  updateCartValidation,
  updateCart
);
module.exports = router;
