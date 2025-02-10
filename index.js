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

const allowedOrigins = ['https://ca.composit.in', 'https://composit.in','http://localhost:5173','https://admin.composit.in','http://localhost:3000',"https://composit-25.vercel.app"];

app.use(cors({
    origin: (origin, callback) => {
        if (allowedOrigins.includes(origin) || !origin) {
            callback(null, origin); // Allow the request
        } else {
            callback(new Error('Not allowed by CORS')); 
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Specify allowed methods
    credentials: true, // Allow cookies and credentials
}));

// Handle preflight requests
app.options('*', cors()); 


// Connect to MongoDB
connectDB();

 
app.use('/api/user',require('./routes/user'));
app.use('/api/admin',require('./routes/admin'));


// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });