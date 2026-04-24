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
    const isAll = req.query.all === 'true';

    const page = toPositiveInt(req.query.page, 1);
    const limit = isAll
      ? 1000000
      : Math.min(toPositiveInt(req.query.limit, 20), 200);

    const skip = isAll ? 0 : (page - 1) * limit;

    const {
      search = '',
      checked = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filter = {};

    const rawFileName = req.query.fileName;

    if (rawFileName) {
      let fileNames = [];

      if (Array.isArray(rawFileName)) {
        fileNames = rawFileName;
      } else if (typeof rawFileName === 'string') {
        fileNames = rawFileName.split(',');
      }

      fileNames = fileNames
        .map(x => String(x).trim())
        .filter(Boolean);

      if (fileNames.length === 1) {
        filter.fileName = fileNames[0];
      } else if (fileNames.length > 1) {
        filter.fileName = { $in: fileNames };
      }
    }

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

    if (checked === 'true' || checked === 'false') {
      const checkedRows = await AccountChecked.find({}, { accountId: 1 }).lean();
      const checkedIds = checkedRows.map(x => x.accountId);

      if (checked === 'true') {
        filter._id = { $in: checkedIds };
      } else {
        filter._id = { $nin: checkedIds };
      }
    }

    const allowedSortFields = ['createdAt', 'updatedAt', 'fileName', 'username'];
    const finalSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : 'createdAt';

    const finalSortOrder = sortOrder === 'asc' ? 1 : -1;

    const query = Account.find(filter)
      .sort({ [finalSortBy]: finalSortOrder });

    if (!isAll) {
      query.skip(skip).limit(limit);
    }

    const [items, total, checkedRows] = await Promise.all([
      query.lean(),

      Account.countDocuments(filter),

      AccountChecked.find({}, { accountId: 1, status: 1, balance: 1 }).lean()
    ]);

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
        limit: isAll ? total : limit,
        total,
        totalPages: isAll ? 1 : Math.ceil(total / limit)
      },
      total
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