const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./db');
const cookieParser = require('cookie-parser');



dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;


//MIddleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // Parse cookies

app.use(cors());

// Connect to MongoDB
connectDB();

 
app.use('/api/user',require('./routes/user'));
app.use('/api/admin',require('./routes/admin'));


// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });