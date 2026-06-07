require('dotenv').config();

const mongoose = require('mongoose');

const indexes = [
  ['accounts', { fileName: 1, createdAt: -1 }],
  ['accounts', { fileName: 1, username: 1 }],
  ['accounts', { createdAt: -1 }],
  ['accounts', { updatedAt: -1 }],
  ['accounts', { username: 1 }],
  ['accountcheckeds', { status: 1, updatedAt: -1 }],
  ['accountcheckeds', { balance: -1 }],
  ['accountcheckeds', { updatedAt: -1 }],
  ['accountflaggeds', { updatedAt: -1 }],
  ['accountflaggeds', { balance: -1 }],
  ['accountflaggeds', { createdAt: -1 }],
  ['centralloginresults', { runKey: 1, status: 1 }],
  ['centralloginresults', { runKey: 1, balance: -1, checkedAt: -1 }],
  ['centralloginresults', { toolName: 1, runKey: 1, status: 1 }],
  ['proxyitems', { poolId: 1, status: 1 }]
];

async function main() {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is required');
  }

  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;

  for (const [collection, key] of indexes) {
    await db.collection(collection).createIndex(key, { background: true });
    console.log(`Index ensured: ${collection} ${JSON.stringify(key)}`);
  }
}

main()
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
