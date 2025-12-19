const express = require("express");
const {createAuthMiddleware} = require("../middlewares/auth.middleware");
const { createOrder, getOrderById } = require("../controllers/order.controller");

const router = express.Router();

router.post("/", createAuthMiddleware(["user"]), createOrder);
router.get("/:id", createAuthMiddleware(["user"]), getOrderById);

module.exports = router;
