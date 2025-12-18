const express = require("express");
const { createProduct, getproducts, getProductById , updateProduct} = require("../controllers/product.controller");
const multer = require("multer");
const { createAuthMiddleware } = require("../middlewares/auth.middleware");
const { createProductValidation } = require("../validators/product.validator");

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

//Routes
router.post(
  "/",
  createAuthMiddleware(["admin", "seller"]),
  upload.array("images", 5),
  createProductValidation,
  createProduct
);
router.get('/',getproducts)
router.get('/:id',getProductById)
router.patch('/:id',createAuthMiddleware(["seller"]),upload.array("images"),updateProduct)

module.exports = router;
