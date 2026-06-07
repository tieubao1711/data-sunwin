const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  accountId: { type: String, unique: true },
  username: String,
  password: String,
  displayName: String,
  phone: String,
  balance: Number,
  safe: Number,
  status: String,
  message: String
}, { timestamps: true });

schema.index({ status: 1, updatedAt: -1 });
schema.index({ balance: -1 });
schema.index({ updatedAt: -1 });

module.exports = mongoose.model('AccountChecked', schema);
