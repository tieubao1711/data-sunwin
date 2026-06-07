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
schema.index({ fileName: 1, createdAt: -1 });
schema.index({ fileName: 1, username: 1 });
schema.index({ createdAt: -1 });
schema.index({ updatedAt: -1 });
schema.index({ username: 1 });

module.exports = mongoose.model('Account', schema);
