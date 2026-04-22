const mongoose = require('mongoose');

const schema = new mongoose.Schema(
  {
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      required: true,
      unique: true
    },
    username: String,
    password: String,
    phone: String,
    balance: Number,
    status: String,
    message: String
  },
  { timestamps: true }
);

module.exports = mongoose.model('AccountChecked', schema);