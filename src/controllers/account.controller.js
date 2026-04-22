const Account = require('../models/Account');

exports.create = async (req, res) => {
  const data = await Account.create(req.body);
  res.json(data);
};

exports.getAll = async (req, res) => {
  const data = await Account.find();
  res.json(data);
};