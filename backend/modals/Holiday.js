const mongoose = require("mongoose");

const holidaySchema = new mongoose.Schema({
 date: {
    type: Date,
    required: true,
    unique: true, 
  },
  message: {
    type: String,
    required: true,
    trim: true, 
  },
 
});

module.exports = mongoose.model("Holiday", holidaySchema);
