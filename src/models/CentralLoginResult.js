const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  runKey: { type: String, required: true, index: true },

  toolName: { type: String, default: 'unknown-tool', index: true },
  machineId: { type: String, default: '', index: true },

  accountId: String,
  username: { type: String, required: true, index: true },
  password: String,

  displayName: String,
  phone: String,

  status: { type: String, index: true }, // SUCCESS | FAILED
  message: String,

  balance: { type: Number, default: 0, index: true },
  safe: { type: Number, default: 0 },

  depositCount: { type: Number, default: 0 },
  withdrawCount: { type: Number, default: 0 },
  totalDeposit: { type: Number, default: 0 },
  totalWithdraw: { type: Number, default: 0 },

  deposits: { type: Array, default: [] },
  withdraws: { type: Array, default: [] },
  rawResponse: { type: Object, default: null },

  durationMs: { type: Number, default: 0 },

  checkedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// tránh 1 run gửi trùng 1 acc nhiều lần
schema.index({ runKey: 1, username: 1 }, { unique: true });
schema.index({ runKey: 1, status: 1 });
schema.index({ runKey: 1, balance: -1, checkedAt: -1 });
schema.index({ toolName: 1, runKey: 1, status: 1 });

module.exports = mongoose.model('CentralLoginResult', schema);
