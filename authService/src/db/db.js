const mongoose = require('mongoose');

// Create ConnectDB Function
async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
}

//Exports ConnectDB Function
module.exports = connectDB;