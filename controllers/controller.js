const path = require("path");
const knex = require("../database/db");

//#region
// 電子支付跨機構共用平台
const platform_get = (req, res) => {
    res.sendFile(path.join(__dirname, "..", "views", "platform", "index.ejs"));
};

const platform_code_get = (req, res) => {
    knex.select("*")
        .from("platform")
        .then((data) => {
            res.render("platform/code", { data });
        })
        .catch((err) => {
            console.error("Error:", err);
        });
};

//#endregion

//#region
// Line Pay
const line_pay_get = (req, res) => {
    res.sendFile(path.join(__dirname, "..", "views", "line_pay", "index.ejs"));
};

const line_pay_login_get = (req, res) => {
    res.render("line_pay/login");
};

const line_pay_authentication_get = (req, res) => {
    res.sendFile(
        path.join(__dirname, "..", "views", "line_pay", "authentication.ejs")
    );
};

const line_pay_transfer_get = (req, res) => {
    res.sendFile(
        path.join(__dirname, "..", "views", "line_pay", "transfer.ejs")
    );
};

//#endregion

//#region
// JKO Pay
const jko_pay_get = (req, res) => {
    res.sendFile(path.join(__dirname, "..", "views", "jko_pay", "index.ejs"));
};

const jko_pay_login_get = (req, res) => {
  res.render("jko_pay/login");
};

const jko_pay_authentication_get = (req, res) => {
    res.sendFile(
        path.join(__dirname, "..", "views", "jko_pay", "authentication.ejs")
    );
};

const jko_pay_transfer_get = (req, res) => {
    res.sendFile(
        path.join(__dirname, "..", "views", "jko_pay", "transfer.ejs")
    );
};

//#endregion

module.exports = {
    platform_get,
    platform_code_get,
    line_pay_get,
    line_pay_login_get,
    line_pay_authentication_get,
    line_pay_transfer_get,
    jko_pay_get,
    jko_pay_login_get,
    jko_pay_authentication_get,
    jko_pay_transfer_get,
};
