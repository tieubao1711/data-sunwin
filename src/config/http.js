function parseCsv(value = '') {
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeHost(host = '') {
  return String(host).toLowerCase().split(':')[0];
}

function getAllowedOrigins() {
  return parseCsv(process.env.CORS_ORIGINS || [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://103.82.135.143:5173'
  ].join(','));
}

function getAllowedHosts() {
  return parseCsv(process.env.ALLOWED_HOSTS || '').map(normalizeHost);
}

module.exports = {
  getAllowedOrigins,
  getAllowedHosts,
  normalizeHost
};
