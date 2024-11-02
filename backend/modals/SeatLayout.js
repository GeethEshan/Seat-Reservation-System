// models/SeatLayout.js
const mongoose = require('mongoose');

const seatLayoutSchema = new mongoose.Schema({
  layoutName: { type: String, required: true },
  seatPositions: [
    {
      seatId: { type: Number, required: true },
      row: { type: Number, required: true },
      col: { type: Number, required: true },
    },
  ],
});

const SeatLayout = mongoose.model('SeatLayout', seatLayoutSchema);

module.exports = SeatLayout;
