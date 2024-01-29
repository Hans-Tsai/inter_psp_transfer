const config = require("../config");
// 連線到 MySQL 資料庫
const knexConfig = require("../knexfile")[config.env];
const knex = require("knex")(knexConfig);

class CredentialModel {
    constructor(knex) {
        this.knex = knex;
    }

    async saveCredential ({ institution_code, account, credential }) {
      return this.knex("credential").insert({

      });
    }
}

module.exports = new CredentialModel(knex);
