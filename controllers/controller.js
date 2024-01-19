const path = require("path");
const knex = require("../database/db");
const jwt = require("jsonwebtoken");
const LinePayModel = require("../models/LinePayModel");

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
    return jwt.sign({ account, institution_code }, process.env.JWT_SECRET, {
        expiresIn: maxValidDuration,
    });
};

//#endregion

//#region
// 電子支付跨機構共用平台
const platform_get = (req, res) => {
    res.render("platform/index");
};

const platform_code_get = (req, res) => {
    knex.select("*")
        .from("platform")
        .orderBy("institution_code", "asc")
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
    res.render("line_pay/index");
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
        // 產生一個帶有簽章(signature)的 JWT token
        const jwtToken = createToken(account, institutionCode);
        // 將這個 JWT token 儲存到 response 物件的 cookie 中
        res.cookie("jwt", jwtToken, {
            // 設定只能給 Web Server 的發送 http(s) request 的時候才能使用，以防止客戶端透過 javascript 來竄改此 JWT token
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

const line_pay_authentication_get = (req, res) => {
    res.render("line_pay/authentication");
};

const line_pay_transfer_get = (req, res) => {
    res.render("line_pay/transfer");
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
    line_pay_register_get,
    line_pay_register_post,
    line_pay_login_get,
    line_pay_login_post,
    line_pay_logout_get,
    line_pay_deposit_get,
    line_pay_deposit_post,
    line_pay_withdraw_get,
    line_pay_withdraw_post,
    line_pay_authentication_get,
    line_pay_transfer_get,
    jko_pay_get,
    jko_pay_login_get,
    jko_pay_login_post,
    jko_pay_authentication_get,
    jko_pay_transfer_get,
};
