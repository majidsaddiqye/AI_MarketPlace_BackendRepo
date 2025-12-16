const productModel = require('../models/product.model')
const {uploadImage}= require('../services/imageKit.service')


// createProduct Controller
async function createProduct(req,res){
try {
    const {title,description,priceAmount,priceCurrency = 'PKR'} = req.body

    const seller = req.user.id

    const price ={
        amount : Number(priceAmount),
        currency:priceCurrency
    }

    // Upload images if any
    const images = []
    if (req.files && req.files.length > 0) {
        const files = await Promise.all((req.files || []).map(file => uploadImage({buffer:file.buffer})))
        images.push(...files)
    }

    const product = await productModel.create({title,description,price,seller,images})
    
    return res.status(201).json({
        message: 'Product created successfully',
        product
    })
} catch (error) {
    console.error('Error creating product:', error)
    return res.status(500).json({
        message: 'Internal server error',
        error: error.message
    })
}
}


module.exports = {createProduct}