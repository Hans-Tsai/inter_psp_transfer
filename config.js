"use strict";

// Load environment variables from the `.env` file.
require("dotenv").config();

module.exports = {
    // Current Environment
    env: process.env.NODE_ENV || "development",
    // Backend Server
    server: {
        origin: process.env.SERVER_ORIGIN || "http://127.0.0.1",
        port: process.env.PORT || 3000,
        jwt_secret: process.env.JWT_SECRET || 'fido_uaf',
    },
    // Database: MySQL Server
    db: {
        host: process.env.DB_HOST || "localhost",
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "root12345",
        name: process.env.DB_NAME || "fido_uaf",
    },
    ngrok: {
        enabled: process.env.NODE_ENV !== "production",
        port: process.env.PORT || 3000,
        subdomain: process.env.NGROK_SUBDOMAIN,
        authtoken: process.env.NGROK_AUTHTOKEN,
    },
};
