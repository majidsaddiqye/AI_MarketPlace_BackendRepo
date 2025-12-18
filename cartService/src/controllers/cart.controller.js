const cartModel = require('../models/cart.model');


async function createCart(req, res) {
    
    try {
        const { productId, quantity } = req.body;
        const userId = req.user.id;
        const cart = await cartModel.create({ user: userId, products: [{ productId, quantity }] });
        return res.status(201).json({ message: "Cart created successfully", cart });
    } catch (error) {
        return res.status(500).json({ message: "Error creating cart", error });
    }
}





module.exports = {
    createCart,
}