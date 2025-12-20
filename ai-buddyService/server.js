require('dotenv').config()
const { connect } = require('mongoose')
const app = require('./src/app')
const connectDB = require('./src/db/db')



connectDB()

app.listen(3005,()=>{
    console.log("Server is Listening on port 3005")
})