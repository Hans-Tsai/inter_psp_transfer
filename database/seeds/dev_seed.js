const PlatformModel = require("../../models/PlatformModel");
const LinePayModel = require("../../models/LinePayModel");
const JkoPayModel = require("../../models/JkoPayModel");

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
module.exports.seed = async function (knex) {
    // 刪除資料表
    await knex.schema.dropTableIfExists("fv_authenticator");
    await knex.schema.dropTableIfExists("fv_credential");
    await knex.schema.dropTableIfExists("authenticator");
    await knex.schema.dropTableIfExists("credential");
    await knex.schema.dropTableIfExists("line_pay");
    await knex.schema.dropTableIfExists("jko_pay");
    await knex.schema.dropTableIfExists("transfer");
    await knex.schema.dropTableIfExists("platform");

    // 檢查資料表是否存在
    const platform_exists = await knex.schema.hasTable("platform");
    if (!platform_exists) {
        // 建立資料表
        await knex.schema.createTable("platform", (table) => {
            table.integer("institution_code").primary().notNullable().unique();
            table.string("institution_name").notNullable().unique();
            table.string("table").notNullable().defaultTo("table_name");
        });
        // 填充資料表的範例數據
        await knex("platform").insert([
            { institution_code: 390, institution_name: "悠遊卡公司", table: "easy_wallet" },
            {
                institution_code: 391,
                institution_name: "一卡通公司",
                table: "line_pay",
            },
            {
                institution_code: 396,
                institution_name: "街口電子支付公司",
                table: "jko_pay",
            },
            {
                institution_code: 397,
                institution_name: "歐付寶電子支付公司",
                table: "o_pay",
            },
        ]);
    }

    // 檢查資料表是否存在
    const line_pay_exists = await knex.schema.hasTable("line_pay");
    if (!line_pay_exists) {
        // 建立資料表
        await knex.schema.createTable("line_pay", (table) => {
            table.integer("institution_code").references("platform.institution_code").notNullable().defaultTo(391);
            table.string("account").primary().notNullable().unique().checkLength("=", 10);
            table.string("password").notNullable().defaultTo("000000");
            table.string("name").notNullable().unique();
            table.integer("balance").notNullable().defaultTo(0);
            table.boolean("isFinancialVerified").defaultTo(false);
        });
        // 填充資料表的範例數據
        await LinePayModel.createUser({ account: "1234567891", password: "000000", username: "admin" });
    }

    // 檢查資料表是否存在
    const jko_pay_exists = await knex.schema.hasTable("jko_pay");
    if (!jko_pay_exists) {
        // 建立資料表
        await knex.schema.createTable("jko_pay", (table) => {
            table.integer("institution_code").references("platform.institution_code").notNullable().defaultTo(396);
            table.string("account").primary().notNullable().unique().checkLength("=", 9);
            table.string("password").notNullable().defaultTo("000000");
            table.string("name").notNullable().unique();
            table.integer("balance").notNullable().defaultTo(0);
            table.boolean("isFinancialVerified").defaultTo(false);
        });
        // 填充資料表的範例數據
        await JkoPayModel.createUser({ account: "987654321", password: "000000", username: "admin"});
    }

    // 檢查資料表是否存在
    const transfer_exists = await knex.schema.hasTable("transfer");
    if (!transfer_exists) {
        // 建立資料表
        await knex.schema.createTable("transfer", (table) => {
            table.increments("id").primary();
            table.integer("institution_code").references("platform.institution_code").notNullable();
            table.string("account").notNullable();
            table.integer("recipient_institution_code").references("platform.institution_code").notNullable();
            table.string("recipient_account").notNullable();
            table.integer("amount").notNullable();
            table.string("note").notNullable().defaultTo("無");
            table.timestamp("created_at").defaultTo(knex.fn.now());
        });
    }

    // 檢查資料表是否存在
    const credential_exists = await knex.schema.hasTable("credential");
    if (!credential_exists) {
        // 建立資料表
        await knex.schema.createTable("credential", (table) => {
            // SQL: Encode to base64url then store as `STRING`. Index this column
            table.string("id", 255).primary();
            table.integer("institution_code").references("platform.institution_code").notNullable();
            table.string("account").notNullable();
            table.timestamp("created_at").defaultTo(knex.fn.now());
        });
    }

    // 檢查資料表是否存在
    const authenticator_exists = await knex.schema.hasTable("authenticator");
    if (!authenticator_exists) {
        // 建立資料表
        await knex.schema.createTable("authenticator", (table) => {
            // SQL: Encode to base64url then store as `STRING`. Index this column
            table.string('credentialID', 255).references("credential.id").notNullable().unique().index();
            table.integer('institution_code').notNullable();
            table.string('account').notNullable();
            // SQL: Encode to base64url then store as `STRING`.
            table.string('credentialPublicKey');
            table.bigInteger('counter');
            table.string('credentialDeviceType', 32);
            table.boolean('credentialBackedUp');
            // SQL: 為了儲存 string array 可以用 JSON 格式
            table.json('transports');  // e.g. Ex: ['usb', 'ble', 'nfc', 'internal']
        });
    }

    // 檢查資料表是否存在
    const fv_credential_exists = await knex.schema.hasTable("fv_credential");
    if (!fv_credential_exists) {
        // 建立資料表
        await knex.schema.createTable("fv_credential", (table) => {
            // SQL: Encode to base64url then store as `STRING`. Index this column
            table.string("id", 255).primary();
            table.integer("institution_code").references("platform.institution_code").notNullable();
            table.string("account").notNullable();
            table.timestamp("created_at").defaultTo(knex.fn.now());
        });
    }

    // 檢查資料表是否存在
    const fv_authenticator_exists = await knex.schema.hasTable("fv_authenticator");
    if (!fv_authenticator_exists) {
        // 建立資料表
        await knex.schema.createTable("fv_authenticator", (table) => {
            // SQL: Encode to base64url then store as `STRING`. Index this column
            table.string('fv_credentialID', 255).references("fv_credential.id").notNullable().unique().index();
            table.integer('institution_code').notNullable();
            table.string('account').notNullable();
            // SQL: Encode to base64url then store as `STRING`.
            table.string('fv_credentialPublicKey');
            table.bigInteger('counter');
            table.string('credentialDeviceType', 32);
            table.boolean('credentialBackedUp');
            // SQL: 為了儲存 string array 可以用 JSON 格式
            table.json('transports');  // e.g. Ex: ['usb', 'ble', 'nfc', 'internal']
        });
    }
};
