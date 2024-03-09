const { config } = require("../config");
// 連線到 MySQL 資料庫
const knexConfig = require("../knexfile")[config.env];
const knex = require("knex")(knexConfig);
const base64url = require("base64url");
const { isValidBase64Url } = require("../modules/webauthn/utils");

class FV_AuthenticatorModel {
    constructor(knex) {
        this.knex = knex;
    }

    async saveAuthenticator({
        fv_credentialID,
        institution_code,
        account,
        credentialPublicKey,
        counter,
        credentialDeviceType,
        credentialBackedUp,
        transports,
    }) {
        const base64url_FV_CredentialID = isValidBase64Url(fv_credentialID) ? fv_credentialID : base64url.encode(fv_credentialID);
        const base64url_FV_CredentialPublicKey = isValidBase64Url(credentialPublicKey) ? credentialPublicKey : base64url.encode(credentialPublicKey);
        const JSONTransports = JSON.stringify(transports);
        return this.knex("fv_authenticator").insert({
            fv_credentialID: base64url_FV_CredentialID,
            institution_code,
            account,
            fv_credentialPublicKey: base64url_FV_CredentialPublicKey,
            counter,
            credentialDeviceType,
            credentialBackedUp,
            transports: JSONTransports,
        });
    }

    /**
     * @param {number} institution_code
     * @param {string} account
     * @param {string} name (username)
     * @returns Authenticator[]
     * @description Retrieve any of the user's previously registered authenticators.
     */
    async getUserAuthenticators({ institution_code, account, name }) {
        let query = this.knex("fv_authenticator").where({ institution_code });
        // 如果 account 或 name 有值，則加入條件
        if (account || name) {
            query = query.andWhere(function () {
                if (account) this.orWhere({ account });
                if (name) this.orWhere({ name });
            });
        }

        return query;
    }

    /**
     * @param {number} institution_code
     * @param {string} account
     * @param {string} name (username)
     * @param {string} fv_credentialID
     * @returns authenticator
     * @description Retrieve an authenticator from the DB that should match the `fv_credentialID` in the returned credential.
     */
    async getUserAuthenticator({ institution_code, account, name, fv_credentialID }) {
        let query = this.knex("fv_authenticator").where({ institution_code });
        // 如果 account 或 name 有值，則加入條件
        if (account || name) {
            query = query.andWhere(function () {
                if (account) this.orWhere({ account });
                if (name) this.orWhere({ name });
            });
        }
        // 如果 fv_credentialID 有值，則加入條件
        if (fv_credentialID) {
            const base64url_FV_CredentialID = isValidBase64Url(fv_credentialID) ? fv_credentialID : base64url.encode(fv_credentialID);
            query = query.andWhere({ fv_credentialID: base64url_FV_CredentialID });
        }
        query = query.first();

        return query;
    }

    async updatedAuthenticatorCounter({ fv_credentialID, newCounter }) {
        const base64url_FV_CredentialID = isValidBase64Url(fv_credentialID) ? fv_credentialID : base64url.encode(fv_credentialID);
        return this.knex("fv_authenticator").where({ fv_credentialID: base64url_FV_CredentialID }).update({ counter: newCounter });
    }
}

module.exports = new FV_AuthenticatorModel(knex);
