const LinePayModel = require("../../models/LinePayModel");

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
module.exports.seed = async function (knex) {
    await knex.schema.dropTableIfExists("line_pay");
    await knex.schema.dropTableIfExists("jko_pay");
    await knex.schema.dropTableIfExists("platform");
    await knex.schema.dropTableIfExists("transfer");

    // 檢查資料表是否存在
    const platform_exists = await knex.schema.hasTable("platform");
    if (!platform_exists) {
        // 建立資料表
        await knex.schema.createTable("platform", (table) => {
            table.integer("institution_code").primary().notNullable().unique();
            table.string("institution_name").notNullable().unique();
            table.string("table").notNullable().defaultTo("table_name");
            // 其他欄位定義
        });
        // 填充資料表的示例數據
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
            table.string("name").notNullable().defaultTo("新用戶");
            table.integer("balance").notNullable().defaultTo(0);
            table.boolean("authenticated").defaultTo(false);
            // 其他欄位定義
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
            table.string("name").notNullable().defaultTo("新用戶");
            table.integer("balance").notNullable().defaultTo(0);
            table.boolean("authenticated").defaultTo(false);
            // 其他欄位定義;
        });
        // 填充資料表的範例數據
        // await JKOPayModel.createUser({ account: "987654321", password: "000000", username: "admin"});
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
};
