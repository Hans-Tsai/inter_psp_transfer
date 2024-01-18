const knex = require("../database/db");
const jwt = require("jsonwebtoken");
const util = require("util");
const verify = util.promisify(jwt.verify);

/** 建立一個能被重複使用的中介函數，來驗證客戶端 `cookie` 內的 `JWT token` 存在 & 有效 */
const requireAuth = async (req, res, next) => {
    // 將客戶端的 `JWT token` 從 `request` 物件中的 `cookies` 解析出來
    const jwtToken = req.cookies.jwt;
    const institutionCode = req.query["institution_code"];
    // rows 是一個包含查詢結果的陣列
    const rows = await knex("platform")
        .select("institution_code", "table")
        .where("institution_code", institutionCode);

    // 驗證客戶端的 `cookie` 中夾帶的 `JWT token` 存在 & 有效
    if (jwtToken) {
        // 若客戶端存在 `JWT token`
        try {
            const decodedToken = await verify(jwtToken, process.env.JWT_SECRET);
            // console.log(decodedToken);
            // 若客戶端通過驗證 `JWT token` 存在 & 有效，繼續執行接下來的程式(=> `next()`)
            next();
        } catch (err) {
            // 若客戶端的 JWT token 無效，拋出該錯誤訊息，並將瀏覽器畫面導回到相對應的登入畫面
            console.log(err.message);
            res.redirect(`/${rows[0].table}/login`);
        }
    } else {
        // 若客戶端的 `cookie` 中沒有夾帶 `JWT token`，則將瀏覽器畫面導回到相對應的登入畫面
        res.redirect(`/${rows[0].table}/login`);
    }
};

/** 建立一個能夠確認當前的使用者的中介函數 */
const checkUser = async (req, res, next) => {
    const jwtToken = req.cookies.jwt;
    if (jwtToken) {
        jwt.verify(
            jwtToken,
            process.env.JWT_SECRET,
            async (err, decodedToken) => {
                if (err) {
                    console.log(err.message);
                    // 預設 response 物件中的 `local` 變數中的 `user` 屬性值為 `null`
                    res.locals.userInfo = null;
                    // 不需要導回到相對應的登入畫面，只要讓 Express 繼續執行 stack 中的下一個中介函數就好
                    next();
                } else {
                    // console.log(decodedToken);
                    // rows 是一個包含查詢結果的陣列
                    const institutionCode = req.query["institution_code"];
                    let rows = await knex("platform")
                        .select("table")
                        .where("institution_code", institutionCode);
                    const tableName = rows[0].table;
                    // rows 是一個包含查詢結果的陣列
                    rows = await knex(tableName)
                        .select("account", "name", "balance")
                        .where("account", decodedToken.account);
                    res.locals.userInfo = rows[0];
                    next();
                }
            }
        );
    } else {
        res.locals.userInfo = null;
        next();
    }
};

module.exports = {
    requireAuth,
    checkUser,
};
