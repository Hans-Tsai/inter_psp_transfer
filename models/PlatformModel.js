const { config, configUpdated } = require('../config');
// 連線到 MySQL 資料庫
const knexConfig = require("../knexfile")[config.env];
const knex = require("knex")(knexConfig);
const bcrypt = require("bcrypt");

class PlatformModel {
    constructor(knex) {
        this.knex = knex;
    }

    async getPlatformInfo() {
        return this.knex.select("*").from("platform").orderBy("institution_code", "asc");
    }

    async getInstitutionInfo(institutionCode) {
        return this.knex("platform").where({ institution_code: institutionCode }).first();
    }

    async getUserInfo({ institutionCode, account }) {
        const institutionInfo = await this.knex("platform").where({ institution_code: institutionCode }).first();
        const tableName = institutionInfo.table;
        return this.knex(tableName).where({ account }).first();
    }
}

module.exports = new PlatformModel(knex);
