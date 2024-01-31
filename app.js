const express = require("express");
const path = require("path");
const router = require("./routes/router");
const cookieParser = require("cookie-parser");

const config = require("./config");
const app = express();
const knex = require("./database/db");
const ngrok = config.ngrok.enabled ? require("ngrok") : null;

let server;

// 指定 view engine 為 `ejs` 模板引擎
app.set("view engine", "ejs");

/** 中介函數 (middleware) */
// 設定 express app 的靜態資料夾為 `./public/`
app.use(express.static("public"));
// 將 API request 夾帶的 JSON 資料"解析"成 Javascript 的物件 (object) 形式，並將其儲存到 `req.body` 屬性中
app.use(express.json());
// 將 API request 夾帶的 `cookie` 中的 `cookie header` 資料"解析"成 Javascript 的物件 (object) 形式，並將其儲存到 `req.cookies` 的屬性中
app.use(cookieParser());
app.use((req, res, next) => {
    res.set("ngrok-skip-browser-warning", "anyValue");
    next();
});

// Demo 首頁
app.get("/", (req, res) => {
    res.render("index");
});

// 設定路由器
app.use(router);

async function startServer() {
    try {
        if (ngrok) {
            const origin = await ngrok.connect({
                addr: config.server.port,
                subdomain: config.ngrok.subdomain,
                authtoken: config.ngrok.authtoken,
            });

            // Start the server on the correct port.
            server = app.listen(config.server.port, () => {
                console.log(`🚀  Server is running at ${origin}`);
            });
        }
    } catch (err) {
        if (err.code === "ECONNREFUSED") {
            console.log(`⚠️  Connection refused at ${err.address}:${err.port}`);
        } else {
            console.log(`⚠️ Ngrok error: ${JSON.stringify(err)}`);
        }
        process.exit(1);
    }
}

// 優雅地關閉資料庫連線
function gracefulShutdown() {
    server.close(() => {
        console.log("\nThe application server is gracefully terminated");

        knex.destroy((err) => {
            if (err) {
                console.error("An error occurred while closing the database connection", err);
            } else {
                console.log("The database connection is gracefully terminated");
            }
        });
    });
}

// 處理終止信號
process.on("SIGINT", gracefulShutdown); // e.g. Ctrl+C
process.on("SIGTERM", gracefulShutdown); // e.g. 由 kill 命令發出

startServer();
