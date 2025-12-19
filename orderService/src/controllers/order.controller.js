const orderModel = require("../models/order.models");
const axios = require("axios");
const mongoose = require("mongoose");

// createOrder Controller
async function createOrder(req, res) {
  const user = req.user;
  const token = req.cookies?.token || req.headers?.authorization?.split(" ")[1];
  const  {shippingAddress}  = req.body;

  try {
    // Fetch user cart from cart service
    const cartResponse = await axios.get(`http://localhost:3002/api/cart/`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const cart = cartResponse.data.cart;

    // Check if cart is empty
    if (!cart || !cart.products || cart.products.length === 0) {
      return res.status(400).json({
        message: "Cart is empty. Cannot create order.",
      });
    }

    // Fetch product details and build order items
    const orderItems = [];
    let totalAmount = 0;
    let currency = "PKR"; // Default currency

    for (const cartItem of cart.products) {
      try {
        // Fetch product details from product service
        const productResponse = await axios.get(
          `http://localhost:3001/api/product/${cartItem.productId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        const product = productResponse.data.data;

        // Check if product exists
        if (!product) {
          return res.status(404).json({
            message: `Product with ID ${cartItem.productId} not found`,
          });
        }

        // Check stock availability
        if (product.stock < cartItem.quantity) {
          return res.status(400).json({
            message: `Insufficient stock for product ${product.title}. Available: ${product.stock}, Requested: ${cartItem.quantity}`,
          });
        }

        // Calculate item total
        const itemTotal = product.price.amount * cartItem.quantity;
        totalAmount += itemTotal;
        currency = product.price.currency; // Use product currency

        // Build order item
        orderItems.push({
          product: cartItem.productId,
          quantity: cartItem.quantity,
          price: {
            amount: product.price.amount,
            currency: product.price.currency,
          },
        });
      } catch (error) {
        if (error.response?.status === 404) {
          return res.status(404).json({
            message: `Product with ID ${cartItem.productId} not found`,
          });
        }
        throw error;
      }
    }

    // Validate shipping address
    if (!shippingAddress) {
      return res.status(400).json({
        message: "Shipping address is required",
      });
    }

    // Create order
    const order = await orderModel.create({
      user: user.id,
      items: orderItems,
      status: "pending",
      totalPrice: {
        amount: totalAmount,
        currency: currency,
      },
      shippingAddress: shippingAddress,
    });

    // Clear cart after successful order creation
    try {
      await axios.delete(`http://localhost:3002/api/cart/`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
    } catch (error) {
      // Log error but don't fail the order creation
      console.error("Failed to clear cart:", error.message);
    }

    // Return success response
    return res.status(201).json({
      message: "Order created successfully",
      order: order,
    });
  } catch (error) {
    console.error("Create order error:", error);
    return res.status(500).json({
      message: "Internal server Error",
      error: error.message,
    });
  }
}

// getOrderById Controller
async function getOrderById(req, res) {
  const user = req.user;
  const { id } = req.params;

  try {
    // Validate order ID format
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid order ID",
      });
    }

    // Fetch order from database
    const order = await orderModel.findById(id);

    // Check if order exists
    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    // Check if user owns the order (users can only view their own orders)
    if (order.user.toString() !== user.id) {
      return res.status(403).json({
        message: "Forbidden: You can only view your own orders",
      });
    }

    

    

    // If order status is not pending, add the current status event
    if (order.status !== "pending") {
      const statusEvent = statusEvents[order.status];
      if (statusEvent) {
        timeline.push({
          event: statusEvent.event,
          status: order.status,
          timestamp: order.updatedAt, // Using updatedAt as approximation for status change time
          description: statusEvent.description,
        });
      }
    }

    // Return order with timeline and payment summary
    return res.status(200).json({
      message: "Order retrieved successfully",
      data: {
        order: {
          id: order._id,
          user: order.user,
          items: order.items,
          status: order.status,
          shippingAddress: order.shippingAddress,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
        },
      },
    });
  } catch (error) {
    console.error("Get order by ID error:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
}

module.exports = { createOrder, getOrderById };
