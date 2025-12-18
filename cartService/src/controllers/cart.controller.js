const cartModel = require("../models/cart.model");

//createCart controller
async function createCart(req, res) {
  try {
    const { productId, quantity } = req.body;
    const userId = req.user.id;

    // Check if the product exists
    const cart = await createModel.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }
    // Check if the product already exists in the cart
    const product = cart.products.find(
      (product) => product.productId.toString() === productId
    );
    if (product) {
      return res
        .status(400)
        .json({ message: "Product already exists in the cart" });
    }

    const carts = await cartModel.create({
      user: userId,
      products: [{ productId, quantity }],
    });
    return res
      .status(201)
      .json({ message: "Cart created successfully", carts });
  } catch (error) {
    return res.status(500).json({ message: "Error creating cart", error });
  }
}

//updateCart controller
async function updateCart(req, res) {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;
    const userId = req.user.id;

    const cart = await cartModel.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const product = cart.products.find(
      (p) => p.productId.toString() === productId
    );
    if (!product) {
      return res.status(404).json({ message: "Product not found in cart" });
    }

    product.quantity = quantity;
    await cart.save();

    return res.status(200).json({
      message: "Cart updated successfully",
      cart,
    });
  } catch (error) {
    return res.status(500).json({ message: "Error updating cart", error });
  }
}

//getCart controller
async function getCart(req, res) {
  try {
    const userId = req.user.id;

    let cart = await cartModel.findOne({ user: userId });

    if (!cart) {
      cart = await cartModel.create({ user: userId, products: [] });
    }

    const itemCount = cart.products.length;
    const totalQuantity = cart.products.reduce((sum, p) => sum + p.quantity, 0);

    return res.status(200).json({
      message: "Cart fetched successfully",
      cart,
      totals: { itemCount, totalQuantity },
    });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching cart", error });
  }
}

module.exports = {
  createCart,
  updateCart,
  getCart,
};
