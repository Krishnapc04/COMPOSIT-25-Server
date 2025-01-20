const mongoose = require('mongoose');

// Define the User schema
const UserSchema = new mongoose.Schema(
  {
    _id: {
         type: String, required: true 
        },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true, 
      minlength: 6,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      minlength: 10,
    },
    gender: {
      type: String,
      required: true,
    },
    collegeName: {
      type: String,
      required: true,
      trim: true,
    },
    collegeId: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    referral: {
      type: String, // Referring student ambassador ID
      trim: true,
    },
    department: {
      type: String,
      trim: true,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    certificate: {
      type: Boolean,
      default: false
    },
    present : {
      type: Boolean,
      default: false
    }, 
    Hall : {
      type: String,
      trim: true,
      default: "None"
    },
    Sa :{
      type: Boolean,
      trim: true,
      default: false
    },
    SaId :{ 
      type: String,
      trim: true
    },
    SaMember : [
      {
        MemberId :{
          type: String, 
          trim: true
        },
        MemberName :{
          type: String,
          trim: true
        }
      }
    ],
    events : [
      {
        eventName :{
          type: String, 
          trim: true,
        },
        teamName : {
          type: String, 
          trim: true,
        },
        teamId: { 
          type: String, 
          required: true 
        },
        role: {
          type: String,
          trim: true
        },
        registeredAt: {
          type: Date,
          default: Date.now,
        },
      }
    ]
  },
  { timestamps: true } // Automatically add createdAt and updatedAt fields
);

// Export the model
module.exports = mongoose.model('User', UserSchema);
