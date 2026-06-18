const nodemailer = require("nodemailer");

function getShortSmtpMessage(error) {
  switch (error.code) {
    case "EAUTH":
      return "Invalid username or password";
    case "ECONNECTION":
      return "Unable to connect to SMTP server";
    case "ETIMEDOUT":
      return "SMTP connection timed out";
    case "ECONNRESET":
      return "SMTP connection was reset";
    case "EENVELOPE":
      return "Invalid email address (FROM/TO)";
    case "EDNS":
      return "SMTP host not found";
    case "ESOCKET":
      return "SMTP socket error";
    default:
      return error.message || "Unknown SMTP error";
  }
}

const validateSmtp =async (smtpConfig) => {
  try {
    const transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure || false, // true for 465, false for 587
      auth: {
        user: smtpConfig.user,
        pass: smtpConfig.pass,
      },
    });

    // 👇 Verify connection & auth
    await transporter.verify();

    return { success: true, message: "SMTP connection successful" };
  } catch (error) {
    return {
            success: false,
            message: getShortSmtpMessage(error) || "SMTP error occurred",
            // code: error.code || null,
            // response: error.response || null,
            // command: error.command || null,
            // errno: error.errno || null,
            // address: error.address || null,
            // port: error.port || null,
            // stack: error.stack || null
        };
    }
}

module.exports = { validateSmtp };