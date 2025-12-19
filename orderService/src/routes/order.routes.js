const express = require("express");
const {createAuthMiddleware} = require("../middlewares/auth.middleware");
const { createOrder, getOrderById, getMyOrders, cancelOrder, updateOrderAddress } = require("../controllers/order.controller");

const router = express.Router();

router.post("/", createAuthMiddleware(["user"]), createOrder);
router.get("/me", createAuthMiddleware(["user"]), getMyOrders); // Must be before /:id to avoid route conflicts
router.post("/:id/cancel", createAuthMiddleware(["user"]), cancelOrder); // Must be before /:id to avoid route conflicts
router.patch("/:id/address", createAuthMiddleware(["user"]), updateOrderAddress); // Must be before /:id to avoid route conflicts
router.get("/:id", createAuthMiddleware(["user"]), getOrderById);

module.exports = router;
