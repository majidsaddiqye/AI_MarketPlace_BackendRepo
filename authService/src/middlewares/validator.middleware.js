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

// Create loginUserValidation
const loginUserValidation = [
  body("email").optional().isEmail().withMessage("Invalid Email Address"),

  body("username")
    .optional()
    .isString()
    .withMessage("Username must be provided in the String"),

  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be atleast 6 character Long"),

  (req, res, next) => {
    if (!req.body.email && !req.body.username) {
      return res
        .status(400)
        .json({ errors: "Enter Email or userName is Required" });
    }
    respondWithValidationError(req, res, next);
  },
];

//create addUserAdressValidation
const addUserAdressValidation = [
  body("street").isString().notEmpty().withMessage("Street is required"),

  body("city").isString().notEmpty().withMessage("City is required"),

  body("state").isString().notEmpty().withMessage("State is required"),

  body("zip").isString().notEmpty().withMessage("Zip is required"),

  body("country").isString().notEmpty().withMessage("Country is required"),

  body("isDefault")
    .optional()
    .isBoolean()
    .withMessage("isDefault must be boolean"),
];

//Exports Validations
module.exports = {
  registerUserValidation,
  loginUserValidation,
  addUserAdressValidation,
};
