const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  fileName: String,
  username: String,
  password: String
}, { timestamps: true });

module.exports = mongoose.model('Account', schema);