const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");

async function authMiddleware(req, res, next) {
  try {
    const { token } = req.cookies;

    // Check Token
    if (!token) {
      return res
        .status(401)
        .send({ message: "Access denied. No token provided." });
    }

    // Verify Token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = decoded;

      req.user = user;

      next();
    } catch (error) {
      return res.status(401).send({ message: "Invalid token." });
    }
  } catch (error) {
    return res.status(401).send({ error });
  }
}

module.exports = { authMiddleware };
