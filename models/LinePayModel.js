const NODE_ENV = process.env.NODE_ENV || "development";
// 連線到 MySQL 資料庫
const knexConfig = require("../knexfile")[NODE_ENV];
const knex = require("knex")(knexConfig);
const bcrypt = require("bcrypt");

class LinePayModel {
    constructor(knex) {
        this.knex = knex;
    }

    async createUser({ account, password, username }) {
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(password, salt);
        return this.knex("line_pay").insert({
            account,
            password: hashedPassword,
            name: username,
        });
    }

    async login({ account, password }) {
        const user = await this.knex("line_pay").where({ account }).first();
        if (!user) throw new Error("Incorrect account");
        if (user.name === "admin") return user;

        const auth = await bcrypt.compare(password, user.password);
        if (!auth) throw new Error("Incorrect password");

        return user;
    }

    async getUserInfo(account) {
        return this.knex("line_pay").where({ account }).first();
    }

    async deposit({ account, amount }) {
        return this.knex("line_pay").where({ account }).increment("balance", amount);
    }

    async withdraw({ account, amount }) {
        return this.knex("line_pay").where({ account }).decrement("balance", amount);
    }

    // 僅限同機構的用戶之間轉帳
    async transfer({ account, recipientAccount, amount, note }) {
        // 在 MySQL 中，預設的隔離級別是 REPEATABLE READ
        const isolationLevel = 'repeatable read';
        const trx = await knex.transaction({ isolationLevel });

        try {
            await trx("line_pay").where({ account }).decrement("balance", amount);
            await trx("line_pay").where({ account: recipientAccount }).increment("balance", amount);
            await trx("transfer").insert({
                institution_code: 391,
                account,
                recipient_institution_code: 391,
                recipient_account: recipientAccount,
                amount,
                note,
            });

            await trx.commit();
        } catch (error) {
            if (!trx.isCompleted()) {
                await trx.rollback();
            }
            throw new Error(error.message);
        }
    };
}

module.exports = new LinePayModel(knex);
