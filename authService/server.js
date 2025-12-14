require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/db/db')






// Execute ConnectDB Fnc
connectDB()

// Server Listen on 3000
app.listen(3000, () => {
    console.log(`Server is running on port 3000`);
});