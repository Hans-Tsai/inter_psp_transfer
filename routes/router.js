const express = require('express');
const controller = require('../controllers/controller');
const router = express.Router();
const { requireAuth, checkUser } = require('../middlewares/authmiddleware');

// 電子支付跨機構共用平台
router.get('/platform', controller.platform_get);
router.get('/platform/code', controller.platform_code_get);

// Line Pay
router.get('/line_pay', requireAuth, checkUser, controller.line_pay_get);
router.get('/line_pay/attestation', controller.line_pay_attestation_get);
router.post('/line_pay/attestation/options', controller.line_pay_attestation_options_post);
router.post('/line_pay/attestation/result', controller.line_pay_attestation_result_post);
router.post('/line_pay/assertion/options', controller.line_pay_assertion_options_post);
router.post('/line_pay/assertion/result', controller.line_pay_assertion_result_post);
router.get('/line_pay/register', controller.line_pay_register_get);
router.post('/line_pay/register', controller.line_pay_register_post);
router.get('/line_pay/login', controller.line_pay_login_get);
router.post('/line_pay/login', controller.line_pay_login_post);
router.get('/line_pay/logout', controller.line_pay_logout_get);
router.get('/line_pay/deposit', requireAuth, checkUser, controller.line_pay_deposit_get);
router.post('/line_pay/deposit', requireAuth, checkUser, controller.line_pay_deposit_post);
router.get('/line_pay/withdraw', requireAuth, checkUser, controller.line_pay_withdraw_get);
router.post('/line_pay/withdraw', requireAuth, checkUser, controller.line_pay_withdraw_post);
router.get('/line_pay/authentication', requireAuth, checkUser, controller.line_pay_authentication_get);
router.get('/line_pay/transfer', requireAuth, checkUser, controller.line_pay_transfer_get);
router.post('/line_pay/transfer', requireAuth, checkUser, controller.line_pay_transfer_post);
router.get('/line_pay/inter_agency_transfer', requireAuth, checkUser, controller.line_pay_inter_agency_transfer_get);
router.post('/line_pay/inter_agency_transfer', requireAuth, checkUser, controller.line_pay_inter_agency_transfer_post);

// JKO Pay
router.get('/jko_pay', requireAuth, checkUser, controller.jko_pay_get);
router.get('/jko_pay/login', controller.jko_pay_login_get);
router.post('/jko_pay/login', controller.jko_pay_login_post);
router.get('/jko_pay/authentication', requireAuth, checkUser, controller.jko_pay_authentication_get);
router.get('/jko_pay/transfer', requireAuth, checkUser, controller.jko_pay_transfer_get);

module.exports = router;