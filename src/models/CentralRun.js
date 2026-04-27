const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  runKey: { type: String, required: true, unique: true, index: true },

  toolName: { type: String, default: 'unknown-tool', index: true },
  machineId: { type: String, default: '', index: true },

  sourceFile: { type: String, default: '' },

  total: { type: Number, default: 0 },
  successCount: { type: Number, default: 0 },
  failedCount: { type: Number, default: 0 },
  flaggedCount: { type: Number, default: 0 },

  status: {
    type: String,
    enum: ['RUNNING', 'DONE', 'STOPPED', 'ERROR'],
    default: 'RUNNING',
    index: true
  },

  startedAt: Date,
  finishedAt: Date,

  meta: { type: Object, default: {} }
}, { timestamps: true });

module.exports = mongoose.model('CentralRun', schema);