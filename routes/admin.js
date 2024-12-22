const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();
const cookieParser = require('cookie-parser');
const User = require('../models/user.model');
const isAdmin = require('../middleware/isAdmin'); 

router.use(cookieParser());



  // Login

  router.post('/login', async (req, res) => {
    const { email, password } = req.body;
  
    try {
  
      if (email !== process.env.ADMIN_EMAIL) {
        return res.status(400).json({ message: 'Invalid email ' });
      }


      // Compare the password
      const isPasswordValid = await bcrypt.compare(password, process.env.ADMIN_PASSWORD);
      if (password !== process.env.ADMIN_PASSWORD) {
        return res.status(400).json({ message: 'Invalid password' });
      }
     

      // Generate JWT token
      const token = jwt.sign(
        { email: process.env.ADMIN_EMAIL },  
        process.env.JWT_SECRET, 
        { expiresIn: '2h' } // Token validity
      );
  
      // Save token in cookies (with HttpOnly flag for security)
      res.cookie('token', token, {
        httpOnly: true,   // Prevent access to the cookie via JavaScript
        secure: process.env.NODE_ENV === 'production', // Only set cookie over HTTPS in production
        maxAge: 7200000,  // 1 hour (in milliseconds)
      });
  
      // Send response
      res.status(200).json({
        message: 'Admin Login successful',
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  


  // Logout

  router.post('/logout', (req, res) => {
    try {

      res.clearCookie('token', {
        httpOnly: true,   // Ensures the cookie cannot be accessed by JavaScript
        secure: process.env.NODE_ENV === 'production', // Only set cookie over HTTPS in production
        sameSite: 'strict', // Ensures the cookie is not sent with cross-site requests
      });
  
      
      res.status(200).json({ message: 'AdminLogout successful' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  
  // All Users



// Route to get all users (accessible by admin only)
router.get('/allusers', isAdmin, async (req, res) => {
  try {
    // Fetch all users except the admin (optional)
    const users = await User.find({}, '-password -updatedAt -__v'); // Exclude password, createdAt, updatedAt fields

    res.status(200).json({ users}); // Send the list of users
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});






  module.exports = router;