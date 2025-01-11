const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();
const cookieParser = require('cookie-parser');
const User = require('../models/user.model');
const isAdmin = require('../middleware/isAdmin'); 
const Event = require('../models/events.model');

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
        secure: process.env.NODE_ENV === 'production', // Only set cookie over HTTPS in production
        maxAge: 7200000,  // 1 hour (in milliseconds)
      });
  
      // Send response
      res.status(200).json({
        message: 'Admin Login successful',
        token : token
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  


  // Logout

  router.post('/logout',isAdmin, (req, res) => {
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
router.post('/allusers', isAdmin, async (req, res) => {
  try {
    // Fetch all users except the admin (optional)
    const users = await User.find({}, '-password -updatedAt -__v'); // Exclude password, createdAt, updatedAt fields


    res.status(200).json({ users}); // Send the list of users
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Get event info 
router.post('/eventinfo', isAdmin, async (req, res) => {
  const { eventName } = req.body;
  try {

    const event = await Event.findOne({ eventName });// Find the event by name

    if (!event) { 
      return res.status(404).json({ message: 'Event not found' });
      }
      res.status(200).json({ event });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
})

// Mark Presenty 
router.post('/markpresent', isAdmin, async (req, res) => {
  const {userId} = req.body;

  try {
    const user = await User.findByIdAndUpdate(userId, { $set: { present: true } }, { new: true });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'User marked as present', user });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }

})

// Delete User
router.delete('/deleteuser', isAdmin, async (req, res) => {
  const { userId } = req.body;

  try {
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
      }
      res.status(200).json({ message: 'User deleted', user });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// generate certificate
router.post('/generatecertificate', isAdmin, async (req, res) => {
  const { userId } = req.body;

  try {
    const user = await User.findByIdAndUpdate(userId, { $set: { certificate: true } }, { new: true });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
      }
      const certificate = await generateCertificate(user);
      res.status(200).json({ message: 'Certificate generated', certificate });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Allote Hall 
router.post('/allotHall', isAdmin, async (req, res) => {
  const { userId, HallName} = req.body;

  try {
    const user = await User.findByIdAndUpdate(userId, { $set: { Hall: HallName } }, { new: true });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
      }
      res.status(200).json({ message: 'Hall Alloted', user });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
})








  module.exports = router;