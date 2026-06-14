require('dotenv').config();

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Account = require('../src/models/Account');

const outputPath = path.resolve(
  process.cwd(),
  process.argv[2] || 'exports/accounts-all.txt'
);

async function main() {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is required');
  }

  await mongoose.connect(process.env.MONGO_URI);

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  const stream = fs.createWriteStream(outputPath, { encoding: 'utf8' });
  let exported = 0;
  let skipped = 0;

  const cursor = Account.find(
    {},
    { username: 1, password: 1, _id: 0 }
  )
    .sort({ createdAt: 1 })
    .lean()
    .cursor();

  for await (const account of cursor) {
    const username = String(account.username || '').trim();
    const password = String(account.password || '').trim();

    if (!username || !password) {
      skipped += 1;
      continue;
    }

    if (exported > 0) {
      stream.write('\n');
    }

    stream.write(`${username}|${password}`);
    exported += 1;
  }

  await new Promise((resolve, reject) => {
    stream.end((err) => (err ? reject(err) : resolve()));
  });

  console.log(`Exported ${exported} accounts`);
  console.log(`Skipped ${skipped} invalid accounts`);
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
