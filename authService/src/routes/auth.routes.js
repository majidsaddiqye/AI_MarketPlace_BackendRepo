const express = require("express");
const router = express.Router();
const {
  registerController,
  loginController,
  getUserController,
  logOutController,
  getUserAddresses,
  addUserAddress,
} = require("../controllers/auth.controller");
const {
  registerUserValidation,
  loginUserValidation,
  addUserAdressValidation,
  deleteuserAddress,
} = require("../middlewares/validator.middleware");
const { authMiddleware } = require("../middlewares/auth.middleware");

//  Routes
router.post("/register", registerUserValidation, registerController);
router.post("/login", loginUserValidation, loginController);
router.get("/me", authMiddleware, getUserController);
router.get("/logout", logOutController);
router.get("/users/me/addresses", authMiddleware, getUserAddresses);
router.post(
  "/users/me/addresses",
  addUserAdressValidation,
  authMiddleware,
  addUserAddress
);
router.delete(
  "/users/me/addresses/:addressId",
  authMiddleware,
  deleteuserAddress
);
module.exports = router;
