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
const sendCompositRegistrationMail = async (userEmail, UserId ,  userName) => {
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
    <p>Your COMPOSIT id is : <b> ${UserId} </b> .</p>
    <p> This id will be used to register the event.</p>
    <p> You can find this id in your profile page on Website.</p>
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


const PaymentMail = async (name, UId ,  days, amount, screenshot) => {
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
      to: "krishnachaudhari2309@gmail.com", // Recipient email
      subject: "New Payment Done", // Email subject
      html: `
         <p>Dear Admin,</p>
    <p>${name} has paid Rs.${amount} for ${days} days.</p>
    <p>His COMPOSIT id is : <b> ${UId} </b> .</p>
    <p>Kindly check the payemt and respond to it </p>
    <p> You can check the payment screenshot here :<b> <a href="${screenshot}" target="_blank">Screenshot</a> </b> </p>
    <img src="${screenshot}" alt="Payment Screenshot" style="width:200px; height:auto;"/>
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
        }
      ], // Email body in HTML format
    };

    // Send email
    await transporter.sendMail(mailOptions);
    console.log("Welcome email sent");
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
      return res.status(400).json({ message: 'User with this email already exists' });
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


    await sendCompositRegistrationMail(userData.email,userData._id, userData.name);


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

    return res.status(201).json({ message: 'User created successfully', token:token , user:userData });

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

//Update profile

router.post('/updateprofile',isUser,  async (req, res) => {
  const { userId, name, email, phone, city, state } = req.body;

  try {
    // Find the user by ID
    let user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check for email uniqueness
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      user.email = email;
    }

    // Check for phone uniqueness
    if (phone && phone !== user.phone) {
      const phoneExists = await User.findOne({ phone });
      if (phoneExists) {
        return res.status(400).json({ message: 'Phone number already in use' });
      }
      user.phone = phone;
    }

    // Update other details
    if (name) user.name = name;
    // if (hall) user.Hall = hall;
    if (city) user.city = city;
    if (state) user.state = state;

    // Hash password if updated
    // if (password) {
    //   user.password = await bcrypt.hash(password, 10);
    // }

    await user.save();

    return res.status(200).json({ message: 'Profile updated successfully', user });

  } catch (error) {
    return res.status(500).json({ error: error.message });
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
          { id: user.SaId,regId: user._id, role: "Student Ambassador" },  
          process.env.JWT_SECRET, 
          // { expiresIn: '30d' } // Token validity
        );
      }else{
        token = jwt.sign(
          { id: user._id },  
          process.env.JWT_SECRET, 
          // { expiresIn: '30d' } // Token validity
        );
      }


      console.log("token generated", token)
  
      // Save token in cookies (with HttpOnly flag for security)
      res.cookie('token', token, {
        httpOnly: true,   // Prevent access to the cookie via JavaScript
        secure: process.env.NODE_ENV === 'production', // Only set cookie over HTTPS in production
        // maxAge: 7200000,  // 1 hour (in milliseconds)
      });

 console.log("token saved to cookies")

      res.cookie('isLogedIn', true)
  
      console.log("saved cookies : ", req.cookies)
      // Send response
      res.status(200).json({
        user: userData,
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
  const { userId, eventName, teamName } = req.body;
  // console.log("Event Details:", EventDetials);
  const result = await Event.aggregate([
    {
        $project: { totalTeams: { $size: "$Teams" } }
    },
    {
        $group: { _id: null, totalTeamsRegistered: { $sum: "$totalTeams" } }
    }
]);

const totalTeams = result.length > 0 ? result[0].totalTeamsRegistered : 0;

  try {   

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
let event = await Event.findOne({ eventName: eventName });


if (!event) {
  event = new Event({ eventName: eventName, Teams: [] });
  await event.save();
}
    
    // console.log('event foudn', event)

    const teamPart = teamName && teamName.slice(0, 2).toUpperCase();

    const randomLetters = String.fromCharCode(
      65 + Math.floor(Math.random() * 26),
      65 + Math.floor(Math.random() * 26)
    );
    const randomNumbers = Math.floor(10 + Math.random() * 90); // Ensures 2 digits


    // Check if the teamName already exists in the event
    const teamExists = event.Teams.some((team) => team.teamName === teamName);
    
    if (teamExists) {
      return res.status(400).json({ message: 'Team name already exists in this event.' });
    }

    // console.log('eventDetials', EventDetials)
    const isUserRegistered = event.Teams.some(team => 
      team.members.some(member => member.memberId.toString() === userId)
    );
    
    if (isUserRegistered) {
      return res.status(400).json({ message: 'User is already registered in this event.' });
    }

    const customID = `TC25${teamPart}${randomLetters}${randomNumbers}${totalTeams + 1}`;

    event.Teams.push({
      teamName: teamName,
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
    await event.save();

    user.events.push({
      eventName: eventName,
      teamName: teamName,
      teamId: customID,
      role:"Admin" 
    })
    // console.log('after user push', user)

    await user.save();

console.log(event, user)
    res.status(200).json({ message: 'Team created successfully',teamCode: customID, userData: user});

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
})

// Join Team 

router.post('/jointeam', isUser, async (req, res) => {
  const { userId, eventName, teamId } = req.body;

  // Define team size limits
  const teamLimits = {
    Metaclix: 1,
    Enigma: 2,
    MetaCode: 1,
    Excavate: 3,
    CaseStudy: 3,
    Technova: 3,
    Ideathon: 3,
    CadVolution: 3,
  };

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

    // Check if the team is full
    const maxMembers = teamLimits[eventName];
    if (team.members.length >= maxMembers) {
      return res.status(400).json({ message: 'Team is full' });
    }

    // Check if user is already in the team
    const userExistsInTeam = team.members.some(
      (member) => member.memberId.toString() === user._id.toString()
    );

    if (userExistsInTeam) {
      return res.status(400).json({ message: 'User is already a member of this team.' });
    }

    // Add user to the team
    team.members.push({ name: user.name, email: user.email, role: "Member", memberId: user._id });
    user.events.push({ eventName, teamName: team.teamName, teamId, role: "Member" });

    await event.save();
    await user.save();

    res.status(200).json({ message: 'Joined team successfully', userData: user });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});



router.post('/getUser', async (req, res) => {
  const { userId } = req.body;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
      }
        res.status(200).json({ user });
      } catch (error) {
        res.send(error.message);
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

router.post('/getEvents', isUser, async (req, res) => {
  const { UserId } = req.body;
  try {

    
  } catch (error) {
    res.status(500).json(error.message)
  }
})


router.post('/accommodation', async (req, res) => {
  const { UserId, name, email, phone, days, amount, screenshot, arrival, arrivalDate, comingEvent } = req.body;
  try {
    const user = await User.findById(UserId);
console.log(UserId)
console.log(user)

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
      }

user.payment=true; 
user.days = days;
user.amount = amount;
user.screenshot = screenshot
user.arrival = arrival;
user.arrivalDate=arrivalDate; 
user.comingEvent=comingEvent;

await user.save()
await PaymentMail( name, UserId,days, amount, screenshot );
console.log("Mail sent successfully")

      res.status(200).json({ user:user });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
})






  module.exports = router;