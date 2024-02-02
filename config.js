// Load environment variables from the `.env` file.
require("dotenv").config();
const ngrok = require("ngrok");
const { URL } = require("url");
const fs = require("fs");
const https = require("https");

// 初始設定
let config = {
    // Current Environment
    env: process.env.NODE_ENV || "development",
    // Enable HTTPS
    enable_https: process.env.ENABLE_HTTPS || false,
    // Backend Server
    server: {
        protocol: process.env.ENABLE_HTTPS ? "https:" : "http:",
        hostname: process.env.ENABLE_HTTPS ? "0.0.0.0" : "127.0.0.1",
        port: process.env.PORT || 8000,
        origin: "",
        jwt_secret: process.env.JWT_SECRET || "fido_uaf",
    },
    // Relying Party Server (RP)
    rp: {
        name: process.env.RP_NAME || "myRP",
        protocol: process.env.ENABLE_HTTPS ? "https:" : "http:",
        // RP ID 應該是一個有效的網域名稱，所以我們使用主機名稱 (hostname)
        id: process.env.RP_ID || "localhost",
        origin: "",
    },
    // Database: MySQL Server
    db: {
        host: process.env.DB_HOST || "127.0.0.1",
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "root12345",
        name: process.env.DB_NAME || "fido_uaf",
    },
    // Database: Redis Server
    redis: {
        host: process.env.REDIS_HOST || "127.0.0.1",
        port: process.env.REDIS_PORT || 6379,
        username: process.env.REDIS_USERNAME || "root",
        password: process.env.REDIS_PASSWORD || "root12345",
    },
};

config.server.origin = `${config.server.protocol}//${config.server.hostname}`;
config.rp.origin = `${config.rp.protocol}//${config.rp.id}`;

module.exports = { config };
