const paymentModel = require("../models/payment.model");
const jwt = require("jsonwebtoken");
const axios = require("axios");

//Razorpay Integration
require("dotenv").config();
const Razorpay = require("razorpay");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

//createPayment Controller
async function createPayment(req, res) {
  const token = req.cookies?.token || req.headers?.authorization?.split(" ")[1];
  try {
    const orderId = req.params.orderId;
    const orderResponse = await axios.get(
      `http://localhost:3003/api/order/` + orderId,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const totalAmount = orderResponse.data.data.order.totalPrice.amount;

    const order = await razorpay.orders.create(totalAmount);

    const payment = await paymentModel.create({
      order: orderId,
      razorPayOrderId: order.id,
      user: req.user.id,
      price: {
        amount: order.amount,
        currency: order.currency,
      },
    });

    return res.status(200).json({
      message: "Payment initiated",
      payment,
    });
  } catch (error) {
    console.log(error)
    return res.status(401).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
}

module.exports = { createPayment };
