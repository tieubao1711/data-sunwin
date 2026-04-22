const express = require('express');
const app = express();

app.use(express.json());

app.use('/accounts', require('./routes/account.routes'));
app.use('/account-checked', require('./routes/accountChecked.routes'));
app.use('/dashboard', require('./routes/dashboard.routes'));

module.exports = app;