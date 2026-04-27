const AccountFlagged = require('../models/AccountFlagged');

function toPositiveInt(value, fallback) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

function escapeRegex(text = '') {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function sumAmount(list = []) {
  return list.reduce((sum, item) => {
    const amount = Number(item.amount || item.money || item.value || 0);
    return sum + (Number.isFinite(amount) ? amount : 0);
  }, 0);
}

exports.upsert = async (req, res) => {
  try {
    const {
      accountId,
      username,
      password,
      displayName,
      phone,
      balance = 0,
      safe = 0,
      deposits = [],
      withdraws = [],
      source = 'local-tool'
    } = req.body;

    if (!username) {
      return res.status(400).json({
        message: 'username is required'
      });
    }

    const depositCount = Array.isArray(deposits) ? deposits.length : 0;
    const withdrawCount = Array.isArray(withdraws) ? withdraws.length : 0;

    if (depositCount === 0 && withdrawCount === 0) {
      return res.status(400).json({
        message: 'Account has no deposit or withdraw history'
      });
    }

    const payload = {
      accountId: accountId ? String(accountId) : '',
      username: String(username).trim(),
      password: password || '',
      displayName: displayName || '',
      phone: phone || '',
      balance: Number(balance) || 0,
      safe: Number(safe) || 0,

      depositCount,
      withdrawCount,
      totalDeposit: sumAmount(deposits),
      totalWithdraw: sumAmount(withdraws),

      latestDepositAt: deposits?.[0]?.time || deposits?.[0]?.createdAt || '',
      latestWithdrawAt: withdraws?.[0]?.time || withdraws?.[0]?.createdAt || '',

      deposits,
      withdraws,

      reason: [
        depositCount > 0 ? `Có ${depositCount} lịch sử nạp` : '',
        withdrawCount > 0 ? `Có ${withdrawCount} lịch sử rút` : ''
      ].filter(Boolean).join(' | '),

      source
    };

    const data = await AccountFlagged.findOneAndUpdate(
      { username: payload.username },
      { $set: payload },
      { new: true, upsert: true }
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
      hasDeposit = '',
      hasWithdraw = '',
      minDeposit,
      minWithdraw,
      sortBy = 'updatedAt',
      sortOrder = 'desc'
    } = req.query;

    const filter = {};

    if (search) {
      const keyword = { $regex: escapeRegex(search), $options: 'i' };
      filter.$or = [
        { username: keyword },
        { displayName: keyword },
        { phone: keyword }
      ];
    }

    if (hasDeposit === 'true') {
      filter.depositCount = { $gt: 0 };
    }

    if (hasWithdraw === 'true') {
      filter.withdrawCount = { $gt: 0 };
    }

    if (minDeposit) {
      filter.totalDeposit = { $gte: Number(minDeposit) };
    }

    if (minWithdraw) {
      filter.totalWithdraw = { $gte: Number(minWithdraw) };
    }

    const allowedSortFields = [
      'updatedAt',
      'createdAt',
      'balance',
      'safe',
      'depositCount',
      'withdrawCount',
      'totalDeposit',
      'totalWithdraw'
    ];

    const finalSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : 'updatedAt';

    const sort = {
      [finalSortBy]: sortOrder === 'asc' ? 1 : -1
    };

    const [items, total] = await Promise.all([
      AccountFlagged.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      AccountFlagged.countDocuments(filter)
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

exports.getByUsername = async (req, res) => {
  try {
    const data = await AccountFlagged.findOne({
      username: req.params.username
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