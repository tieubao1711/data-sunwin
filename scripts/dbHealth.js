require('dotenv').config();

const mongoose = require('mongoose');

const collections = [
  'accounts',
  'accountcheckeds',
  'accountflaggeds',
  'centralruns',
  'centralloginresults',
  'proxypools',
  'proxyitems'
];

function mb(value = 0) {
  return Math.round((Number(value) / 1024 / 1024) * 100) / 100;
}

async function main() {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is required');
  }

  await mongoose.connect(process.env.MONGO_URI);

  const db = mongoose.connection.db;
  const dbStats = await db.stats();

  console.log(JSON.stringify({
    database: db.databaseName,
    collections: dbStats.collections,
    objects: dbStats.objects,
    dataSizeMB: mb(dbStats.dataSize),
    storageSizeMB: mb(dbStats.storageSize),
    indexSizeMB: mb(dbStats.indexSize),
    totalSizeMB: mb(dbStats.totalSize)
  }, null, 2));

  for (const name of collections) {
    const exists = await db.listCollections({ name }).hasNext();
    if (!exists) continue;

    const stats = await db.command({ collStats: name });
    const indexes = await db.collection(name).indexes();

    console.log(JSON.stringify({
      collection: name,
      count: stats.count,
      sizeMB: mb(stats.size),
      storageSizeMB: mb(stats.storageSize),
      totalIndexSizeMB: mb(stats.totalIndexSize),
      avgObjSize: stats.avgObjSize,
      indexes: indexes.map((index) => ({
        name: index.name,
        key: index.key,
        unique: !!index.unique
      }))
    }, null, 2));
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
