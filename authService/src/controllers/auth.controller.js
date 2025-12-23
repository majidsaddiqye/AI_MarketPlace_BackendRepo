const bcrypt = require("bcryptjs");
const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");
const redis = require("../db/redis");
const { publishToQueue } = require("../broker/broker")

// Register Controller
const registerController = async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      fullName: { firstName, lastName },
      role,
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
      role: role || "user",
    });

    //Send Email to register user
    await Promise.all([
      publishToQueue('AUTH_NOTIFICATION.USER_CREATED', {
          id: user._id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
      }),
      publishToQueue("AUTH_SELLER_DASHBOARD.USER_CREATED", user)
  ]);

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

// Login Controller
const loginController = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check All Field are Required
    if ((!email && !username) || !password) {
      return res
        .status(400)
        .send({ message: "Email or Username and Password are required" });
    }

    //Check User Exist
    const user = await userModel
      .findOne({ $or: [{ email }, { username }] })
      .select("+password");

    if (!user) {
      return res.status(401).send({ message: "Invalid email or password" });
    }

    // Check password into DB
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).send({ message: "Invalid password" });
    }

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
      message: "User Login successfully",
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

//getUser Controller
const getUserController = async (req, res) => {
  return res.status(200).json({
    message: "Current User Fetched Successfully.",
    user: req.user,
  });
};

//LogoutUser Controller
const logOutController = async (req, res) => {
  const { token } = req.cookies;

  if (token) {
    await redis.set(`blacklist:${token}`, "true", "EX", 24 * 60 * 60);
  }

  res.clearCookie("token", {
    httpOnly: true,
    secure: true,
  });

  return res.status(200).json({
    message: "User LogOut Successfully",
  });
};

//getUserAddresses controller
const getUserAddresses = async (req, res) => {
  // user id get to authMiddleware
  const id = req.user.id;

  //Find user By Id in DB
  const user = await userModel.findById(id).select("addresses");

  //If User not Exist in DB
  if (!user) {
    return res.status(404).json({
      message: "User not Found",
    });
  }

  //Retrun Response
  return res.status(200).json({
    message: "User addressed fetched successfully",
    addresses: user.addresses,
  });
};

//addUserAddress Controller
const addUserAddress = async (req, res) => {
  // user id get to authMiddleware
  const id = req.user.id;

  const { street, city, state, zip, country, isDefault } = req.body;

  // update Adresses
  const user = await userModel.findOneAndUpdate(
    { _id: id },
    {
      $push: {
        addresses: { street, city, state, zip, country, isDefault },
      },
    },
    { new: true }
  );

  // check if user not Exist
  if (!user) {
    return res.status(404).json({
      message: "User not Found",
    });
  }

  //Return response
  return res.status(200).json({
    message: "Addresses Added Successfully",
    addresses: user.addresses[user.addresses.length - 1],
  });
};

// deleteuserAddress Controller
const deleteuserAddress = async (req, res) => {
  // user id get to authMiddleware
  const id = req.user.id;

  //addressId get to middleware
  const { addressId } = req.params;

  // Checks whether the given addressId exists for the specified user
  const isAddressIdExist = await userModel.findOne({
    _id: id,
    "addresses._id": addressId,
  });
  if (!isAddressIdExist) {
    return res.status(404).json({
      message: "Address not Found",
    });
  }

  // Removes the specific address from the user's addresses array
  const user = await userModel.findOneAndUpdate(
    { _id: id },
    {
      $pull: {
        addresses: { _id: addressId },
      },
    },
    {
      new: true,
    }
  );

  if (!user) {
    return res.status(404).json({
      message: "User not Found",
    });
  }

  // Verifies that the address has been successfully deleted
  const addressExist = user.addresses.some(
    (addr) => addr._id.toString() === addressId
  );
  if (addressExist) {
    return res.status(500).json({
      message: "Failed to Delete Addresss",
    });
  }

  //Retrun Response
  return res.status(200).json({
    message: "Address deleted Successfully",
    addresses: user.addresses,
  });
};

module.exports = {
  registerController,
  loginController,
  getUserController,
  logOutController,
  getUserAddresses,
  addUserAddress,
  deleteuserAddress,
};
