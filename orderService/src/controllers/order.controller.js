const orderModel = require("../models/order.models");
const axios = require("axios");
const mongoose = require("mongoose");
const { publishToQueue } = require("../broker/broker");

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

    await publishToQueue("ORDER_SELLER_DASHBOARD.ORDER_CREATED", order)
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

    // Return order
    return res.status(200).json({
      message: "Order retrieved successfully",
      data: {
        order: {
          id: order._id,
          user: order.user,
          items: order.items,
          status: order.status,
          totalPrice: order.totalPrice,
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

// getMyOrders Controller - Get all orders for the authenticated user
async function getMyOrders(req, res) {
  const user = req.user;
  const { status, page = 1, limit = 10 } = req.query;

  try {
    // Build query filter
    const filter = { user: user.id };
    
    // Add status filter if provided
    if (status) {
      const validStatuses = ["pending", "confirmed", "shipped", "delivered", "cancelled"];
      if (validStatuses.includes(status)) {
        filter.status = status;
      } else {
        return res.status(400).json({
          message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        });
      }
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    // Fetch orders with pagination
    const orders = await orderModel
      .find(filter)
      .sort({ createdAt: -1 }) // Sort by newest first
      .skip(skip)
      .limit(limitNum);

    // Get total count for pagination info
    const totalOrders = await orderModel.countDocuments(filter);
    const totalPages = Math.ceil(totalOrders / limitNum);

    // Return orders with pagination info
    return res.status(200).json({
      message: "Orders retrieved successfully",
      data: {
        orders: orders.map((order) => ({
          id: order._id,
          items: order.items,
          status: order.status,
          totalPrice: order.totalPrice,
          shippingAddress: order.shippingAddress,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
        })),
        pagination: {
          currentPage: parseInt(page),
          totalPages: totalPages,
          totalOrders: totalOrders,
          limit: limitNum,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1,
        },
      },
    });
  } catch (error) {
    console.error("Get my orders error:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
}

// cancelOrder Controller - Cancel an order by ID
async function cancelOrder(req, res) {
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

    // Check if user owns the order (users can only cancel their own orders)
    if (order.user.toString() !== user.id) {
      return res.status(403).json({
        message: "Forbidden: You can only cancel your own orders",
      });
    }

    // Check if order can be cancelled
    // Typically, only "pending" and "confirmed" orders can be cancelled
    // Orders that are "shipped", "delivered", or already "cancelled" cannot be cancelled
    const cancellableStatuses = ["pending", "confirmed"];
    if (!cancellableStatuses.includes(order.status)) {
      return res.status(400).json({
        message: `Order cannot be cancelled. Current status: ${order.status}. Only orders with status "pending" or "confirmed" can be cancelled.`,
      });
    }

    // Update order status to cancelled
    order.status = "cancelled";
    const updatedOrder = await order.save();

    // Return success response with updated order
    return res.status(200).json({
      message: "Order cancelled successfully",
      data: {
        order: {
          id: updatedOrder._id,
          items: updatedOrder.items,
          status: updatedOrder.status,
          totalPrice: updatedOrder.totalPrice,
          shippingAddress: updatedOrder.shippingAddress,
          createdAt: updatedOrder.createdAt,
          updatedAt: updatedOrder.updatedAt,
        },
      },
    });
  } catch (error) {
    console.error("Cancel order error:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
}

// updateOrderAddress Controller - Update shipping address of an order
async function updateOrderAddress(req, res) {
  const user = req.user;
  const { id } = req.params;
  const { shippingAddress } = req.body;

  try {
    // Validate order ID format
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid order ID",
      });
    }

    // Validate shipping address
    if (!shippingAddress) {
      return res.status(400).json({
        message: "Shipping address is required",
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

    // Check if user owns the order (users can only update their own orders)
    if (order.user.toString() !== user.id) {
      return res.status(403).json({
        message: "Forbidden: You can only update your own orders",
      });
    }

    // Check if order address can be updated
    // Typically, only "pending" and "confirmed" orders can have their address updated
    // Orders that are "shipped", "delivered", or "cancelled" cannot be updated
    const updatableStatuses = ["pending", "confirmed"];
    if (!updatableStatuses.includes(order.status)) {
      return res.status(400).json({
        message: `Order address cannot be updated. Current status: ${order.status}. Only orders with status "pending" or "confirmed" can have their address updated.`,
      });
    }

    // Update shipping address
    // Merge with existing address to allow partial updates
    order.shippingAddress = {
      ...order.shippingAddress,
      ...shippingAddress,
    };

    const updatedOrder = await order.save();

    // Return success response with updated order
    return res.status(200).json({
      message: "Order address updated successfully",
      data: {
        order: {
          id: updatedOrder._id,
          items: updatedOrder.items,
          status: updatedOrder.status,
          totalPrice: updatedOrder.totalPrice,
          shippingAddress: updatedOrder.shippingAddress,
          createdAt: updatedOrder.createdAt,
          updatedAt: updatedOrder.updatedAt,
        },
      },
    });
  } catch (error) {
    console.error("Update order address error:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
}

module.exports = { createOrder, getOrderById, getMyOrders, cancelOrder, updateOrderAddress };
