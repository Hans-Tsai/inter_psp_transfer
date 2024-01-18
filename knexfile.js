// Update with your config settings.

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
module.exports = {
    development: {
        // 有支援 Mysql 8.0 以上的版本的強化密碼驗證功能
        client: "mysql2",
        connection: {
            host: process.env.DB_HOST || "localhost",
            port: 3306,
            user: process.env.DB_USER || "root",
            password: process.env.DB_PASSWORD || "root12345",
            database: process.env.DB_NAME || "fido_uaf",
        },
        seeds: {
            directory: "./database/seeds",
        },
        pool: {
            min: 2,
            max: 10,
        },
        // migrations: {
        //   tableName: 'knex_migrations'
        // }
    },

    // staging: {
    //   client: 'postgresql',
    //   connection: {
    //     database: 'my_db',
    //     user:     'username',
    //     password: 'password'
    //   },
    //   pool: {
    //     min: 2,
    //     max: 10
    //   },
    //   migrations: {
    //     tableName: 'knex_migrations'
    //   }
    // },

    // production: {
    //   client: 'postgresql',
    //   connection: {
    //     database: 'my_db',
    //     user:     'username',
    //     password: 'password'
    //   },
    //   pool: {
    //     min: 2,
    //     max: 10
    //   },
    //   migrations: {
    //     tableName: 'knex_migrations'
    //   }
    // }
};
