/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
module.exports.seed = async function (knex) {
    await knex.schema.dropTableIfExists("platform");
    await knex.schema.dropTableIfExists("line_pay");
    await knex.schema.dropTableIfExists("jko_pay");

    // 檢查資料表是否存在
    const platform_exists = await knex.schema.hasTable("platform");
    if (!platform_exists) {
        // 建立資料表
        await knex.schema.createTable("platform", (table) => {
            table.increments("id").primary();
            table.integer("institution_code").notNullable().unique();
            table.string("institution_name").notNullable().unique();
            // 其他欄位定義
        });
        // 填充資料表的示例數據
        await knex("platform").insert([
            { institution_code: 390, institution_name: "悠遊卡公司" },
            { institution_code: 391, institution_name: "一卡通公司" },
            {
                institution_code: 396,
                institution_name: "街口電子支付公司",
            },
            {
                institution_code: 397,
                institution_name: "歐付寶電子支付公司",
            },
        ]);
    }

    // 檢查資料表是否存在
    const line_pay_exists = await knex.schema.hasTable("line_pay");
    if (!line_pay_exists) {
        // 建立資料表
        await knex.schema.createTable("line_pay", (table) => {
            table.increments("id").primary();
            table.string("account").notNullable().unique().checkLength("=", 10);
            table.string("password").notNullable().defaultTo("000000");
            table.string("name").notNullable().defaultTo("新用戶");
            table.integer("balance").notNullable().defaultTo(0);
            table.boolean("authenticated").defaultTo(false);
            // 其他欄位定義
        });
        // 填充資料表的示例數據
        await knex("line_pay").insert([
            { account: 1234567891, balance: 1000, authenticated: false },
        ]);
    }

    // 檢查資料表是否存在
    const jko_pay_exists = await knex.schema.hasTable("jko_pay");
    if (!jko_pay_exists) {
        // 建立資料表
        await knex.schema.createTable("jko_pay", (table) => {
            table.increments("id").primary();
            table.string("account").notNullable().unique().checkLength("=", 9);
            table.string("password").notNullable().defaultTo("000000");
            table.string("name").notNullable().defaultTo("新用戶");
            table.integer("balance").notNullable().defaultTo(0);
            table.boolean("authenticated").defaultTo(false);
            // 其他欄位定義;
        });
        // 填充資料表的示例數據
        await knex("jko_pay").insert([
            { account: 987654321, balance: 500, authenticated: false },
        ]);
    }
};
