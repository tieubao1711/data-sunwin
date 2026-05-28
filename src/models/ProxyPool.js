const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, index: true },
  description: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('ProxyPool', schema);
