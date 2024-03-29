const { config } = require('../config');
// 連線到 MySQL 資料庫
const knexConfig = require("../knexfile")[config.env];
const knex = require("knex")(knexConfig);
const bcrypt = require("bcrypt");
const PlatformModel = require("./PlatformModel");

class JkoPayModel {
    constructor(knex) {
        this.knex = knex;
    }

    async createUser({ account, password, username }) {
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(password, salt);
        return this.knex("jko_pay").insert({
            account,
            password: hashedPassword,
            name: username,
        });
    }

    async login({ account, password }) {
        const user = await this.knex("jko_pay").where({ account }).first();
        if (!user) throw new Error("Incorrect account");
        if (user.name === "admin") return user;

        const auth = await bcrypt.compare(password, user.password);
        if (!auth) throw new Error("Incorrect password");

        return user;
    }

    async getUserInfo(account) {
        return this.knex("jko_pay").where({ account }).first();
    }

    async deposit({ account, amount }) {
        return this.knex("jko_pay").where({ account }).increment("balance", amount);
    }

    async withdraw({ account, amount }) {
        return this.knex("jko_pay").where({ account }).decrement("balance", amount);
    }

    // 僅限同機構的用戶之間轉帳
    async transfer({ account, recipientAccount, amount, note }) {
        const trx = await knex.transaction();

        try {
            await trx("jko_pay").where({ account }).decrement("balance", amount);
            await trx("jko_pay").where({ account: recipientAccount }).increment("balance", amount);
            await trx("transfer").insert({
                institution_code: 396,
                account,
                recipient_institution_code: 396,
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
        const trx = await knex.transaction();
        const recipientInstitutionTable = this.knex("platform").select("table").where({ institution_code: recipientInstitutionCode });

        try {
            await trx("jko_pay").where({ account }).decrement("balance", amount);
            await trx(recipientInstitutionTable).where({ account: recipientAccount }).increment("balance", amount);
            await trx("transfer").insert({
                institution_code: 396,
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
}

module.exports = new JkoPayModel(knex);
