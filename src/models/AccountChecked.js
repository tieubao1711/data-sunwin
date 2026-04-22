const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  accountId: { type: String, unique: true },
  username: String,
  password: String,
  displayName: String,
  phone: String,
  balance: Number,
  status: String,
  message: String
}, { timestamps: true });

module.exports = mongoose.model('AccountChecked', schema);