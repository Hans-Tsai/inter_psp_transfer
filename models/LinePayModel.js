const { config, configUpdated } = require('../config');
// 連線到 MySQL 資料庫
const knexConfig = require("../knexfile")[config.env];
const knex = require("knex")(knexConfig);
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const PlatformModel = require("./PlatformModel");

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
        const isolationLevel = "repeatable read";
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
    }

    async interAgencyTransfer({ account, recipientInstitutionCode, recipientAccount, amount, note }) {
        // 在 MySQL 中，預設的隔離級別是 REPEATABLE READ
        const isolationLevel = "repeatable read";
        const trx = await knex.transaction({ isolationLevel });

        try {
            const recipientInstitution = await this.knex("platform")
                .select("table")
                .where({ institution_code: recipientInstitutionCode })
                .first();
            await trx("line_pay").where({ account }).decrement("balance", amount);
            await trx(recipientInstitution.table).where({ account: recipientAccount }).increment("balance", amount);
            await trx("transfer").insert({
                institution_code: 391,
                account,
                recipient_institution_code: recipientInstitutionCode,
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
    }

    async generateAccount() {
        const users = await this.knex("line_pay").select("account");
        let randomAccount = "";
        const length = 10;
        for (let i = 0; i < length; i++) {
            const num = crypto.randomInt(0, 10); // 產生 0 到 9 的隨機整數
            randomAccount += num.toString();
        }
        if (users.some(user => user.account == randomAccount)) return this.generateAccount();
        
        return randomAccount;
    }
}

module.exports = new LinePayModel(knex);
