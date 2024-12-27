const mongoose = require('mongoose');

// Define Team schema for teams inside the Event schema
const TeamSchema = new mongoose.Schema({
  teamName: {
    type: String,
    required: true,
    unique: true, // Ensure each team has a unique name within the event
  },
  teamId: {
    type: String,
    required: true,
  },
  members: [
    {
      name: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
      },
      role: {
        type: String,
        required: true,
      },
      memberId: {
        type: String,
        required: true,
      },
    },
  ],
});

// Define Event schema which holds teams as subdocuments
const EventSchema = new mongoose.Schema({
  eventName: {
    type: String,
    required: true,
    unique: true, // Ensure each event has a unique name
  },
  Teams: [TeamSchema], // Array of teams (subcollection)
});

// Event model
module.exports = mongoose.model('Event', EventSchema);
