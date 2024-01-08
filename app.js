require('dotenv').config()
const express = require('express');
const path = require('path');
const router = require('./routes/router');
const mysql2 = require('mysql2');

const app = express();
const port = process.env.PORT || 3000;

// 連線到 MySQL 資料庫
connection = mysql2.createConnection({
  host     : process.env.DB_HOST || 'localhost',
  user     : process.env.DB_USER || 'root',
  password : process.env.DB_PASSWORD || 'root12345',
});
 
connection.connect(function(err) {
  if (err) {
    console.error('error connecting: ' + err.stack);
    return;
  }
 
  console.log('Mysql is successfully connected as id ' + connection.threadId);
});

// Demo 首頁
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'index.html'));
});

app.use('/', router);

const server = app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

// 優雅地關閉資料庫連線
function gracefulShutdown() {
  server.close(() => {
      console.log('The application server is gracefully terminated');

      connection.end(err => {
          if (err) {
              console.error('An error occurred while closing the database connection', err);
          } else {
              console.log('The database connection is gracefully terminated');
          }
      });
  });
}

// 處理終止信號
process.on('SIGINT', gracefulShutdown); // e.g. Ctrl+C
process.on('SIGTERM', gracefulShutdown); // e.g. 由 kill 命令發出