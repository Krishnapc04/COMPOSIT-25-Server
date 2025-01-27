const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();
const cookieParser = require('cookie-parser');
const User = require('../models/user.model');
const Event = require('../models/events.model');
const isUser = require('../middleware/isUser');

const { PDFDocument, rgb } = require("pdf-lib");
const fontkit = require('@pdf-lib/fontkit'); // Import fontkit
const fs = require("fs");
const path = require("path");
const isSa = require('../middleware/isSa');
const nodemailer = require("nodemailer");

router.use(cookieParser());



// Email sending function
const sendWelcomeEmail = async (userEmail, SaId ,  userName) => {
  try {
    // Configure transporter with your email service credentials
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com", // Gmail's SMTP server
      port: 587,
      secure: false, // Use TLS
      auth: {
        user: process.env.EMAIL_USER, // Your email address 
        pass: process.env.EMAIL_PASS, // Your email password or app password
      },
    });

    // Email content
    const mailOptions = {
      from:  process.env.EMAIL_USER, // Sender address
      to: userEmail, // Recipient email
      subject: "Welcome to COMPOSIT!", // Email subject
      html: `
         <p>Dear ${userName},</p>
    <p>Welcome to the COMPOSIT family! We are thrilled to have you as a part of our team.</p>
    <p>Your Student ambassador id is : <b> ${SaId} </b> .</p>
    <p> This id can be used as refferal while registering a student from your college.</p>
    <p> You can find this id in your profile on CA portal.</p>
    <p>Feel free to reach out to us for any queries or assistance.</p>
    <br>
    <p>Best regards,</p>
    <div style="display:flex; justify-content:space-between;">
    <img src="cid:logo" alt="COMPOSIT Logo" style="width:150px; height:auto;"/>
    <div>
    <p><strong>COMPOSIT Team</strong></p>
    <p>IIT Kharagpur</p>
    <p> +91 8767650199</p>
    </div>
    <br>
    </div>
      `,
      attachments: [
        {
          filename: 'logo.png', // Replace with your file name
          path: './routes/logo.png', // Path to your image
          cid: 'logo', // Same as the `cid` in the `<img>` tag
        },
      ], // Email body in HTML format
    };

    // Send email
    await transporter.sendMail(mailOptions);
    console.log("Welcome email sent to", userEmail);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};




// Register 
router.post('/register', async (req, res) => {
  const userData = req.body; // Store all incoming data in one object

  try {
    console.log('Received Data:', userData);

    const namePart = userData.name && userData.name.slice(0, 3).toUpperCase();
    const phonePart = userData.phone && userData.phone.slice(-2);

    const randomLetters = String.fromCharCode(
      65 + Math.floor(Math.random() * 26),
      65 + Math.floor(Math.random() * 26)
    );
    const randomNumbers = Math.floor(10 + Math.random() * 90); // Ensures 2 digits
    const customID = `C25${namePart}${phonePart}${randomNumbers}`;

    userData._id = customID;

    if (await User.findOne({ email: userData.email })) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }
    if (await User.findOne({ phone: userData.phone })) {
      return res.status(400).json({ message: 'This phone number already exists' });
    }

    const referal = userData.referral;

    if (referal) {
      const SA = await User.findOne({ SaId : referal });
      console.log(SA)
      if (SA) {
        SA.SaMember.push({ MemberId: customID, MemberName: userData.name, MemberPhone: userData.phone, MemberEmail: userData.email, RegisteredDate : new Date() });
        await SA.save();
        console.log("SA updated",SA)
      }
    }

    userData.Hall = "None"
 

    userData.password = await bcrypt.hash(userData.password, 10); // Hash password
    const newUser = new User(userData);
    await newUser.save();


    await sendWelcomeEmail(userData.email, userData.name);


    delete userData.password;  
    delete userData.createdAt; 
    delete userData.updatedAt;
    delete userData.__v;
    delete userData.referral


    // Generate JWT token
    const token = jwt.sign(
      { id: newUser._id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' } // Token validity
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



// SA Register 
router.post('/SaRegister', async (req, res) => {
  const userData = req.body; // Store all incoming data in one object

  try {
    console.log('Received Data:', userData);

    const namePart = userData.name && userData.name.slice(0, 3).toUpperCase();
    const namePart2 = userData.name && userData.name.slice(0, 2).toUpperCase();
    const phonePart = userData.phone && userData.phone.slice(-2);


     const abbrivation = userData.abbrivation && userData.abbrivation.slice(0, 2).toUpperCase();
     console.log(abbrivation)
    const randomNumbers = Math.floor(10 + Math.random() * 90); // Ensures 2 digits

    const allSa = await User.find({Sa : true})

    console.log(allSa.length, "all sa found")
    const totalSa = allSa.length
 
    const customID = `C25${namePart}${phonePart}${randomNumbers}`;

    const SAId = `25SA${abbrivation}${namePart2}${totalSa+1}`;
    userData.SaId = SAId
    userData.Sa = true

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

    await sendWelcomeEmail(userData.email,userData.SaId,  userData.name);


    // Generate JWT token
    const token = jwt.sign(
      { id: userData.SaId, role: "Student Ambassador" },
      process.env.JWT_SECRET,
    );

    // Save token in cookies (with HttpOnly flag for security)
    res.cookie('token', token, {
      httpOnly: true,   // Prevent access to the cookie via JavaScript
      secure: process.env.NODE_ENV === 'production', // Only set cookie over HTTPS in production
    });

    return res.status(201).json({ message: 'User created successfully', token:token , user: { userData } });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Sa Members
router.post('/getsamembers',isSa ,  async (req, res) => {
  const { SaId } = req.body;
  try {
    const SA = await User.findOne({ SaId : SaId });
    const users = await User.find({referral : SaId })
    if (users) {
      res.status(200).json({ message: 'SA Members found', members: users });
    } else {
      res.status(404).json({ message: 'SA not found' });
    }
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

    
let token; 

      if (user.Sa) {
         token = jwt.sign(
          { id: user.SaId, role: "Student Ambassador" },  
          process.env.JWT_SECRET, 
          { expiresIn: '30d' } // Token validity
        );
      }else{
        token = jwt.sign(
          { id: user._id },  
          process.env.JWT_SECRET, 
          { expiresIn: '30d' } // Token validity
        );
      }


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

  router.post('/logout' , async (req, res) => {
  
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


router.post('/generateCertificate', async (req,res)=>{

  try {
    const { userId } = req.body; // Extract name from the request body
    const user = await User.findById(userId)

    // if(!user.certificate){
    //   return res.status(400).json({ message: 'User does not have a right to get certificate' })
    // }

    const name = user.name
    const templatePath = path.join(__dirname, 'Certificate.pdf');
    const fontPath = path.join(__dirname, 'fancytext.ttf'); // Path to your custom font


    if (!fs.existsSync(templatePath)) {
      return res.status(404).json({ message: 'Certificate template not found' });
    }

    if (!fs.existsSync(fontPath)) {
      return res.status(404).json({ message: 'Custom font file not found' });
    }

    // Load the existing PDF template
    const existingPdfBytes = fs.readFileSync(templatePath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

       // Register fontkit
       pdfDoc.registerFontkit(fontkit);
 
        // Load the custom font
        const customFontBytes = fs.readFileSync(fontPath);
        console.log("Font file buffer length:", customFontBytes.length); // Log the buffer length

        const customFont = await pdfDoc.embedFont(customFontBytes);
    

    // Get the first page of the PDF 
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];

    // Set font size and position for the name
    const { width, height } = firstPage.getSize();
    firstPage.drawText(name, {
      x: width / 2 - 100, // Center horizontally (adjust as needed)
      y: height / 2, // Adjust vertical position as needed
      size: 50, // Font size
      font : customFont,
      color: rgb(0, 0, 0), // Black color
    });

    // Save the modified PDF as bytes
    const pdfBytes = await pdfDoc.save();

    // Send the PDF as a downloadable response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="Certificate.pdf"');
    res.end(Buffer.from(pdfBytes));
  } catch (error) {
    console.error('Error generating certificate:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }


})

// router.post('/generateCertificate', (req, res) => {
//   const {userId} = req.body
//   try {
//     const filePath = path.join(__dirname, 'Certificate.pdf'); // Adjust path if needed

//     if (!fs.existsSync(filePath)) {
//       return res.status(404).json({ message: 'Certificate template not found' });
//     }

//     const fileStream = fs.createReadStream(filePath);
//     res.setHeader('Content-Type', 'application/pdf');
//     res.setHeader('Content-Disposition', 'attachment; filename="Certificate.pdf"');
//     fileStream.pipe(res);
//   } catch (error) {
//     console.error('Error serving certificate:', error);
//     res.status(500).json({ message: 'Internal Server Error' });
//   }
// });

  module.exports = router;