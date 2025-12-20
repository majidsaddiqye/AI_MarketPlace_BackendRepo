const paymentModel = require("../models/payment.model");
const axios = require("axios");
const Razorpay = require("razorpay");
const {
    validatePaymentVerification,
  } = require("../../node_modules/razorpay/dist/utils/razorpay-utils.js");

//Razorpay Integration
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
    console.log(error);
    return res.status(401).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
}

//verifyPayment Controller
async function verifyPayment(req, res) {
  const {razorPayOrderId,paymentId,signature} =req.body
  const secret  = process.env.RAZORPAY_KEY_SECRET
  try {
    const result = validatePaymentVerification(
      { order_id: razorPayOrderId, payment_id: paymentId },
      signature,
      secret
    );

    if (!result) {
      return res.status(401).json({
        message: "Invalid Signature",
      });
    }

    const payment = await paymentModel.findOne({
      razorPayOrderId,
      status: "PENDING",
    });

    if (!payment) {
      return res.status(401).json({
        message: "Payment not found",
      });
    }

    payment.paymentId = paymentId;
    payment.signature = signature;
    payment.status = "COMPLETED";

    await payment.save();

    return res.status(201).json({
      message: "Payment Verify Successfully",
      payment,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
}

module.exports = { createPayment, verifyPayment };
