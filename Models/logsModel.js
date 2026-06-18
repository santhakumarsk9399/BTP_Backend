//logsModel
const { sql, poolPromise } = require('../Utility/dbConfig');

exports.auditlogs = async (filters) => {
    const pool = await poolPromise;
    const request = pool.request();
    request.input('log', sql.NVarChar, filters.log);
    request.input('logType', sql.Int, filters.logType);
    request.input('UserID', sql.Int, filters.UserID);
    request.input('ctDateTime', sql.DateTime, filters.ctDateTime);
    await request.query('INSERT INTO Tb_AuditLogs (Log,LogType,CtDateTime, USERID) VALUES (@log,@logType,@ctDateTime,@VendorID)');
    return "Audit Logs inserted.";
};

exports.getUsers = async (userData) => {
    try{
        const pool = await poolPromise;
        const request = pool.request();
                        request.input('VID', sql.Int, userData.vid);
                        request.input('UserName', sql.NVarChar(100), userData.username);
        const result = await request.execute('SP_Settings_Logs_AddUsers');
        return result.recordsets;            
    }catch (error) {
        console.error('Error occurred:', error.message);
        console.error(error.stack);  // <-- Logs File Name & Line Number
        throw error;
    }
};

exports.getEvents = async (userData) => {
    try{
        const pool = await poolPromise;
        const request = pool.request();
                        request.input('VID', sql.Int, userData.vid);
                        request.input('UserName', sql.NVarChar(100), userData.username);
        const result = await request.execute('SP_Settings_Logs_AddEvents');
        return result.recordsets;            
    }catch (error) {
        console.error('Error occurred:', error.message);
        console.error(error.stack);  // <-- Logs File Name & Line Number
        throw error;
    }
};

exports.getAuditLogs = async (userData) => {
    try{
        const pool = await poolPromise;
        const request = pool.request();
                        request.input('VID', sql.Int, userData.vid);
                        request.input('UserName', sql.NVarChar(100), userData.UserName);
                        request.input('EventName', sql.NVarChar(250), userData.EventName);
                        request.input('FromDate', sql.DateTime, userData.FromDate);
                        request.input('ToDate', sql.DateTime, userData.ToDate);
        const result = await request.execute('SP_Settings_Logs_Reset');
        return result.recordsets;            
    }catch (error) {
        console.error('Error occurred:', error.message);
        console.error(error.stack);  // <-- Logs File Name & Line Number
        throw error;
    }
};

