const path = require("path");
const url = require("url");
const util = require("util");
const fs = require("fs");
const http = require("http");
const https = require("https");
const { config } = require("./config");
const router = require("./routes/router");
const cookieParser = require("cookie-parser");
const express = require("express");

const app = express();
const knex = require("./database/db");
const redis = require("./database/redis/redis");

let server;
let expectedOrigin = "";
// 指定 view engine 為 `ejs` 模板引擎
app.set("view engine", "ejs");

/** 中介函數 (middleware) */
// 設定 express app 的靜態資料夾為 `./public/`
app.use(express.static("public"));
// 將 API request 夾帶的 JSON 資料"解析"成 Javascript 的物件 (object) 形式，並將其儲存到 `req.body` 屬性中
app.use(express.json());
// 將 API request 夾帶的 `cookie` 中的 `cookie header` 資料"解析"成 Javascript 的物件 (object) 形式，並將其儲存到 `req.cookies` 的屬性中
app.use(cookieParser());

// Demo 首頁
app.get("/", (req, res) => {
    res.render("index");
});

// 設定路由器
app.use(router);

async function startServer() {
    if (config.enable_https) {
        const host = "0.0.0.0";
        const port = 443;
        expectedOrigin = `https://${config.rp.id}`;

        server = https
            .createServer(
                {
                    key: fs.readFileSync("./key.pem"),
                    cert: fs.readFileSync("./cert.pem"),
                },
                app
            )
            .listen(port, host, () => {
                console.log(`🚀 Server ready at ${expectedOrigin} (${host}:${port})`);
            });
        
        // 更新 config 內容
        config.server.origin = expectedOrigin;
        config.rp.origin = expectedOrigin;
    } else {
        const host = "127.0.0.1";
        const port = 8000;
        expectedOrigin = `http://localhost:${port}`;

        server = http.createServer(app).listen(port, host, () => {
            console.log(`🚀 Server ready at ${expectedOrigin} (${host}:${port})`);
        });

        // 更新 config 內容
        config.server.origin = expectedOrigin;
        config.rp.origin = expectedOrigin;
    }
}

async function gracefulShutdown() {
    try {
        await redis.closeConnection();
        console.log("");
        console.log(util.inspect("Redis client is disconnected.", { colors: true }));

        await knex.destroy();
        console.log(util.inspect("Knex database connection is disconnected.", { colors: true }));

        server.close(() => {
            console.log(util.inspect("The application server is gracefully terminated.", { colors: true }));
            process.exit(0); // Success
        });
    } catch (err) {
        console.error("Error during shutdown:", err.message);
        process.exit(1); // Error
    }
}

// 處理終止信號
process.on("SIGINT", () => {
    gracefulShutdown();
}); // e.g. Ctrl+C

process.on("SIGTERM", () => {
    gracefulShutdown();
}); // e.g. 由 kill 命令發出

startServer();
