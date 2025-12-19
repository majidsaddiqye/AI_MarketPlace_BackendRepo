const express = require("express");
const {createAuthMiddleware} = require("../middlewares/auth.middleware");
const { createOrder, getOrderById, getMyOrders } = require("../controllers/order.controller");

const router = express.Router();

router.post("/", createAuthMiddleware(["user"]), createOrder);
router.get("/me", createAuthMiddleware(["user"]), getMyOrders); // Must be before /:id to avoid route conflicts
router.get("/:id", createAuthMiddleware(["user"]), getOrderById);

module.exports = router;
