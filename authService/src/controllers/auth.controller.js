const bcrypt = require("bcryptjs");
const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");

// Register Controller
const registerController = async (req, res) => {

  try {
    const {
    username,
    email,
    password,
    fullName: { firstName, lastName },
  } = req.body;
  
    // Check All Field are Required
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).send({ message: "All fields are required" });
    }

    //Check User Exist
    const isUserExist = await userModel.findOne({
      $or: [{ username }, { email }],
    });

    if (isUserExist) {
      return res.status(409).json({ message: "User already exists" });
    }

    // Convert password into Hashed
    const hashPassword = await bcrypt.hash(password, 10);

    //Create User in DB
    const user = await userModel.create({
      username,
      email,
      password: hashPassword,
      fullName: { firstName, lastName },
    });

    //Create jwt Token
    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      maxAge: 24 * 60 * 60 * 1000, //1 Day
    });

    //Return Response
    return res.status(201).send({
      message: "User Registered successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        addresses: user.addresses,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error registering user",
      error: error.message,
    });
  }
};

module.exports = {
  registerController,
};
