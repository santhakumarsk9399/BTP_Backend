// dbConfig.js
const sql = require('mssql');

require('dotenv').config();



const config = {
    user: process.env.DBUSER,
    password: process.env.DBPASSWORD,
    server: process.env.DBHOST,  // e.g., 'localhost' or 'SERVER\\SQLEXPRESS'
    database: process.env.DATABASENAME,
    options: {
        encrypt: false, // Use true if Azure SQL, else false
        trustServerCertificate: false // Needed for local dev
    }
};

const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log('Connected to MSSQL');
        return pool;
    })
    .catch(err => {
        console.log('Database Connection Failed! Bad Config: ', err);
        throw err;
    });

module.exports = {
    sql, poolPromise
};