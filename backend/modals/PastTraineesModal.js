const mongoose = require('mongoose');

const pastTraineesSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  nicNo: {
    type: String,
    required: true,
  },
  contactNo: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model('PastTrainees', pastTraineesSchema);
