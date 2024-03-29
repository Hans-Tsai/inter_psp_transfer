const { config } = require("../config");
const jwt = require("jsonwebtoken");
const base64url = require("base64url");
const knex = require("../database/db");
const redis = require("../database/redis/redis");
const PlatformModel = require("../models/PlatformModel");
const LinePayModel = require("../models/LinePayModel");
const JkoPayModel = require("../models/JkoPayModel");
const CredentialModel = require("../models/CredentialModel");
const AuthenticatorModel = require("../models/AuthenticatorModel");
const FV_CredentialModel = require("../models/FV_CredentialModel");
const FV_AuthenticatorModel = require("../models/FV_AuthenticatorModel");
const utils = require("../modules/webauthn/utils");
const SimpleWebAuthnServer = require("@simplewebauthn/server");

let rpName, rpID, origin;
// 宣告相關參數
// Human-readable title for your website
rpName = config.rp.name;
// A unique identifier for your website
rpID = config.rp.id;
// The URL at which registrations and authentications should occur
origin = config.rp.origin;
// console.dir(config, { depth: 10 });

//#region 工具函式
// TODO: 建立一個用來專門產生錯誤事件的物件(=> error object)的錯誤事件處理函數
const handleErrors = (err) => {
    // err.message: 錯誤事件的訊息，err.code: 錯誤事件的編號
    let error = { account: "", password: "", message: err.message };

    // account 驗證錯誤
    if (err.message === "incorrect account") error.account = "That account isn't registered.";
    // password 驗證錯誤
    if (err.message === "incorrect password") error.password = "That password is incorrect";

    // TODO: MySQL: duplicate key error
    // if (err.code === 11000) {
    //   error['account'] = 'that account is already registered';
    //   return error;
    // }

    // TODO: validation error
    // if (err.message.includes('user validation failed')) {
    //   Object.values(err.error).forEach(properties => {
    //     error[properties.path] = properties.message;
    //   })
    // }

    return error;
};

/** 建立一個用來產生 JWT token 的函數
 * @returns 回傳一個帶有簽章(signature)的 JWT token
 */
// JWT token 的有效期間長度，`jwt.sign()` 是以秒為單位
const maxValidDuration = 3 * 24 * 60 * 60; // 3 days
const createToken = (account, institution_code) => {
    return jwt.sign({ account, institution_code }, config.server.jwt_secret, {
        expiresIn: maxValidDuration,
    });
};

//#endregion

//#region
// 電子支付跨機構共用平台
const platform_get = (req, res) => {
    res.render("platform/index");
};

const platform_code_get = async (req, res) => {
    try {
        const data = await PlatformModel.getPlatformInfo();
        res.render("platform/code", { data });
    } catch (err) {
        const error = handleErrors(err);
        res.status(400).json(error);
    }
};

//#endregion

//#region
// Line Pay
const line_pay_get = (req, res) => {
    res.render("line_pay/index");
};

const line_pay_attestation_get = (req, res) => {
    res.render("line_pay/fido_attestation");
};

const line_pay_attestation_options_post = async (req, res) => {
    try {
        let { username, user_verification, attestation, attachment, algorithms, discoverable_credential, hints } =
            req.body;
        const account = await LinePayModel.generateAccount();
        const userAuthenticators = await AuthenticatorModel.getUserAuthenticators({
            institution_code: 391,
            account,
        });
        let residentKey = "";
        switch (discoverable_credential) {
            case "discouraged":
                residentKey = "discouraged";
                break;
            case "preferred":
                residentKey = "preferred";
                break;
            case "required":
                residentKey = "required";
                break;
            default:
                residentKey = "preferred";
                break;
        }
        if (hints.length > 0) {
            hints = [hints][0].split(",");
            if (hints[0] === "security-key" || hints[0] === "hybrid") {
                attachment = "cross-platform";
            } else if (hints[0] === "client-device") {
                attachment = "platform";
            }
        } else {
            attachment = undefined;
        }

        const options = await SimpleWebAuthnServer.generateRegistrationOptions({
            rpName,
            rpID,
            userID: account,
            userName: username,
            // Don't prompt users for additional information about the authenticator
            // (Recommended for smoother UX)
            attestationType: attestation,
            // Prevent users from re-registering existing authenticators
            excludeCredentials: userAuthenticators.map((authenticator) => ({
                id: base64url.toBuffer(authenticator.credentialID),
                type: "public-key",
                // Optional
                transports: authenticator.transports,
            })),
            // See "Guiding use of authenticators via authenticatorSelection" below
            authenticatorSelection: {
                // Defaults
                residentKey,
                userVerification: user_verification,
                // Optional
                authenticatorAttachment: attachment,
            },
            supportedAlgorithmIDs: algorithms,
        });
        await redis.db0.setUserCurrentChallenge(redis.client, account, options.challenge);

        res.status(200).json(options);
    } catch (err) {
        const error = handleErrors(err);
        res.status(400).json(error);
    }
};

const line_pay_attestation_result_post = async (req, res) => {
    try {
        const { attResp, account, username } = req.body;
        const expectedChallenge = await redis.db0.getUserCurrentChallenge(redis.client, account);
        let verification;
        verification = await SimpleWebAuthnServer.verifyRegistrationResponse({
            response: attResp,
            expectedChallenge,
            expectedOrigin: origin,
            expectedRPID: rpID,
        });
        const { verified } = verification;
        if (verified) {
            const { registrationInfo } = verification;
            const { credentialPublicKey, credentialID, counter, credentialDeviceType, credentialBackedUp } =
                registrationInfo;
            const base64urlCredentialID = base64url.encode(credentialID);
            const base64urlCredentialPublicKey = base64url.encode(credentialPublicKey);
            try {
                await knex.transaction(async (trx) => {
                    await trx("credential").insert({
                        id: base64urlCredentialID,
                        institution_code: 391,
                        account,
                    });
                    await trx("authenticator").insert({
                        credentialID: base64urlCredentialID,
                        institution_code: 391,
                        account,
                        credentialPublicKey: base64urlCredentialPublicKey,
                        counter,
                        credentialDeviceType,
                        credentialBackedUp,
                        transports: JSON.stringify(attResp.response.transports),
                    });
                    await trx("line_pay").insert({
                        institution_code: 391,
                        account,
                        name: username,
                    });
                });
            } catch (transactionError) {
                // 處理事務錯誤
                console.error(transactionError);
            }
        } else {
            throw new Error("Verify registration response failed");
        }

        res.status(200).json({ verified });
    } catch (err) {
        const error = handleErrors(err);
        res.status(400).json(error);
    }
};

const line_pay_assertion_get = (req, res) => {
    res.render("line_pay/fido_assertion");
};

const line_pay_assertion_options_post = async (req, res) => {
    try {
        const { username, userVerification } = req.body;
        const userInfo = await LinePayModel.getUserInfo({ name: username });
        const account = userInfo.account;
        const userAuthenticators = await AuthenticatorModel.getUserAuthenticators({
            institution_code: 391,
            account,
        });
        const options = await SimpleWebAuthnServer.generateAuthenticationOptions({
            rpID,
            userVerification,
            // Require users to use a previously-registered authenticator
            allowCredentials: userAuthenticators.map((authenticator) => ({
                id: base64url.toBuffer(authenticator.credentialID),
                type: "public-key",
                transports: authenticator.transports,
            })),
        });
        await redis.db1.setUserCurrentChallenge(redis.client, account, options.challenge);

        res.status(200).json(options);
    } catch (err) {
        const error = handleErrors(err);
        res.status(400).json(error);
    }
};

const line_pay_assertion_result_post = async (req, res) => {
    try {
        const { asseResp, username } = req.body;
        const userInfo = await LinePayModel.getUserInfo({ name: username });
        const account = userInfo.account;
        const expectedChallenge = await redis.db1.getUserCurrentChallenge(redis.client, account);
        let authenticator = await AuthenticatorModel.getUserAuthenticator({
            institution_code: 391,
            account,
            credentialID: asseResp.id,
        });
        if (!authenticator) throw new Error(`Could not find authenticator ${asseResp.id} for user ${account}`);
        authenticator.credentialID = base64url.toBuffer(authenticator.credentialID);
        authenticator.credentialPublicKey = base64url.toBuffer(authenticator.credentialPublicKey);

        let verification;
        verification = await SimpleWebAuthnServer.verifyAuthenticationResponse({
            response: asseResp,
            expectedChallenge,
            expectedOrigin: origin,
            expectedRPID: rpID,
            authenticator,
        });
        const { verified } = verification;
        const { authenticationInfo } = verification;
        const { newCounter } = authenticationInfo;
        await AuthenticatorModel.updatedAuthenticatorCounter({ credentialID: asseResp.id, newCounter });
        let institutionCode = 391;
        const jwtToken = createToken(account, institutionCode);
        res.cookie("jwt", jwtToken, {
            httpOnly: true,
            maxAge: maxValidDuration * 1000, // 以毫秒為單位
        });
        let fvToken = "";
        if (userInfo.isFinancialVerified) {
            fvToken = createToken(account, institutionCode);
            res.cookie("fvToken", fvToken, {
                httpOnly: true,
                maxAge: maxValidDuration * 1000, // 以毫秒為單位
            });
        }

        res.status(200).json({ verified });
    } catch (err) {
        const error = handleErrors(err);
        res.status(400).json(error);
    }
};

const line_pay_register_get = (req, res) => {
    res.render("line_pay/register");
};

const line_pay_register_post = async (req, res) => {
    const { account, password, username } = req.body;
    const institutionCode = req.query["institution_code"];
    try {
        await LinePayModel.createUser({
            account,
            password,
            username,
        });
        const user = await LinePayModel.getUserInfo(account);
        const jwtToken = createToken(account, institutionCode);
        res.cookie("jwt", jwtToken, {
            httpOnly: true,
            maxAge: maxValidDuration * 1000, // 以毫秒為單位
        });

        res.status(200).json(user);
    } catch (err) {
        const error = handleErrors(err);
        res.status(400).json(error);
    }
};

const line_pay_login_get = (req, res) => {
    res.render("line_pay/login");
};

const line_pay_login_post = async (req, res) => {
    // 透過 express.json() 將 `POST` request 夾帶的 JSON 資料解析成 Javascript 的物件形式後，儲存到該 POST RESTful API 的 `request.body`
    const { account, password } = req.body;
    const institutionCode = req.query["institution_code"];
    try {
        const data = await LinePayModel.login({ account, password });
        // 產生一個帶有簽章(signature)的 JWT token
        const jwtToken = createToken(account, institutionCode);
        // 將這個 JWT token 儲存到 response 物件的 cookie 中
        res.cookie("jwt", jwtToken, {
            // 設定只能給 Web Server 的發送 http(s) request 的時候才能使用，以防止客戶端透過 javascript 來竄改此 JWT token
            httpOnly: true,
            maxAge: maxValidDuration * 1000, // 以毫秒為單位
        });

        res.status(200).json(data);
    } catch (err) {
        const error = handleErrors(err);
        res.status(400).json(error);
    }
};

const line_pay_logout_get = (req, res) => {
    // 將要回傳給客戶端的 response 物件中的 `cookie` 設定為空值
    res.cookie("jwt", "", { maxAge: 1 });
    res.redirect("/");
};

const line_pay_deposit_get = (req, res) => {
    res.render("line_pay/deposit");
};

const line_pay_deposit_post = async (req, res) => {
    const { account, balance, amount } = req.body;
    try {
        if (Number(amount) <= 0) throw new Error("儲值金額必須大於 0");
        if (!Number.isInteger(Number(amount))) throw new Error("儲值金額必須是整數");
        await LinePayModel.deposit({ account, amount });
        const user = await LinePayModel.getUserInfo(account);
        // 儲值前的餘額 ＋ 儲值金額 ＝ 儲值後的餘額
        if (Number(balance) + Number(amount) != user.balance) throw new Error("儲值失敗");

        res.status(200).json(user);
    } catch (err) {
        const error = handleErrors(err);
        res.status(400).json(error);
    }
};

const line_pay_withdraw_get = (req, res) => {
    res.render("line_pay/withdraw");
};
const line_pay_withdraw_post = async (req, res) => {
    const { account, balance, amount } = req.body;
    try {
        if (Number(amount) <= 0) throw new Error("提領金額必須大於 0");
        if (!Number.isInteger(Number(amount))) throw new Error("儲值金額必須是整數");
        if (Number(amount) > Number(balance)) throw new Error("餘額不足");
        await LinePayModel.withdraw({ account, amount });
        const user = await LinePayModel.getUserInfo(account);
        // 提領前的餘額 － 提領金額 ＝ 提領後的餘額
        if (Number(balance) - Number(amount) != user.balance) throw new Error("提領失敗");

        res.status(200).json(user);
    } catch (err) {
        const error = handleErrors(err);
        res.status(400).json(error);
    }
};

const line_pay_financial_verification_get = (req, res) => {
    res.render("line_pay/financial_verification/index");
};

const line_pay_financial_verification_attestation_get = (req, res) => {
    res.render("line_pay/financial_verification/fido_attestation");
};

const line_pay_financial_verification_attestation_options_post = async (req, res) => {
    try {
        let { username, user_verification, attestation, attachment, algorithms, discoverable_credential, hints } =
            req.body;
        const userInfo = await LinePayModel.getUserInfo({ name: username });
        const account = userInfo.account;
        const userFVAuthenticators = await FV_AuthenticatorModel.getUserAuthenticators({
            institution_code: 391,
            account,
        });
        let residentKey = "";
        switch (discoverable_credential) {
            case "discouraged":
                residentKey = "discouraged";
                break;
            case "preferred":
                residentKey = "preferred";
                break;
            case "required":
                residentKey = "required";
                break;
            default:
                residentKey = "preferred";
                break;
        }
        if (hints.length > 0) {
            hints = [hints][0].split(",");
            if (hints[0] === "security-key" || hints[0] === "hybrid") {
                attachment = "cross-platform";
            } else if (hints[0] === "client-device") {
                attachment = "platform";
            }
        } else {
            attachment = undefined;
        }

        const options = await SimpleWebAuthnServer.generateRegistrationOptions({
            rpName,
            rpID,
            userID: account,
            userName: username,
            // Don't prompt users for additional information about the authenticator
            // (Recommended for smoother UX)
            attestationType: attestation,
            // Prevent users from re-registering existing authenticators
            excludeCredentials: userFVAuthenticators.map((fv_authenticator) => ({
                id: base64url.toBuffer(fv_authenticator.fv_credentialID),
                type: "public-key",
                // Optional
                transports: fv_authenticator.transports,
            })),
            // See "Guiding use of authenticators via authenticatorSelection" below
            authenticatorSelection: {
                // Defaults
                residentKey,
                userVerification: user_verification,
                // Optional
                authenticatorAttachment: attachment,
            },
            supportedAlgorithmIDs: algorithms,
        });
        await redis.db2.setUserCurrentChallenge(redis.client, account, options.challenge);

        res.status(200).json(options);
    } catch (err) {
        const error = handleErrors(err);
        res.status(400).json(error);
    }
};

const line_pay_financial_verification_attestation_result_post = async (req, res) => {
    try {
        const { attResp, account, username } = req.body;
        const expectedChallenge = await redis.db2.getUserCurrentChallenge(redis.client, account);
        let verification;
        verification = await SimpleWebAuthnServer.verifyRegistrationResponse({
            response: attResp,
            expectedChallenge,
            expectedOrigin: origin,
            expectedRPID: rpID,
        });
        const { verified } = verification;
        if (verified) {
            const { registrationInfo } = verification;
            const { credentialPublicKey, credentialID, counter, credentialDeviceType, credentialBackedUp } =
                registrationInfo;
            const base64url_FV_CredentialID = base64url.encode(credentialID);
            const base64url_FV_CredentialPublicKey = base64url.encode(credentialPublicKey);
            try {
                await knex.transaction(async (trx) => {
                    await trx("fv_credential").insert({
                        id: base64url_FV_CredentialID,
                        institution_code: 391,
                        account,
                    });
                    await trx("fv_authenticator").insert({
                        fv_credentialID: base64url_FV_CredentialID,
                        institution_code: 391,
                        account,
                        fv_credentialPublicKey: base64url_FV_CredentialPublicKey,
                        counter,
                        credentialDeviceType,
                        credentialBackedUp,
                        transports: JSON.stringify(attResp.response.transports),
                    });
                    await trx("line_pay")
                        .where({
                            institution_code: 391,
                            account,
                        })
                        .update({
                            isFinancialVerified: true,
                        });
                });
            } catch (transactionError) {
                // 處理事務錯誤
                console.error(transactionError);
            }
        } else {
            throw new Error("Verify registration response failed");
        }

        res.status(200).json({ verified });
    } catch (err) {
        const error = handleErrors(err);
        res.status(400).json(error);
    }
};

const line_pay_financial_verification_assertion_get = (req, res) => {
    res.render("line_pay/financial_verification/fido_assertion");
};

const line_pay_financial_verification_assertion_options_post = async (req, res) => {
    try {
        const { username, userVerification } = req.body;
        const userInfo = await LinePayModel.getUserInfo({ name: username });
        const account = userInfo.account;
        const userFVAuthenticators = await FV_AuthenticatorModel.getUserAuthenticators({
            institution_code: 391,
            account,
        });
        const options = await SimpleWebAuthnServer.generateAuthenticationOptions({
            rpID,
            userVerification,
            // Require users to use a previously-registered authenticator
            allowCredentials: userFVAuthenticators.map((fv_authenticator) => ({
                id: base64url.toBuffer(fv_authenticator.fv_credentialID),
                type: "public-key",
                transports: fv_authenticator.transports,
            })),
        });
        await redis.db3.setUserCurrentChallenge(redis.client, account, options.challenge);

        res.status(200).json(options);
    } catch (err) {
        const error = handleErrors(err);
        res.status(400).json(error);
    }
};

const line_pay_financial_verification_assertion_result_post = async (req, res) => {
    try {
        const { asseResp, username } = req.body;
        const userInfo = await LinePayModel.getUserInfo({ name: username });
        const account = userInfo.account;
        const expectedChallenge = await redis.db3.getUserCurrentChallenge(redis.client, account);
        let fv_authenticator = await FV_AuthenticatorModel.getUserAuthenticator({
            institution_code: 391,
            account,
            fv_credentialID: asseResp.id,
        });
        if (!fv_authenticator) throw new Error(`Could not find fv_authenticator ${asseResp.id} for user ${account}`);
        // 為了接下來要傳給 SimpleWebAuthnServer.verifyAuthenticationResponse() 的參數做準備，必須遵守 `fv_authenticator` 的資料格式
        fv_authenticator.credentialID = base64url.toBuffer(fv_authenticator.fv_credentialID);
        fv_authenticator.credentialPublicKey = base64url.toBuffer(fv_authenticator.fv_credentialPublicKey);
        delete fv_authenticator.fv_credentialID;
        delete fv_authenticator.fv_credentialPublicKey;

        let verification;
        verification = await SimpleWebAuthnServer.verifyAuthenticationResponse({
            response: asseResp,
            expectedChallenge,
            expectedOrigin: origin,
            expectedRPID: rpID,
            authenticator: fv_authenticator,
        });
        const { verified } = verification;
        const { authenticationInfo } = verification;
        const { newCounter } = authenticationInfo;
        await FV_AuthenticatorModel.updatedAuthenticatorCounter({ fv_credentialID: asseResp.id, newCounter });
        let institutionCode = 391;
        const fvToken = createToken(account, institutionCode);
        res.cookie("fvToken", fvToken, {
            httpOnly: true,
            maxAge: maxValidDuration * 1000, // 以毫秒為單位
        });

        res.status(200).json({ verified });
    } catch (err) {
        const error = handleErrors(err);
        res.status(400).json(error);
    }
};

const line_pay_transfer_get = (req, res) => {
    knex.select("account", "name")
        .from("line_pay")
        .orderBy("account", "asc")
        .then((data) => {
            res.render("line_pay/transfer", { data });
        })
        .catch((err) => {
            const error = handleErrors(err);
            res.status(400).json(error);
        });
};

const line_pay_transfer_post = async (req, res) => {
    const { account, balance, recipientAccount, amount, note } = req.body;
    try {
        if (Number(amount) <= 0) throw new Error("轉帳金額必須大於 0");
        if (!Number.isInteger(Number(amount))) throw new Error("轉帳金額必須是整數");
        if (Number(amount) > Number(balance)) throw new Error("餘額不足");
        if (Number(account) === Number(recipientAccount)) throw new Error("不能轉帳給自己");

        // 經過轉帳後，兩個用戶的餘額都會改變，因此必須使用交易(transaction)來確保兩個用戶的餘額都會改變
        await LinePayModel.transfer({ account, recipientAccount, amount, note });

        res.sendStatus(200);
    } catch (err) {
        const error = handleErrors(err);
        res.status(400).json(error);
    }
};

const line_pay_inter_agency_transfer_get = (req, res) => {
    knex.select("institution_code", "institution_name", "table")
        .from("platform")
        .orderBy("institution_code", "asc")
        .then((data) => {
            res.render("line_pay/inter_agency_transfer", { data });
        })
        .catch((err) => {
            const error = handleErrors(err);
            res.status(400).json(error);
        });
};

const line_pay_inter_agency_transfer_post = async (req, res) => {
    const { account, balance, recipientInstitutionCode, recipientAccount, amount, note } = req.body;
    try {
        if (Number(amount) <= 0) throw new Error("轉帳金額必須大於 0");
        if (!Number.isInteger(Number(amount))) throw new Error("轉帳金額必須是整數");
        if (Number(amount) > Number(balance)) throw new Error("餘額不足");
        if (Number(recipientInstitutionCode) === 391 && Number(account) === Number(recipientAccount))
            throw new Error("不能轉帳給自己");

        // 經過轉帳後，兩個用戶的餘額都會改變，因此必須使用交易(transaction)來確保兩個用戶的餘額都會改變
        await LinePayModel.interAgencyTransfer({ account, recipientInstitutionCode, recipientAccount, amount, note });

        res.sendStatus(200);
    } catch (err) {
        const error = handleErrors(err);
        res.status(400).json(error);
    }
};

//#endregion

//#region
// JKO Pay
const jko_pay_get = (req, res) => {
    res.render("jko_pay/index");
};

const jko_pay_login_get = (req, res) => {
    res.render("jko_pay/login");
};

const jko_pay_login_post = (req, res) => {
    // 透過 express.json() 將 `POST` request 夾帶的 JSON 資料解析成 Javascript 的物件形式後，儲存到該 POST RESTful API 的 `request.body`
    const { account, password } = req.body;
    knex("jko_pay")
        .select("account", "password")
        .where("account", account)
        .then((data) => {
            // console.log(data);
            if (account === data[0].account && password === data[0].password) {
                res.status(200).json(data);
            }
        })
        .catch((err) => {
            const error = handleErrors(err);
            res.status(400).json(error);
        });
};

const jko_pay_authentication_get = (req, res) => {
    res.render("jko_pay/authentication");
};

const jko_pay_transfer_get = (req, res) => {
    res.render("jko_pay/transfer");
};

//#endregion

module.exports = {
    platform_get,
    platform_code_get,
    line_pay_get,
    line_pay_attestation_get,
    line_pay_attestation_options_post,
    line_pay_attestation_result_post,
    line_pay_assertion_get,
    line_pay_assertion_options_post,
    line_pay_assertion_result_post,
    line_pay_register_get,
    line_pay_register_post,
    line_pay_login_get,
    line_pay_login_post,
    line_pay_logout_get,
    line_pay_deposit_get,
    line_pay_deposit_post,
    line_pay_withdraw_get,
    line_pay_withdraw_post,
    line_pay_financial_verification_get,
    line_pay_financial_verification_attestation_get,
    line_pay_financial_verification_attestation_options_post,
    line_pay_financial_verification_attestation_result_post,
    line_pay_financial_verification_assertion_get,
    line_pay_financial_verification_assertion_options_post,
    line_pay_financial_verification_assertion_result_post,
    line_pay_transfer_get,
    line_pay_transfer_post,
    line_pay_inter_agency_transfer_get,
    line_pay_inter_agency_transfer_post,
    jko_pay_get,
    jko_pay_login_get,
    jko_pay_login_post,
    jko_pay_authentication_get,
    jko_pay_transfer_get,
};
