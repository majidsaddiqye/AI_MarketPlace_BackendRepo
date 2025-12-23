require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/db/db')
const { connect } = require('./src/broker/broker');





// Execute ConnectDB Fnc
connectDB()
connect()

// Server Listen on 3000
app.listen(3000, () => {
    console.log(`Server is running on port 3000`);
});