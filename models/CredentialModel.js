const { config, configUpdated } = require('../config');
// 連線到 MySQL 資料庫
const knexConfig = require("../knexfile")[config.env];
const knex = require("knex")(knexConfig);
const base64url = require('base64url');
const { isValidBase64Url } = require('../modules/webauthn/utils');

class CredentialModel {
    constructor(knex) {
        this.knex = knex;
    }

    async saveCredential({
        credentialID,
        institution_code,
        account,
    }) {
        const base64urlCredentialID = isValidBase64Url(credentialID) ? credentialID : base64url.encode(credentialID);
        return this.knex("credential").insert({
            id: base64urlCredentialID,
            institution_code,
            account,
            created_at: knex.fn.now(),
        });
    };
}

module.exports = new CredentialModel(knex);
