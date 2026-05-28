const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  poolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProxyPool',
    required: true,
    index: true
  },
  raw: { type: String, required: true },
  url: { type: String, required: true, index: true },
  protocol: { type: String, required: true, index: true },
  host: { type: String, required: true, index: true },
  port: { type: Number, required: true },
  username: { type: String, default: '' },
  password: { type: String, default: '' },
  status: {
    type: String,
    enum: ['ACTIVE', 'DEAD', 'DISABLED'],
    default: 'ACTIVE',
    index: true
  },
  successCount: { type: Number, default: 0 },
  failCount: { type: Number, default: 0 },
  lastCheckedAt: Date,
  lastError: { type: String, default: '' }
}, { timestamps: true });

schema.index({ poolId: 1, url: 1 }, { unique: true });

module.exports = mongoose.model('ProxyItem', schema);
