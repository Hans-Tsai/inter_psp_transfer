const express = require('express');
const controller = require('../controllers/controller');
const router = express.Router();

// 電子支付跨機構共用平台
router.get('/platform', controller.platform_get);
router.get('/platform/code', controller.platform_code_get);

// Line Pay
router.get('/line_pay', controller.line_pay_get);
router.get('/line_pay/login', controller.line_pay_login_get);
router.get('/line_pay/authentication', controller.line_pay_authentication_get);
router.get('/line_pay/transfer', controller.line_pay_transfer_get);

// JKO Pay
router.get('/jko_pay', controller.jko_pay_get);
router.get('/jko_pay/login', controller.jko_pay_login_get);
router.get('/jko_pay/authentication', controller.jko_pay_authentication_get);
router.get('/jko_pay/transfer', controller.jko_pay_transfer_get);

module.exports = router;