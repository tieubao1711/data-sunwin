const mongoose = require('mongoose');

const schema = new mongoose.Schema(
  {
    fileName: String,
    username: String,
    password: String
  },
  { timestamps: true }
);

// unique theo combo username + password
schema.index({ username: 1, password: 1 }, { unique: true });

module.exports = mongoose.model('Account', schema);