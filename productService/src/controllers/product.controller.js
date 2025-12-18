const productModel = require("../models/product.model");
const { uploadImage } = require("../services/imageKit.service");
const mongoose = require("mongoose");

// createProduct Controller
async function createProduct(req, res) {
  try {
    const { title, description, priceAmount, priceCurrency = "PKR" } = req.body;

    const seller = req.user.id;

    const price = {
      amount: Number(priceAmount),
      currency: priceCurrency,
    };

    // Upload images if any
    const images = await Promise.all(
      (req.files || []).map((file) => uploadImage({ buffer: file.buffer }))
    );

    const product = await productModel.create({
      title,
      description,
      price,
      seller,
      images,
    });

    return res.status(201).json({
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    console.error("Error creating product:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
}

//getproducts Controller
async function getproducts(req, res) {
  const { q, minprice, maxprice, skip = 0, limit = 20 } = req.query;

  const filter = {};

  if (q) {
    filter.$text = { $search: q };
  }

  if (minprice) {
    filter["price.amount"] = {
      ...filter["price.amount"],
      $lte: Number(minprice),
    };
  }

  if (maxprice) {
    filter["price.amount"] = {
      ...filter["price.amount"],
      $lte: Number(maxprice),
    };
  }

  const product = await productModel
    .find(filter)
    .skip(Number(skip))
    .limit(Math.min(Number(limit), 20));

  return res.status(200).json({
    data: product,
  });
}

//getProductById Controller
async function getProductById(req, res) {
  const { id } = req.params;
  const product = await productModel.findById(id);

  if (!product) {
    return res.status(404).json({
      message: "Product not found",
    });
  }

  return res.status(200).json({
    data: product,
  });
}

//updateProduct Controller
async function updateProduct(req, res) {
  const { id } = req.params;
  const body = req.body || {};

  // Check if the product id is valid
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid product id" });
  }

  // Check if the product exists and is owned by the seller
  const product = await productModel.findOne({ _id: id, seller: req.user.id });
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  // Update the product
  if (body.title) product.title = body.title;
  if (body.description) product.description = body.description;

  // Update the price if it is provided
  if (body.priceAmount || body.priceCurrency) {
    product.price = {
      amount: body.priceAmount
        ? Number(body.priceAmount)
        : product.price.amount,
      currency: body.priceCurrency || product.price.currency,
    };
  }

  // Save the product
  const updatedProduct = await product.save();

  // Return the updated product
  return res.status(200).json({
    message: "Product updated successfully",
    data: updatedProduct,
  });
}

//deleteProduct Controller
async function deleteProduct(req, res) {
  try {
    const { id } = req.params;

    // Check if the product id is valid
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid product id" });
    }

    // Check if the product exists
    const product = await productModel.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if user is admin or the product owner (seller)
    const isOwner = product.seller.toString() === req.user.id.toString();

    if (!isOwner) {
      return res.status(403).json({
        message: "You do not have permission to delete this product",
      });
    }

    // Delete the product
    await productModel.findByIdAndDelete(id);

    return res.status(200).json({
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
}


module.exports = { createProduct, getproducts, getProductById, updateProduct, deleteProduct };
