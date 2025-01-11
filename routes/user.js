const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();
const cookieParser = require('cookie-parser');
const User = require('../models/user.model');
const Event = require('../models/events.model');
const isUser = require('../middleware/isUser');


router.use(cookieParser());


// Register 
router.post('/register', async (req, res) => {
  const userData = req.body; // Store all incoming data in one object

  try {
    console.log('Received Data:', userData);

    const namePart = userData.name && userData.name.slice(0, 2).toUpperCase();
    const phonePart = userData.phone && userData.phone.slice(-3);

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
    if (await User.findOne({ phone: userData.phone })) {
      return res.status(400).json({ message: 'This phone number already exists' });
    }

    userData.password = await bcrypt.hash(userData.password, 10); // Hash password
    const newUser = new User(userData);
    await newUser.save();


    delete userData.password;  
    delete userData.createdAt; 
    delete userData.updatedAt;
    delete userData.__v;
    delete userData.referral


    // Generate JWT token
    const token = jwt.sign(
      { id: newUser._id },
      process.env.JWT_SECRET,
      { expiresIn: '2h' } // Token validity
    );

    // Save token in cookies (with HttpOnly flag for security)
    res.cookie('token', token, {
      httpOnly: true,   // Prevent access to the cookie via JavaScript
      secure: process.env.NODE_ENV === 'production', // Only set cookie over HTTPS in production
      maxAge: 7200000,  // 2 hours (in milliseconds)
    });

    return res.status(201).json({ message: 'User created successfully', token:token , user: { userData } });

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
        { expiresIn: '1h' } // Token validity
      );

      console.log("token generated", token)
  
      // Save token in cookies (with HttpOnly flag for security)
      res.cookie('token', token, {
        httpOnly: true,   // Prevent access to the cookie via JavaScript
        secure: process.env.NODE_ENV === 'production', // Only set cookie over HTTPS in production
        maxAge: 7200000,  // 1 hour (in milliseconds)
      });

 console.log("token saved to cookies")

      res.cookie('isLogedIn', true)
  
      console.log("saved cookies : ", req.cookies)
      // Send response
      res.status(200).json({
        message: 'Login successful',
        user: { userData },
        token : token
      });

      console.log("logged in successfully", userData)
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  


  // Logout

  router.post('/logout',isUser, async (req, res) => {
    const {userID} = req.body

    try {

      res.clearCookie('token', {
        httpOnly: true,   // Ensures the cookie cannot be accessed by JavaScript
        secure: process.env.NODE_ENV === 'production', // Only set cookie over HTTPS in production
        sameSite: 'strict', // Ensures the cookie is not sent with cross-site requests
      });
      res.cookie('isLogedIn', false)
  
      
      res.status(200).json({ message: 'Logout successful' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });



// Team Registrations - Create Team 

router.post('/maketeam',isUser , async (req, res) => {

  // console.log("Request Body:", req.body);
  const { userId, EventDetials } = req.body;
  // console.log("Event Details:", EventDetials);

  try {   

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
let event = await Event.findOne({ eventName: EventDetials.eventName });


if (!event) {
  event = new Event({ eventName: EventDetials.eventName, Teams: [] });
  await event.save();
}
    
    // console.log('event foudn', event)

    const teamPart = EventDetials.teamName && EventDetials.teamName.slice(0, 2).toUpperCase();

    const randomLetters = String.fromCharCode(
      65 + Math.floor(Math.random() * 26),
      65 + Math.floor(Math.random() * 26)
    );
    const randomNumbers = Math.floor(10 + Math.random() * 90); // Ensures 2 digits


    // Check if the teamName already exists in the event
    const teamExists = Event.Teams.some((team) => team.teamName === EventDetials.teamName);
    if (teamExists) {
      return res.status(400).json({ message: 'Team name already exists in this event.' });
    }

    // console.log('eventDetials', EventDetials)
    
    const customID = `C25${teamPart}${randomLetters}${randomNumbers}`;
// console.log('customId genetrated', customID)

    // console.log('before theams push',event)

    event.Teams.push({
      teamName: EventDetials.teamName,
      teamId: customID,
      members: [
        {
          name: user.name,
          email: user.email,
          role: "Admin",
          memberId: user._id
        }
      ]   

    });

    // console.log('After theams push', event)


    
    await event.save();

console.log('Event saved successfully')

    user.events.push({
      eventName: EventDetials.eventName,
      teamName: EventDetials.teamName,
      teamId: customID,
      role:"Admin"
    })
    // console.log('after user push', user)

    await user.save();

console.log(event, user)
    res.status(200).json({ message: 'Team created successfully' });




  } catch (error) {
    res.status(500).json({ error: error.message });
  }
})

// Join Team 

router.post('/jointeam',isUser,  async (req, res) => {
  const {userId , eventName, teamId} = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const event = await Event.findOne({ eventName });
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    const team = event.Teams.find((team) => team.teamId === teamId);

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    const userExistsInTeam = team.members.some((member) => member.memberId.toString() === user._id.toString());

if (userExistsInTeam) {
  return res.status(400).json({ message: 'User is already a member of this team.' });
}


    team.members.push({ name: user.name, email: user.email, role: "Member", memberId: user._id });

    // await team.save();
    await event.save();

    user.events.push({ eventName, teamName: team.teamName, teamId, role: "Member" });
    await user.save();

    res.status(200).json({ message: 'Joined team successfully' });


  } catch (error) {
    res.send(error.message)
  }


})




  module.exports = router;