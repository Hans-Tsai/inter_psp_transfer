// Update with your config settings.
const { config, configUpdated } = require('./config');

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
module.exports = {
    development: {
        // 有支援 Mysql 8.0 以上的版本的強化密碼驗證功能
        client: "mysql2",
        connection: {
            host: config.db.host,
            port: config.db.port,
            user: config.db.user,
            password: config.db.password,
            database: config.db.name,
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
        // 在 MySQL 中，預設的隔離級別是 REPEATABLE READ
        isolationLevel: 'repeatable read'
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
