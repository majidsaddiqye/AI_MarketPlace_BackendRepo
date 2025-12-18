const express = require('express');
const { createCart } = require('../controllers/cart.controller');
const { createAuthMiddleware } = require('../middlewares/auth.middleware');

const router = express.Router();


router.post('/items', createAuthMiddleware(["user"]), createCart);


module.exports = router;