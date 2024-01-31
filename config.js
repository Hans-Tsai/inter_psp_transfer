// Load environment variables from the `.env` file.
require("dotenv").config();
const ngrok = require("ngrok");
const { URL } = require("url");

// 初始設定
let config = {
    // Current Environment
    env: process.env.NODE_ENV || "development",
    // Backend Server
    server: {
        origin: process.env.SERVER_ORIGIN || "http://127.0.0.1",
        port: process.env.PORT || 3000,
        jwt_secret: process.env.JWT_SECRET || "fido_uaf",
    },
    ngrok: {
        enabled: process.env.NODE_ENV !== "production",
        url: process.env.NGROK_URL || '',
        port: process.env.PORT || 3000,
        // subdomain: process.env.NGROK_SUBDOMAIN,
        authtoken: process.env.NGROK_AUTHTOKEN || '2O0r0kPDqq1qGfLtAZDxcWKt3I0_7jVmHhnvGBKoZHLc9uqQV',
    },
    // Relying Party Server (RP)
    rp: {
        origin: process.env.RP_ORIGIN,
        name: process.env.RP_NAME || 'myRP',
        id: process.env.RP_ID,
    },
    // Database: MySQL Server
    db: {
        host: process.env.DB_HOST || "localhost",
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "root12345",
        name: process.env.DB_NAME || "fido_uaf",
    },
    // Database: Redis Server
    redis: {
        host: process.env.REDIS_HOST || "localhost",
        port: process.env.REDIS_PORT || 6379,
        username: process.env.REDIS_USERNAME || "root",
        password: process.env.REDIS_PASSWORD || "root12345",
    },
};

let resolveConfigUpdate;
const configUpdated = new Promise((resolve) => {
    resolveConfigUpdate = resolve;
});

async function startNgrok() {
    const ngrokUrl = await ngrok.connect({
        addr: config.server.port,
        // subdomain: config.ngrok.subdomain,
        authtoken: config.ngrok.authtoken,
    });
    const ngrokUrlObj = new URL(ngrokUrl);

    // 將 ngrok URL 更新到 config 的值
    config.server.origin = ngrokUrl;
    config.ngrok.url = ngrokUrl;
    config.rp.origin = ngrokUrl;
    config.rp.id = ngrokUrlObj.hostname; // RP ID 應該是一個有效的網域名稱，所以我們使用主機名稱

     // 解析 configUpdated Promise
     resolveConfigUpdate();
}

module.exports = {
    config,
    startNgrok,
    configUpdated
};
