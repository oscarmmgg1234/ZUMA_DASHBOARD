const mysql = require('mysql')
const env = require('../env.json');

const db_init = () => {
    return mysql.createConnection({
    host: env.db_host,
    port: env.db_port,
    user: env.db_user,
    password: env.db_passcode,
    database: env.db_schema
  })
}

exports.db_init = db_init;