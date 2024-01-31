const { config, configUpdated } = require("../config");
// 連線到 MySQL 資料庫
const knexConfig = require("../knexfile")[config.env];
const knex = require("knex")(knexConfig);
const base64url = require("base64url");

class AuthenticatorModel {
    constructor(knex) {
        this.knex = knex;
    }

    async saveAuthenticator({
        credentialID,
        user_institution_code,
        userID,
        credentialPublicKey,
        counter,
        credentialDeviceType,
        credentialBackedUp,
        transports,
    }) {
        const base64urlCredentialID = base64url.encode(credentialID);
        const base64urlCredentialPublicKey = base64url.encode(credentialPublicKey);
        const JSONTransports = JSON.stringify(transports);
        return this.knex("authenticator").insert({
            credentialID: base64urlCredentialID,
            user_institution_code,
            userID,
            credentialPublicKey: base64urlCredentialPublicKey,
            counter,
            credentialDeviceType,
            credentialBackedUp,
            transports: JSONTransports,
        });
    }

    async getUserAuthenticators({ user_institution_code, account }) {
        return this.knex("authenticator").where({ user_institution_code, userID: account });
    }
}

module.exports = new AuthenticatorModel(knex);
