const express = require('express');
const router = express.Router();


// 電子支付跨機構共用平台
router.get('/platform', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'platform', 'index.html'));
});

router.get('/platform/code', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'platform', 'code.html'));
});

// JKO Pay
router.get('/jko_pay', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'jko_pay', 'index.html'));
});

router.get('/jko_pay/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'jko_pay', 'login.html'));
});

router.get('/jko_pay/authentication', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'jko_pay', 'authentication.html'));
});

router.get('/jko_pay/transfer', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'jko_pay', 'transfer.html'));
});

// Line Pay
router.get('/line_pay', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'line_pay', 'index.html'));
});

router.get('/line_pay/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'line_pay', 'login.html'));
});

router.get('/line_pay/authentication', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'line_pay', 'authentication.html'));
});

router.get('/line_pay/transfer', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'line_pay', 'transfer.html'));
});

module.exports = router;