const Account = require('../models/Account');
const AccountChecked = require('../models/AccountChecked');

function toPositiveInt(value, fallback) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

function escapeRegex(text = '') {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ==============================
// CREATE
// ==============================
exports.create = async (req, res) => {
  try {
    const { fileName = '', username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        message: 'username and password are required'
      });
    }

    const data = await Account.create({
      fileName,
      username: String(username).trim(),
      password: String(password).trim()
    });

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



// ==============================
// GET ALL (pagination + filter)
// ==============================
exports.getAll = async (req, res) => {
  try {
    const page = toPositiveInt(req.query.page, 1);
    const limit = Math.min(toPositiveInt(req.query.limit, 20), 200);
    const skip = (page - 1) * limit;

    const {
      search = '',
      fileName = '',
      checked = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filter = {};

    // filter theo fileName
    if (fileName) {
      filter.fileName = {
        $regex: escapeRegex(fileName),
        $options: 'i'
      };
    }

    // search username / password
    if (search) {
      const keyword = {
        $regex: escapeRegex(search),
        $options: 'i'
      };

      filter.$or = [
        { username: keyword },
        { password: keyword }
      ];
    }

    // filter checked / unchecked
    if (checked === 'true' || checked === 'false') {
      const checkedRows = await AccountChecked.find({}, { accountId: 1 }).lean();
      const checkedIds = checkedRows.map(x => x.accountId);

      if (checked === 'true') {
        filter._id = { $in: checkedIds };
      } else {
        filter._id = { $nin: checkedIds };
      }
    }

    // sort
    const allowedSortFields = ['createdAt', 'updatedAt', 'fileName', 'username'];
    const finalSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : 'createdAt';

    const finalSortOrder = sortOrder === 'asc' ? 1 : -1;

    const [items, total, checkedRows] = await Promise.all([
      Account.find(filter)
        .sort({ [finalSortBy]: finalSortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),

      Account.countDocuments(filter),

      AccountChecked.find({}, { accountId: 1, status: 1, balance: 1 }).lean()
    ]);

    // map checked info
    const checkedMap = new Map(
      checkedRows.map(row => [String(row.accountId), row])
    );

    const data = items.map(item => {
      const checkedInfo = checkedMap.get(String(item._id));

      return {
        ...item,
        isChecked: !!checkedInfo,
        checkedStatus: checkedInfo?.status || '',
        checkedBalance: checkedInfo?.balance || 0
      };
    });

    res.json({
      items: data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



// ==============================
// GET BY ID
// ==============================
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;

    const account = await Account.findById(id).lean();

    if (!account) {
      return res.status(404).json({
        message: 'Account not found'
      });
    }

    const checked = await AccountChecked.findOne({
      accountId: String(id)
    }).lean();

    res.json({
      ...account,
      checked: checked || null
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



// ==============================
// GET UNCHECKED (cho tool login)
// ==============================
exports.getUnchecked = async (req, res) => {
  try {
    const limit = Math.min(toPositiveInt(req.query.limit, 100), 1000);

    const checkedRows = await AccountChecked.find({}, { accountId: 1 }).lean();
    const checkedIds = checkedRows.map(x => x.accountId);

    const items = await Account.find({
      _id: { $nin: checkedIds }
    })
      .limit(limit)
      .lean();

    res.json({
      items,
      total: items.length
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};