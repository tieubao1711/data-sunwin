const CentralRun = require('../models/CentralRun');
const CentralLoginResult = require('../models/CentralLoginResult');
const { getCentralToolFilter } = require('../config/centralTools');

exports.upsert = async (req, res) => {
  try {
    const {
      runKey,
      toolName = 'unknown-tool',
      machineId = '',
      sourceFile = '',
      total = 0,
      status = 'RUNNING',
      startedAt,
      finishedAt,
      meta = {}
    } = req.body;

    if (!runKey) {
      return res.status(400).json({ message: 'runKey is required' });
    }

    const data = await CentralRun.findOneAndUpdate(
      { runKey: String(runKey) },
      {
        $set: {
          runKey: String(runKey),
          toolName,
          machineId,
          sourceFile,
          total,
          status,
          startedAt: startedAt ? new Date(startedAt) : undefined,
          finishedAt: finishedAt ? new Date(finishedAt) : undefined,
          meta
        }
      },
      { new: true, upsert: true }
    );

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAll = async (req, res) => {
  try {
    const items = await CentralRun.find({
      toolName: getCentralToolFilter()
    })
      .sort({ updatedAt: -1 })
      .limit(Math.min(Number(req.query.limit || 50), 200))
      .lean();

    res.json({ items });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const { runKey } = req.params;

    if (!runKey) {
      return res.status(400).json({ message: 'runKey is required' });
    }

    const runFilter = {
      runKey: String(runKey),
      toolName: getCentralToolFilter()
    };

    const runDeleted = await CentralRun.deleteOne(runFilter);
    const resultsDeleted = runDeleted.deletedCount
      ? await CentralLoginResult.deleteMany(runFilter)
      : { deletedCount: 0 };

    res.json({
      message: 'Deleted central run',
      runDeleted: runDeleted.deletedCount,
      resultsDeleted: resultsDeleted.deletedCount
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
