const AccountChecked = require('../models/AccountChecked');

function toPositiveInt(value, fallback) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

function escapeRegex(text = '') {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// UPSERT (create hoặc update)
exports.create = async (req, res) => {
  try {
    const { accountId } = req.body;

    if (!accountId) {
      return res.status(400).json({
        message: 'accountId is required'
      });
    }

    const payload = {
      username: req.body.username,
      password: req.body.password,
      displayName: req.body.displayName,
      phone: req.body.phone,
      balance: req.body.balance,
      safe: req.body.safe,
      status: req.body.status,
      message: req.body.message
    };

    const data = await AccountChecked.findOneAndUpdate(
      { accountId: String(accountId) },
      { $set: payload },
      {
        new: true,
        upsert: true
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
    const page = toPositiveInt(req.query.page, 1);
    const limit = Math.min(toPositiveInt(req.query.limit, 20), 200);
    const skip = (page - 1) * limit;

    const {
      search = '',
      status = '',
      minBalance,
      maxBalance,
      sortBy = 'updatedAt',
      sortOrder = 'desc'
    } = req.query;

    const filter = {};

    // search username / phone
    if (search) {
      const keyword = { $regex: escapeRegex(search), $options: 'i' };
      filter.$or = [
        { username: keyword },
        { phone: keyword }
      ];
    }

    // filter status
    if (status) {
      filter.status = status;
    }

    // filter balance
    if (minBalance || maxBalance) {
      filter.balance = {};
      if (minBalance) filter.balance.$gte = Number(minBalance);
      if (maxBalance) filter.balance.$lte = Number(maxBalance);
    }

    const sort = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1
    };

    const [items, total] = await Promise.all([
      AccountChecked.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      AccountChecked.countDocuments(filter)
    ]);

    res.json({
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
};

exports.getById = async (req, res) => {
  try {
    const { accountId } = req.params;

    const data = await AccountChecked.findOne({
      accountId: String(accountId)
    }).lean();

    if (!data) {
      return res.status(404).json({
        message: 'Not found'
      });
    }

    res.json(data);

  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
};