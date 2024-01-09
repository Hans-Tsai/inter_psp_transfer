require("dotenv").config();
const PORT = process.env.PORT || 3000;

const express = require("express");
const path = require("path");
const router = require("./routes/router");
const cookieParser = require('cookie-parser');

const app = express();
const knex = require('./database/db');

/** 中介函數 (middleware) */
// 設定 express app 的靜態資料夾為 `./public/`
app.use(express.static('public'));
// 將 API request 夾帶的 JSON 資料"解析"成 Javascript 的物件 (object) 形式
app.use(express.json());
// 將 API request 夾帶的 `cookie` 中的 `cookie header` 資料"解析"成 Javascript 的物件 (object) 形式。同時會產生 req.cookies 的屬性值，並綁定到 `request` 物件上
app.use(cookieParser());

// 指定 view engine 為 `ejs` 模板引擎
app.set('view engine', 'ejs');

// Demo 首頁
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "index.html"));
});

// 設定路由器
app.use("/", router);

const server = app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});

// 優雅地關閉資料庫連線
function gracefulShutdown() {
    server.close(() => {
        console.log("");
        console.log("The application server is gracefully terminated");

        knex.destroy((err) => {
            if (err) {
                console.error(
                    "An error occurred while closing the database connection",
                    err
                );
            } else {
                console.log("The database connection is gracefully terminated");
            }
        });
    });
}

// 處理終止信號
process.on("SIGINT", gracefulShutdown); // e.g. Ctrl+C
process.on("SIGTERM", gracefulShutdown); // e.g. 由 kill 命令發出
