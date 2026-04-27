const CentralRun = require('../models/CentralRun');
const CentralLoginResult = require('../models/CentralLoginResult');

function sumAmount(items = []) {
  return items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
}

exports.upsert = async (req, res) => {
  try {
    const {
      runKey,
      toolName = 'unknown-tool',
      machineId = '',
      accountId = '',
      username,
      password = '',
      displayName = '',
      phone = '',
      status,
      message = '',
      balance = 0,
      safe = 0,
      deposits = [],
      withdraws = [],
      rawResponse = null,
      durationMs = 0
    } = req.body;

    if (!runKey) {
      return res.status(400).json({ message: 'runKey is required' });
    }

    if (!username) {
      return res.status(400).json({ message: 'username is required' });
    }

    const payload = {
      runKey: String(runKey),
      toolName,
      machineId,
      accountId: String(accountId || ''),
      username: String(username).trim(),
      password,
      displayName,
      phone,
      status,
      message,
      balance: Number(balance) || 0,
      safe: Number(safe) || 0,

      depositCount: Array.isArray(deposits) ? deposits.length : 0,
      withdrawCount: Array.isArray(withdraws) ? withdraws.length : 0,
      totalDeposit: sumAmount(deposits),
      totalWithdraw: sumAmount(withdraws),

      deposits,
      withdraws,
      rawResponse,
      durationMs: Number(durationMs) || 0,
      checkedAt: new Date()
    };

    const data = await CentralLoginResult.findOneAndUpdate(
      {
        runKey: payload.runKey,
        username: payload.username
      },
      { $set: payload },
      { new: true, upsert: true }
    );

    // update summary run
    const [successCount, failedCount, flaggedCount] = await Promise.all([
      CentralLoginResult.countDocuments({ runKey: payload.runKey, status: 'SUCCESS' }),
      CentralLoginResult.countDocuments({ runKey: payload.runKey, status: 'FAILED' }),
      CentralLoginResult.countDocuments({
        runKey: payload.runKey,
        $or: [
          { depositCount: { $gt: 0 } },
          { withdrawCount: { $gt: 0 } }
        ]
      })
    ]);

    await CentralRun.findOneAndUpdate(
      { runKey: payload.runKey },
      {
        $set: {
          runKey: payload.runKey,
          toolName,
          machineId,
          successCount,
          failedCount,
          flaggedCount,
          updatedAt: new Date()
        },
        $setOnInsert: {
          status: 'RUNNING',
          startedAt: new Date()
        }
      },
      { upsert: true }
    );

    res.json(data);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Duplicate result' });
    }

    res.status(500).json({ message: err.message });
  }
};

exports.getAll = async (req, res) => {
  try {
    const {
      runKey = '',
      toolName = '',
      status = '',
      search = '',
      limit = 100
    } = req.query;

    const filter = {};

    if (runKey) filter.runKey = String(runKey);
    if (toolName) filter.toolName = String(toolName);
    if (status) filter.status = String(status);

    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { displayName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } }
      ];
    }

    const items = await CentralLoginResult.find(filter)
      .sort({ checkedAt: -1 })
      .limit(Math.min(Number(limit || 100), 1000))
      .lean();

    res.json({ items });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};