const express = require("express");
const router = express.Router();
const {
  registerController,
  loginController,
  getUserController, logOutController 
} = require("../controllers/auth.controller");
const {
  registerUserValidation,
  loginUserValidation,
} = require("../middlewares/validator.middleware");

const { authMiddleware } = require("../middlewares/auth.middleware");

//  Routes
router.post("/register", registerUserValidation, registerController);
router.post("/login", loginUserValidation, loginController);
router.get("/me", authMiddleware, getUserController);
router.get('/logout',logOutController )

module.exports = router;
