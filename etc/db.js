
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config({ path: path.join(__dirname, '../.env.defaults') });

const credentials = {
    password : process.env.DB_PASSWORD,
    username : process.env.DB_USER,
    database : process.env.DB_NAME,
    host     : process.env.DB_HOST
};

const config = {
    ...credentials,
    dialect : 'postgres',
    logging : process.env.DEBUG && console.log
};

module.exports = config;
