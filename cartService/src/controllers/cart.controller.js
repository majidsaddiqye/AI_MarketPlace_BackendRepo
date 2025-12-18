const cartModel = require("../models/cart.model");

//createCart controller
async function createCart(req, res) {
    try {
        const { productId, quantity } = req.body;
        const userId = req.user.id;
    
        let cart = await cartModel.findOne({ user: userId });
    
        if (!cart) {
          cart = await cartModel.create({
            user: userId,
            products: [{ productId, quantity }],
          });
          return res.status(201).json({ message: "Cart created", cart });
        }
    
        const exists = cart.products.find(
          (p) => p.productId.toString() === productId
        );
    
        if (exists) {
          return res.status(400).json({ message: "Product already in cart" });
        }
    
        cart.products.push({ productId, quantity });
        await cart.save();
    
        return res.status(200).json({ message: "Product added", cart });
      } catch (error) {
        return res.status(500).json({ message: "Add to cart failed", error });
      }
}

//updateCart controller
async function updateCart(req, res) {
    try {
        const { productId } = req.params;
        const { quantity } = req.body;
        const userId = req.user.id;
    
        const cart = await cartModel.findOne({ user: userId });
        if (!cart) return res.status(404).json({ message: "Cart not found" });
    
        const product = cart.products.find(
          (p) => p.productId.toString() === productId
        );
        if (!product)
          return res.status(404).json({ message: "Product not in cart" });
    
        product.quantity = quantity;
        await cart.save();
    
        return res.status(200).json({ message: "Cart updated", cart });
      } catch (error) {
        return res.status(500).json({ message: "Update failed", error });
      }
}

//getCart controller
async function getCart(req, res) {
    try {
        const userId = req.user.id;
    
        const cart = await cartModel.findOne({ user: userId });
    
        if (!cart) {
          return res.status(200).json({
            message: "Cart is empty",
            cart: null,
            totals: { itemCount: 0, totalQuantity: 0 },
          });
        }
    
        const itemCount = cart.products.length;
        const totalQuantity = cart.products.reduce((s, p) => s + p.quantity, 0);
    
        return res.status(200).json({
          message: "Cart fetched",
          cart,
          totals: { itemCount, totalQuantity },
        });
      } catch (error) {
        return res.status(500).json({ message: "Fetch cart failed", error });
      }
}

//clearCart controller
async function clearCart(req, res) {
    try {
        const userId = req.user.id;
    
        await cartModel.findOneAndDelete({ user: userId });
    
        return res.status(200).json({ message: "Cart deleted" });
      } catch (error) {
        return res.status(500).json({ message: "Clear failed", error });
      }
}

//removeCartItem controller
async function removeCartItem(req, res) {
    try {
        const { productId } = req.params;
        const userId = req.user.id;
    
        const cart = await cartModel.findOne({ user: userId });
        if (!cart) return res.status(404).json({ message: "Cart not found" });
    
        cart.products = cart.products.filter(
          (p) => p.productId.toString() !== productId
        );
    
        await cart.save();
        return res.status(200).json({ message: "Item removed", cart });
      } catch (error) {
        return res.status(500).json({ message: "Remove failed", error });
      }
}

module.exports = {
  createCart,
  updateCart,
  getCart,
  clearCart,
  removeCartItem,
};
