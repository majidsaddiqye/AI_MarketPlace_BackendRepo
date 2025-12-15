const express = require("express");
const router = express.Router();
const { registerController } = require("../controllers/auth.controller");
const {
  registerUserValidation,
} = require("../middlewares/validator.middleware");



// Register route
router.post("/register", registerUserValidation, registerController);



module.exports = router;
