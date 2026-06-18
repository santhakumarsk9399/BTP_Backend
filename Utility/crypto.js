const CryptoJS = require("crypto-js");
require("dotenv").config();

const secretKey = process.env.JWT_SECRET;

function encryptData(text) {
  if (!secretKey) throw new Error("PASSWORD_SECRET missing");
  return CryptoJS.AES.encrypt(text, secretKey).toString();
}

function decryptData(cipherText) {
  if (!secretKey) throw new Error("PASSWORD_SECRET missing");
  if (!cipherText) return null;

  const bytes = CryptoJS.AES.decrypt(cipherText, secretKey);
  const decrypted = bytes.toString(CryptoJS.enc.Utf8);

  return decrypted || null;
}

module.exports = { encryptData, decryptData };
