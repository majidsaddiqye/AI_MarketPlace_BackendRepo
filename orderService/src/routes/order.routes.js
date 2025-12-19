const express = require("express");
const {createAuthMiddleware} = require("../middlewares/auth.middleware");
const { createOrder, getOrderById, getMyOrders, cancelOrder, updateOrderAddress } = require("../controllers/order.controller");

const router = express.Router();

router.post("/", createAuthMiddleware(["user"]), createOrder);
router.get("/me", createAuthMiddleware(["user"]), getMyOrders); 
router.post("/:id/cancel", createAuthMiddleware(["user"]), cancelOrder); 
router.patch("/:id/address", createAuthMiddleware(["user"]), updateOrderAddress); 
router.get("/:id", createAuthMiddleware(["user"]), getOrderById);

module.exports = router;
