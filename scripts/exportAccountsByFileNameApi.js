require('dotenv').config();

const fs = require('fs');
const path = require('path');

const apiBase = String(process.env.ACCOUNT_API_URL || 'http://103.82.135.143:3001')
  .replace(/\/$/, '');
const fileName = process.argv[2] || 'suntong.json';
const outputPath = path.resolve(
  process.cwd(),
  process.argv[3] || `exports/${fileName.replace(/[\\/:"*?<>|]+/g, '_')}.txt`
);

async function main() {
  const items = [];
  const limit = 200;
  let page = 1;
  let totalPages = 1;

  do {
    const params = new URLSearchParams({
      fileName,
      page: String(page),
      limit: String(limit)
    });

    const res = await fetch(`${apiBase}/accounts?${params.toString()}`);
    if (!res.ok) {
      throw new Error(`API error ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    if (!Array.isArray(data.items)) {
      throw new Error('API response must contain items array');
    }

    items.push(...data.items);
    totalPages = Number(data.pagination?.totalPages || 1);
    page += 1;
  } while (page <= totalPages);

  const rows = items
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

main().catch((err) => {
  console.error(err.message);
  process.exitCode = 1;
});
