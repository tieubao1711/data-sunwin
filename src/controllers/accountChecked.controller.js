const AccountChecked = require('../models/AccountChecked');

exports.create = async (req, res) => {
  const data = await AccountChecked.create(req.body);
  res.json(data);
};

exports.getAll = async (req, res) => {
  const data = await AccountChecked.find().populate('accountId');
  res.json(data);
};