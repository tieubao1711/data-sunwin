const mongoose = require('mongoose');
const ProxyPool = require('../models/ProxyPool');
const ProxyItem = require('../models/ProxyItem');
const { normalizeProxy } = require('../utils/proxyNormalizer');

const STATUSES = ['ACTIVE', 'DEAD', 'DISABLED'];

function isValidObjectId(value) {
  return mongoose.Types.ObjectId.isValid(String(value));
}

function toObjectId(value) {
  return new mongoose.Types.ObjectId(String(value));
}

function sanitizeProxy(item) {
  return {
    _id: item._id,
    poolId: item.poolId,
    protocol: item.protocol,
    host: item.host,
    port: item.port,
    status: item.status,
    successCount: item.successCount,
    failCount: item.failCount,
    lastCheckedAt: item.lastCheckedAt,
    lastError: item.lastError,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  };
}

async function ensurePool(poolId, res) {
  if (!isValidObjectId(poolId)) {
    res.status(400).json({ message: 'Invalid poolId' });
    return null;
  }

  const pool = await ProxyPool.findById(poolId).lean();
  if (!pool) {
    res.status(404).json({ message: 'Proxy pool not found' });
    return null;
  }

  return pool;
}

exports.getPools = async (req, res) => {
  try {
    const pools = await ProxyPool.find()
      .sort({ updatedAt: -1 })
      .lean();

    const items = await Promise.all(pools.map(async (pool) => {
      const poolId = toObjectId(pool._id);
      const [total, activeCount, deadCount, disabledCount] = await Promise.all([
        ProxyItem.countDocuments({ poolId }),
        ProxyItem.countDocuments({ poolId, status: 'ACTIVE' }),
        ProxyItem.countDocuments({ poolId, status: 'DEAD' }),
        ProxyItem.countDocuments({ poolId, status: 'DISABLED' })
      ]);

      return {
        ...pool,
        total,
        activeCount,
        deadCount,
        disabledCount
      };
    }));

    res.json({ items });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createPool = async (req, res) => {
  try {
    const { name, description = '' } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'name is required' });
    }

    const data = await ProxyPool.create({
      name: String(name).trim(),
      description
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updatePool = async (req, res) => {
  try {
    const { poolId } = req.params;

    if (!isValidObjectId(poolId)) {
      return res.status(400).json({ message: 'Invalid poolId' });
    }

    const patch = {};
    if (req.body.name !== undefined) patch.name = String(req.body.name).trim();
    if (req.body.description !== undefined) patch.description = req.body.description;

    const data = await ProxyPool.findByIdAndUpdate(poolId, { $set: patch }, {
      new: true
    });

    if (!data) {
      return res.status(404).json({ message: 'Proxy pool not found' });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deletePool = async (req, res) => {
  try {
    const { poolId } = req.params;

    if (!isValidObjectId(poolId)) {
      return res.status(400).json({ message: 'Invalid poolId' });
    }

    const poolDeleted = await ProxyPool.deleteOne({ _id: poolId });
    const proxiesDeleted = poolDeleted.deletedCount
      ? await ProxyItem.deleteMany({ poolId: toObjectId(poolId) })
      : { deletedCount: 0 };

    res.json({
      message: 'Deleted proxy pool',
      poolDeleted: poolDeleted.deletedCount,
      proxiesDeleted: proxiesDeleted.deletedCount
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getProxies = async (req, res) => {
  try {
    const { poolId } = req.params;
    const { status = '', limit = 1000 } = req.query;

    const pool = await ensurePool(poolId, res);
    if (!pool) return;

    const filter = { poolId: toObjectId(poolId) };
    if (status) filter.status = String(status).toUpperCase();

    const items = await ProxyItem.find(filter)
      .sort({ updatedAt: -1 })
      .limit(Math.min(Number(limit || 1000), 5000))
      .lean();

    res.json({ items: items.map(sanitizeProxy) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.importProxies = async (req, res) => {
  try {
    const { poolId } = req.params;
    const rawText = typeof req.body === 'string'
      ? req.body
      : req.body.text ?? req.body.raw ?? '';

    const pool = await ensurePool(poolId, res);
    if (!pool) return;

    const lines = String(rawText)
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    const errors = [];
    let imported = 0;
    let updated = 0;
    let skipped = 0;

    for (const line of lines) {
      try {
        const normalized = normalizeProxy(line);
        if (!normalized) {
          skipped += 1;
          continue;
        }

        const result = await ProxyItem.updateOne(
          {
            poolId: toObjectId(poolId),
            url: normalized.url
          },
          {
            $set: {
              raw: line,
              ...normalized,
              status: 'ACTIVE',
              lastError: ''
            },
            $setOnInsert: {
              successCount: 0,
              failCount: 0
            }
          },
          { upsert: true }
        );

        if (result.upsertedCount) imported += 1;
        else if (result.modifiedCount) updated += 1;
        else skipped += 1;
      } catch (err) {
        errors.push({ raw: line, message: err.message });
      }
    }

    res.json({
      message: 'Imported proxies',
      total: lines.length,
      imported,
      updated,
      skipped,
      failed: errors.length,
      errors
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Duplicate proxy' });
    }

    res.status(500).json({ message: err.message });
  }
};

exports.deleteProxy = async (req, res) => {
  try {
    const { poolId, proxyId } = req.params;

    const pool = await ensurePool(poolId, res);
    if (!pool) return;

    if (!isValidObjectId(proxyId)) {
      return res.status(400).json({ message: 'Invalid proxyId' });
    }

    const deleted = await ProxyItem.deleteOne({
      _id: proxyId,
      poolId: toObjectId(poolId)
    });

    res.json({
      message: 'Deleted proxy',
      deleted: deleted.deletedCount
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateProxy = async (req, res) => {
  try {
    const { poolId, proxyId } = req.params;

    const pool = await ensurePool(poolId, res);
    if (!pool) return;

    if (!isValidObjectId(proxyId)) {
      return res.status(400).json({ message: 'Invalid proxyId' });
    }

    const patch = {};

    if (req.body.raw !== undefined) {
      const normalized = normalizeProxy(req.body.raw);
      if (!normalized) {
        return res.status(400).json({ message: 'Invalid proxy format' });
      }

      Object.assign(patch, {
        raw: String(req.body.raw).trim(),
        ...normalized
      });
    }

    if (req.body.status !== undefined) {
      const status = String(req.body.status).toUpperCase();
      if (!STATUSES.includes(status)) {
        return res.status(400).json({ message: 'Invalid proxy status' });
      }
      patch.status = status;
    }

    if (req.body.lastError !== undefined) patch.lastError = String(req.body.lastError || '');
    if (req.body.lastCheckedAt !== undefined) {
      patch.lastCheckedAt = req.body.lastCheckedAt ? new Date(req.body.lastCheckedAt) : null;
    }

    const data = await ProxyItem.findOneAndUpdate(
      {
        _id: proxyId,
        poolId: toObjectId(poolId)
      },
      { $set: patch },
      { new: true }
    ).lean();

    if (!data) {
      return res.status(404).json({ message: 'Proxy not found' });
    }

    res.json(sanitizeProxy(data));
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Duplicate proxy' });
    }

    res.status(500).json({ message: err.message });
  }
};

exports.getActiveProxies = async (req, res) => {
  try {
    const { poolId } = req.params;

    const pool = await ensurePool(poolId, res);
    if (!pool) return;

    const items = await ProxyItem.find({
      poolId: toObjectId(poolId),
      status: 'ACTIVE'
    }, {
      url: 1
    })
      .sort({ updatedAt: -1 })
      .lean();

    res.json({
      items: items.map((item) => ({
        id: String(item._id),
        url: item.url
      }))
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
