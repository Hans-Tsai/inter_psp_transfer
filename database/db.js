const NODE_ENV = process.env.NODE_ENV || "development";
// 連線到 MySQL 資料庫
const knexConfig = require("../knexfile")[NODE_ENV];
const knex = require("knex")(knexConfig);

// 初始化資料庫
const databaseName = "fido_uaf";
knex.raw(`CREATE DATABASE IF NOT EXISTS ??`, [databaseName])
    .then(() => {
        // console.log(`Database ${databaseName} is created`);
    })
    .catch((err) => {
        console.error("Error creating database:", err);
    });

module.exports = knex;