const express = require ('express')
const cookieParser = require('cookie-parser')
const productRoutes = require('../src/routes/product.route')

const app = express()

app.use(express.json())
app.use(cookieParser())

//Routes
app.use('/api/product',productRoutes)


module.exports = app