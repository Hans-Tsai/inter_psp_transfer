const path = require("path");
const knex = require("../database/db");

// 建立一個用來專門產生錯誤事件的物件(=> errors object)的錯誤事件處理函數
const handleErrors = (err) => {
    // err.message: 錯誤事件的訊息，err.code: 錯誤事件的編號
    let errors = { account: "", password: "" };

    // TODO: account 驗證錯誤
    // if (err.message === 'incorrect account') errors.account = 'That account isn\'t registered.';
    // TODO: password 驗證錯誤
    // if (err.message === 'incorrect password') errors.password = 'That password is incorrect';

    // TODO: MySQL: duplicate key error
    // if (err.code === 11000) {
    //   errors['account'] = 'that account is already registered';
    //   return errors;
    // }

    // TODO: validation error
    // if (err.message.includes('user validation failed')) {
    //   Object.values(err.errors).forEach(properties => {
    //     errors[properties.path] = properties.message;
    //   })
    // }

    return errors;
};

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
    res.render("line_pay/index");
};

const line_pay_login_get = (req, res) => {
    res.render("line_pay/login");
};

const line_pay_login_post = (req, res) => {
    // 透過 express.json() 將 `POST` request 夾帶的 JSON 資料解析成 Javascript 的物件形式後，儲存到該 POST RESTful API 的 `request.body`
    const { account, password } = req.body;
    knex("line_pay")
        .select("account", "password")
        .where("account", account)
        .then((data) => {
            // console.log(data);
            if (account === data[0].account && password === data[0].password) {
                res.status(200).json({ data });
            }
        })
        .catch((err) => {
            const errors = handleErrors(err);
            res.status(400).json({ errors });
        });
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
                res.status(200).json({ data });
            }
        })
        .catch((err) => {
            const errors = handleErrors(err);
            res.status(400).json({ errors });
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
    line_pay_login_get,
    line_pay_login_post,
    line_pay_authentication_get,
    line_pay_transfer_get,
    jko_pay_get,
    jko_pay_login_get,
    jko_pay_login_post,
    jko_pay_authentication_get,
    jko_pay_transfer_get,
};
