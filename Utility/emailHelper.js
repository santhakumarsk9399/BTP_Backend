const nodemailer = require('nodemailer');
require('dotenv').config();
const {sql, poolPromise} = require("./dbConfig");

const sendEmail = async (to, subject, htmlContent, vid) => {
    try {
        const pool = await poolPromise;
        const request = pool.request();
                        request.input('VID', sql.Int, vid);
        const result =  request.query("SELECT * FROM Tb_SmtpConf WHERE Vid = @VID");
        const recordSet = result.recordset;
        const transporter = nodemailer.createTransport({
            host: recordSet?.ESmtpServer ?? process.env.EMAIL_HOST,
            port: recordSet?.EPort ?? process.env.EMAIL_PORT,
            secure: false,
            auth: {
                user: recordSet?.EFromUname ?? process.env.EMAIL_USER,
                pass: recordSet?.EFrompwd ?? process.env.EMAIL_PASS
            }
        });        
        let info = await transporter.sendMail({
                from: `"No Reply" <${recordSet?.Email ?? process.env.EMAIL_USER}>`,
                to,
                subject,
                html: htmlContent
            });
            console.log(`Email ${info}`)
        return { success: true, messageId: info.messageId, response: info.response };
    } catch (error) {
        console.error('Email Error:', error);
        return { success: false, error: error.message, code: error.code || null, response: error.response || null};
        // throw error;
    }
};

module.exports = { sendEmail };