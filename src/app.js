const express = require('express');
const cors = require('cors');
const {
  getAllowedOrigins,
  getAllowedHosts,
  normalizeHost
} = require('./config/http');

const app = express();

app.set('trust proxy', 1);

app.use(cors({
  origin: getAllowedOrigins(),
  credentials: true
}));

app.use((req, res, next) => {
  const allowedHosts = getAllowedHosts();
  if (!allowedHosts.length) return next();

  const host = normalizeHost(req.headers.host || '');
  if (allowedHosts.includes(host)) return next();

  return res.status(403).json({ message: 'Host is not allowed' });
});

app.use(express.json({ limit: '50mb' }));

app.use('/accounts', require('./routes/account.routes'));
app.use('/account-checked', require('./routes/accountChecked.routes'));
app.use('/dashboard', require('./routes/dashboard.routes'));
app.use('/account-flagged', require('./routes/accountFlagged.routes'));
// app.use('/central-runs', require('./routes/centralRun.routes'));
// app.use('/central-login-results-2', require('./routes/centralLoginResult.routes'));
app.use('/proxy-pools', require('./routes/proxyPool.routes'));

module.exports = app;
