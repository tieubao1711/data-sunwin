require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

connectDB();

const port = process.env.PORT || 3001;
const host = process.env.HOST || '127.0.0.1';

app.listen(port, host, () => {
  console.log(`Server running at http://${host}:${port}`);
});
