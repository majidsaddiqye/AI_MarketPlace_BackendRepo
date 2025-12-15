const { body, validationResult } = require("express-validator");

// create respondWithValidationError
const respondWithValidationError = (req, res, next) => {
  const error = validationResult(req);

  if (!error.isEmpty()) {
    return res.status(400).json({ errors: error.array() });
  }

  next();
};

// Create registerUserValidation
const registerUserValidation = [
  body("username")
    .isString()
    .withMessage("Username must be provided in the String")
    .isLength({ min: 3 })
    .withMessage("Username must be at least 3 characters long"),

  body("email").isEmail().withMessage("Invalid email address"),

  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),

  body("fullName.firstName")
    .isString()
    .withMessage("firstName must be a String")
    .notEmpty()
    .withMessage("firstName must be required"),

  body("fullName.lastName")
    .isString()
    .withMessage("lastName must be a String")
    .notEmpty()
    .withMessage("lastName must be required"),

  respondWithValidationError,
];

//Exports Validations
module.exports = {
  registerUserValidation,
};
