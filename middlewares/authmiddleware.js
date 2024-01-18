const knex = require("../database/db");
const jwt = require("jsonwebtoken");
const util = require("util");
const verify = util.promisify(jwt.verify);

/** 建立一個能被重複使用的中介函數，來驗證客戶端 `cookie` 內的 `JWT token` 存在 & 有效 */
const requireAuth = async (req, res, next) => {
    // 將客戶端的 `JWT token` 從 `request` 物件中的 `cookies` 解析出來
    const jwtToken = req.cookies.jwt;
    let decodedToken;
    let institutionCode;
    let tableName;
    let rows;

    if (req.query["institution_code"]) {
        institutionCode = req.query["institution_code"];
        const rows = await knex("platform")
            .select("institution_code", "table")
            .where("institution_code", institutionCode);
        tableName = rows[0].table;
    }
    // 驗證客戶端的 `cookie` 中夾帶的 `JWT token` 存在 & 有效
    if (jwtToken) {
        // 若客戶端存在 `JWT token`
        try {
            decodedToken = await verify(jwtToken, process.env.JWT_SECRET);
            // console.log(decodedToken);
            institutionCode = decodedToken["institution_code"];
            // rows 是一個包含查詢結果的陣列
            rows = await knex("platform")
                .select("institution_code", "table")
                .where("institution_code", institutionCode);
            tableName = rows[0].table;
            // 若客戶端通過驗證 `JWT token` 存在 & 有效，繼續執行接下來的程式(=> `next()`)
            next();
        } catch (err) {
            // 若客戶端的 JWT token 無效，拋出該錯誤訊息，並將瀏覽器畫面導回到相對應的登入畫面
            console.log(err.message);
            res.redirect(`/${tableName}/login`);
        }
    } else {
        // 若客戶端的 `cookie` 中沒有夾帶 `JWT token`，則將瀏覽器畫面導回到相對應的登入畫面
        res.redirect(`/${tableName}/login`);
    }
};

/** 建立一個能夠確認當前的使用者的中介函數 */
const checkUser = async (req, res, next) => {
    const jwtToken = req.cookies.jwt;
    if (jwtToken) {
        try {
            const decodedToken = await verify(jwtToken, process.env.JWT_SECRET);
            const institutionCode = decodedToken["institution_code"];
            const rows = await knex("platform").select("table").where("institution_code", institutionCode);
            const userInfo = await knex(rows[0].table)
                .select("account", "name", "balance")
                .where("account", decodedToken.account)
                .first();

            res.locals.userInfo = userInfo;
        } catch (err) {
            console.log(err.message);
            res.locals.userInfo = null;
        }
    } else {
        res.locals.userInfo = null;
    }

    next();
};

module.exports = {
    requireAuth,
    checkUser,
};
