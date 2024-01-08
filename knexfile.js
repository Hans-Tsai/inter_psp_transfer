// Update with your config settings.

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
require('dotenv').config();

module.exports = {

  development: {
    client: 'mysql',
    connection: {
      host : process.env.DB_HOST || 'localhost',
      port : 3306,
      user : process.env.DB_USER || 'root',
      password : process.env.DB_PASSWORD || 'root12345',
    },
    pool: {
      min: 2,
      max: 10
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
