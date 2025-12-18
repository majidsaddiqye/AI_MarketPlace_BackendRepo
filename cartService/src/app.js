const express = require('express');
const cartRoutes = require('./routes/cart.route');

const app = express();
app.use(express.json());

// Routes
app.use('/api/cart', cartRoutes);


module.exports = app;