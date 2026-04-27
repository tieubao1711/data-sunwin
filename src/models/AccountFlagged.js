const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  accountId: { type: String, index: true },
  username: { type: String, required: true, index: true },
  password: String,

  displayName: String,
  phone: String,

  balance: { type: Number, default: 0 },
  safe: { type: Number, default: 0 },

  depositCount: { type: Number, default: 0 },
  withdrawCount: { type: Number, default: 0 },

  totalDeposit: { type: Number, default: 0 },
  totalWithdraw: { type: Number, default: 0 },

  latestDepositAt: String,
  latestWithdrawAt: String,

  deposits: { type: Array, default: [] },
  withdraws: { type: Array, default: [] },

  reason: { type: String, default: '' },
  source: { type: String, default: 'local-tool' }
}, { timestamps: true });

schema.index({ username: 1 }, { unique: true });

module.exports = mongoose.model('AccountFlagged', schema);