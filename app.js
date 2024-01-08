require('dotenv').config()
const express = require('express');
const path = require('path');
const router = require('./routes/router');

const app = express();
const port = process.env.PORT || 3000;

// Demo 首頁
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'index.html'));
});

app.use('/', router);

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});