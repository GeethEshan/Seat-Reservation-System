const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  userName: {
    type: String,
    required: true,
  },
  userEmail: {
    type: String,
    required: true,
  },
  userContactNo: {
    type: String,
    required: true,
  },
  userNicNo: {
    type: String,
    required: true,
  },
  bookingDate: {
    type: Date,
    required: true,
  },
  layoutName: {  // New field for layout name
    type: String,
    required: true,
  },
  seatId: {  // Updated from seatNumber to seatId
    type: Number,  // Use String if seatId is alphanumeric
    required: true,
  },
  attended: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model('Booking', bookingSchema);
