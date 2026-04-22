const Account = require('../models/Account');
const AccountChecked = require('../models/AccountChecked');

exports.getSummary = async (req, res) => {
  try {
    const [
      totalAccounts,
      totalChecked,
      successCount,
      failedCount,
      balanceAgg,
      topAccounts,
      recentFailed
    ] = await Promise.all([

      // tổng account
      Account.countDocuments(),

      // tổng checked
      AccountChecked.countDocuments(),

      // success
      AccountChecked.countDocuments({ status: 'SUCCESS' }),

      // failed
      AccountChecked.countDocuments({ status: 'FAILED' }),

      // tổng balance
      AccountChecked.aggregate([
        {
          $group: {
            _id: null,
            totalBalance: { $sum: '$balance' }
          }
        }
      ]),

      // top balance
      AccountChecked.find()
        .sort({ balance: -1 })
        .limit(10)
        .lean(),

      // recent failed
      AccountChecked.find({ status: 'FAILED' })
        .sort({ updatedAt: -1 })
        .limit(10)
        .lean()
    ]);

    const unchecked = totalAccounts - totalChecked;

    res.json({
      stats: {
        totalAccounts,
        totalChecked,
        unchecked,
        successCount,
        failedCount,
        totalBalance: balanceAgg[0]?.totalBalance || 0
      },

      topBalance: topAccounts.map(x => ({
        username: x.username,
        balance: x.balance,
        phone: x.phone
      })),

      recentFailed: recentFailed.map(x => ({
        username: x.username,
        message: x.message,
        updatedAt: x.updatedAt
      }))
    });

  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
};