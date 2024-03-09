const { config } = require('../config');
// 連線到 MySQL 資料庫
const knexConfig = require("../knexfile")[config.env];
const knex = require("knex")(knexConfig);
const base64url = require('base64url');
const { isValidBase64Url } = require('../modules/webauthn/utils');

class FV_CredentialModel {
    constructor(knex) {
        this.knex = knex;
    }

    async saveCredential({
        fv_credentialID,
        institution_code,
        account,
    }) {
        const base64url_FV_CredentialID = isValidBase64Url(fv_credentialID) ? fv_credentialID : base64url.encode(fv_credentialID);
        return this.knex("fv_credential").insert({
            id: base64url_FV_CredentialID,
            institution_code,
            account,
            created_at: knex.fn.now(),
        });
    };
}

module.exports = new FV_CredentialModel(knex);
