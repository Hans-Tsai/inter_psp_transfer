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
        if (user) {
            const auth = await bcrypt.compare(password, user.password);
            if (auth) return user;
            throw new Error("Incorrect password");
        }
        throw new Error("Incorrect email");
    }

    async getUserInfo(account) {
        return this.knex("line_pay").where({ account }).first();
    }
}

module.exports = new LinePayModel(knex);