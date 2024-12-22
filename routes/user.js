const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();
const cookieParser = require('cookie-parser');
const User = require('../models/user.model');


router.use(cookieParser());


// Register 

router.post('/register', async (req, res) => {
    try {
      const userData = req.body; // Store all incoming data in one object
      const namePart = userData.name.slice(0, 2).toUpperCase();
      const phonePart = userData.phone.slice(-3);
      const randomLetters = String.fromCharCode(
        65 + Math.floor(Math.random() * 26),
        65 + Math.floor(Math.random() * 26)
      );
      const randomNumbers = Math.floor(10 + Math.random() * 90); // Ensures 2 digits
      const customID = `C25${namePart}${phonePart}${randomLetters}${randomNumbers}`;
      
      userData._id = customID;

        
      if (await User.findOne({ email: userData.email })) {
        return res.status(400).json({ message: 'User with this email already exists' });
      }
      if (await User.findOne({phone: userData.phone})) {
        return res.status(400).json({ message: 'this phone number already exists' });
      }
  
      userData.password = await bcrypt.hash(userData.password, 10); // Hash password
      const newUser = new User(userData);
  
      res.status(201).json(await newUser.save());
      console.log("new user formed")
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });



  // Login

  router.post('/login', async (req, res) => {
    const { email, password } = req.body;
  
    try {
      // Find user by email
      const user = await User.findOne({ email });
      if (!user) return res.status(404).json({ message: 'User not found' });
  
      // Compare the password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) return res.status(400).json({ message: 'Invalid email or password' });
  
      const userData = user.toObject();
      delete userData.password;  
      delete userData.createdAt; 
      delete userData.updatedAt;
      delete userData.__v;
      delete userData.referral


      // Generate JWT token
      const token = jwt.sign(
        { id: user._id },  
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
        message: 'Login successful',
        user: { userData },
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
  
      
      res.status(200).json({ message: 'Logout successful' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  



  module.exports = router;