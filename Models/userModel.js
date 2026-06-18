const { sql, poolPromise } = require('../Utility/dbConfig');

exports.getUserByUsername = async (username) => {
    const pool = await poolPromise;
    const result = await pool.request()
                    .input('username', sql.NVarChar, username)
                    .query('SELECT * FROM Mtb_Employee WHERE Emp_id = @username');
    return result.recordset[0];
};