const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://103.82.135.143:5173'
  ],
  credentials: true
}));

app.use(express.json());

app.use('/accounts', require('./routes/account.routes'));
app.use('/account-checked', require('./routes/accountChecked.routes'));
app.use('/dashboard', require('./routes/dashboard.routes'));
app.use('/account-flagged', require('./routes/accountFlagged.routes'));
app.use('/central-runs', require('./routes/centralRun.routes'));
app.use('/central-login-results', require('./routes/centralLoginResult.routes'));
app.use('/proxy-pools', require('./routes/proxyPool.routes'));

module.exports = app;
