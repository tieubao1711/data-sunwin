const Account = require('../models/Account');

exports.create = async (req, res) => {
  try {
    const data = await Account.create(req.body);
    res.json(data);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        message: 'Duplicate account (username + password)'
      });
    }
    res.status(500).json({ message: err.message });
  }
};

exports.getAll = async (req, res) => {
  const data = await Account.find();
  res.json(data);
};