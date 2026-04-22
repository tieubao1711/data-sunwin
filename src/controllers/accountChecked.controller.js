const AccountChecked = require('../models/AccountChecked');

exports.create = async (req, res) => {
  try {
    const { accountId } = req.body;

    if (!accountId) {
      return res.status(400).json({
        message: 'accountId is required'
      });
    }

    const data = await AccountChecked.findOneAndUpdate(
      { accountId },
      { $set: req.body },
      {
        new: true,
        upsert: true,
        runValidators: true
      }
    );

    res.json(data);
  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
};

exports.getAll = async (req, res) => {
  try {
    const data = await AccountChecked.find().populate('accountId');
    res.json(data);
  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
};