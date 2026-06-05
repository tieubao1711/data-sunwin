require('dotenv').config();

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Account = require('../src/models/Account');

const fileName = process.argv[2] || 'suntong.json';
const outputPath = path.resolve(
  process.cwd(),
  process.argv[3] || `exports/${fileName.replace(/[\\/:"*?<>|]+/g, '_')}.txt`
);

async function main() {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is required');
  }

  await mongoose.connect(process.env.MONGO_URI);

  const accounts = await Account.find(
    { fileName },
    { username: 1, password: 1, _id: 0 }
  )
    .sort({ createdAt: 1 })
    .lean();

  const rows = accounts
    .map((account) => {
      const username = String(account.username || '').trim();
      const password = String(account.password || '').trim();
      return username && password ? `${username}|${password}` : '';
    })
    .filter(Boolean);

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, rows.join('\n'), 'utf8');

  console.log(`Exported ${rows.length} accounts from ${fileName}`);
  console.log(outputPath);
}

main()
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
