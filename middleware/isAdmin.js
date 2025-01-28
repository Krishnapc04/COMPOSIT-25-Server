const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config(); // Load environment variables

// Admin authorization middleware
const isAdmin = (req, res, next) => {

  const token = req.body.token;

  // console.log("is admin runned")
  // Get the token from cookies
  // const token = req.headers.authorization?.split(' ')[1]; // Extract the token from the Authorization header
// console.log("baceknd token recived",token)

  if (!token) {
    return res.status(403).json({ message: 'Access denied. No token provided.' });
  }

  try {
    // Verify the JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET); 

    // Check if the email matches the admin email
    const adminEmail = process.env.ADMIN_EMAIL; // Store admin email in .env file
    if (decoded.email !== adminEmail) {
      return res.status(403).json({ message: 'Access denied. You are not an admin.' });
    }

    // Attach user information to the request object for further use
    req.user = decoded;
    next(); // Proceed to the next middleware or route handler
  } catch (error) { 
    return res.status(400).json({ message: 'Invalid or expired token.' });
  }
};


module.exports = isAdmin;
