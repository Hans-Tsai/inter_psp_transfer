require('dotenv').config()
const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// JKO Pay
app.get('/jko_pay', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'jko_pay', 'index.html'));
});

app.get('/jko_pay/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'jko_pay', 'login.html'));
});

app.get('/jko_pay/authentication', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'jko_pay', 'authentication.html'));
});

app.get('/jko_pay/transfer', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'jko_pay', 'transfer.html'));
});

// Line Pay
app.get('/line_pay', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'line_pay', 'index.html'));
});

app.get('/line_pay/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'line_pay', 'login.html'));
});

app.get('/line_pay/authentication', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'line_pay', 'authentication.html'));
});

app.get('/line_pay/transfer', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'line_pay', 'transfer.html'));
});

// 電子支付跨機構共用平台
app.get('/platform', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'platform', 'index.html'));
});

app.get('/platform/code', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'platform', 'code.html'));
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});