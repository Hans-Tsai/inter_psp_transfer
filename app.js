require("dotenv").config();
const express = require("express");
const path = require("path");
const router = require("./routes/router");

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";

// 連線到 MySQL 資料庫
const knexConfig = require("./knexfile")[NODE_ENV];
const knex = require("knex")(knexConfig);
// 初始化資料庫
const databaseName = "fido_uaf";
knex.raw(`CREATE DATABASE IF NOT EXISTS ??`, [databaseName])
    .then(() => {
        console.log(`Database ${databaseName} created`);
    })
    .catch((err) => {
        console.error("Error creating database:", err);
    });

// Demo 首頁
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "pages", "index.html"));
});

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
