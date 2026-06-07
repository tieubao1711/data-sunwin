const Account = require('../models/Account');
const AccountChecked = require('../models/AccountChecked');
const AccountFlagged = require('../models/AccountFlagged');

function toPositiveInt(value, fallback) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

function escapeRegex(text = '') {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function attachCheckedInfo(items = []) {
  const accountIds = items.map((item) => String(item._id));

  if (!accountIds.length) {
    return items.map((item) => ({
      ...item,
      isChecked: false,
      checkedStatus: '',
      checkedBalance: 0
    }));
  }

  const checkedRows = await AccountChecked.find(
    { accountId: { $in: accountIds } },
    { accountId: 1, status: 1, balance: 1 }
  ).lean();

  const checkedMap = new Map(
    checkedRows.map(row => [String(row.accountId), row])
  );

  return items.map(item => {
    const checkedInfo = checkedMap.get(String(item._id));

    return {
      ...item,
      isChecked: !!checkedInfo,
      checkedStatus: checkedInfo?.status || '',
      checkedBalance: checkedInfo?.balance || 0
    };
  });
}

async function getAccountsWithCheckedFilter({
  filter,
  checked,
  finalSortBy,
  finalSortOrder,
  skip,
  limit,
  isAll,
  page
}) {
  const itemsPipeline = [];

  if (!isAll) {
    itemsPipeline.push({ $skip: skip }, { $limit: limit });
  }

  itemsPipeline.push({
    $project: {
      checkedRows: 0,
      checkedInfo: 0,
      accountIdString: 0
    }
  });

  const checkedMatch = checked === 'true'
    ? { checkedInfo: { $ne: null } }
    : { checkedInfo: null };

  const result = await Account.aggregate([
    { $match: filter },
    { $addFields: { accountIdString: { $toString: '$_id' } } },
    {
      $lookup: {
        from: 'accountcheckeds',
        localField: 'accountIdString',
        foreignField: 'accountId',
        as: 'checkedRows'
      }
    },
    { $addFields: { checkedInfo: { $arrayElemAt: ['$checkedRows', 0] } } },
    { $match: checkedMatch },
    { $sort: { [finalSortBy]: finalSortOrder } },
    {
      $facet: {
        items: itemsPipeline,
        meta: [{ $count: 'total' }]
      }
    }
  ]);

  const items = result[0]?.items || [];
  const total = result[0]?.meta?.[0]?.total || 0;
  const data = await attachCheckedInfo(items);

  return {
    items: data,
    pagination: {
      page,
      limit: isAll ? total : limit,
      total,
      totalPages: isAll ? 1 : Math.ceil(total / limit)
    },
    total
  };
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

    const rawFileName = req.query.fileName;

    // ==============================
    // SPECIAL CASE: fileName=flagged
    // Lấy data từ AccountFlagged
    // ==============================
    if (rawFileName === 'flagged') {
      const flaggedFilter = {};

      if (search) {
        const keyword = {
          $regex: escapeRegex(search),
          $options: 'i'
        };

        flaggedFilter.$or = [
          { username: keyword },
          { displayName: keyword },
          { phone: keyword }
        ];
      }

      const allowedFlaggedSortFields = [
        'createdAt',
        'updatedAt',
        'username',
        'balance',
        'safe',
        'depositCount',
        'withdrawCount',
        'totalDeposit',
        'totalWithdraw'
      ];

      const finalSortBy = allowedFlaggedSortFields.includes(sortBy)
        ? sortBy
        : 'updatedAt';

      const finalSortOrder = sortOrder === 'asc' ? 1 : -1;

      const query = AccountFlagged.find(flaggedFilter)
        .sort({ [finalSortBy]: finalSortOrder });

      if (!isAll) {
        query.skip(skip).limit(limit);
      }

      const [items, total] = await Promise.all([
        query.lean(),
        AccountFlagged.countDocuments(flaggedFilter)
      ]);

      return res.json({
        items: items.map(item => ({
          ...item,
          fileName: 'flagged',
          isChecked: true,
          checkedStatus: 'FLAGGED',
          checkedBalance: item.balance || 0
        })),
        pagination: {
          page,
          limit: isAll ? total : limit,
          total,
          totalPages: isAll ? 1 : Math.ceil(total / limit)
        },
        total
      });
    }

    // ==============================
    // NORMAL CASE: lấy từ Account
    // ==============================
    const filter = {};

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

    const allowedSortFields = ['createdAt', 'updatedAt', 'fileName', 'username'];
    const finalSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : 'createdAt';

    const finalSortOrder = sortOrder === 'asc' ? 1 : -1;

    if (checked === 'true' || checked === 'false') {
      const result = await getAccountsWithCheckedFilter({
        filter,
        checked,
        finalSortBy,
        finalSortOrder,
        skip,
        limit,
        isAll,
        page
      });

      return res.json(result);
    }

    const query = Account.find(filter)
      .sort({ [finalSortBy]: finalSortOrder });

    if (!isAll) {
      query.skip(skip).limit(limit);
    }

    const [items, total] = await Promise.all([
      query.lean(),
      Account.countDocuments(filter)
    ]);

    const data = await attachCheckedInfo(items);

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

    const items = await Account.aggregate([
      { $addFields: { accountIdString: { $toString: '$_id' } } },
      {
        $lookup: {
          from: 'accountcheckeds',
          localField: 'accountIdString',
          foreignField: 'accountId',
          as: 'checkedRows'
        }
      },
      { $match: { checkedRows: { $eq: [] } } },
      { $limit: limit },
      {
        $project: {
          checkedRows: 0,
          accountIdString: 0
        }
      }
    ]);

    res.json({
      items,
      total: items.length
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
