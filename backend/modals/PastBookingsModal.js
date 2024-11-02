const mongoose = require('mongoose');

const pastBookingSchema = new mongoose.Schema({
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
  seatId: {
    type: Number,
    required: true,
  },
  attended: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model('PastBookings', pastBookingSchema);
