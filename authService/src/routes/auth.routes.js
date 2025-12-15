const express = require("express");
const router = express.Router();
const { registerController, loginController } = require("../controllers/auth.controller");
const {
  registerUserValidation,
  loginUserValidation,
} = require("../middlewares/validator.middleware");

//  Routes
router.post("/register", registerUserValidation, registerController);
router.post("/login", loginUserValidation, loginController);

module.exports = router;
