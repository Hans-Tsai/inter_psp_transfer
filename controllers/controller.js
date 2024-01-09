const path = require('path');
const knex = require('../database/db');

//#region 
// 電子支付跨機構共用平台
const platform_get = (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'platform', 'index.html'));
};

const platform_code_get = (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'platform', 'code.html'));
};

//#endregion

//#region 
// Line Pay
const line_pay_get = (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'line_pay', 'index.html'));
};

const line_pay_login_get = (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'line_pay', 'login.html'));
};

const line_pay_authentication_get = (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'line_pay', 'authentication.html'));
};

const line_pay_transfer_get = (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'line_pay', 'transfer.html'));
};

//#endregion

//#region 
// JKO Pay
const jko_pay_get = (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'jko_pay', 'index.html'));
};

const jko_pay_login_get = (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'jko_pay', 'login.html'));
};

const jko_pay_authentication_get = (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'jko_pay', 'authentication.html'));
};

const jko_pay_transfer_get = (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'jko_pay', 'transfer.html'));
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
  jko_pay_transfer_get
};