const mongoose = require('mongoose');

const TemporarilyUnavailableSeatSchema = new mongoose.Schema({
  date: {
    type: String,
    required: true,
  },
  seatId: {
    type: Number,
    required: true,
  },
  layoutName: {
    type: String,
    required: true,
  },
});

const TemporarilyUnavailableSeat = mongoose.model('TemporarilyUnavailableSeat', TemporarilyUnavailableSeatSchema);

module.exports = TemporarilyUnavailableSeat;
