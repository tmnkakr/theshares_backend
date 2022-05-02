const CryptoJS = require("crypto-js");
const config = require("../config/production.json");
const crypto = require("crypto");
const { resultObject, writeErrToFile } = require("./commonUtils");
const encryptData = (data) => {
  try {
    const salt = config.Encryption.saltForUserData;
    const secretKey = `${salt}`;
    const encryptedForm = CryptoJS.AES.encrypt(data, secretKey).toString();
    return resultObject(1, "Success: Successfully encrypted", [encryptedForm]);
  } catch (error) {
    writeErrToFile({
      when: "while Performing encyption",
      where: "encryptData()",
      error: error.message,
    });
    return resultObject(0, "Failed: failed to perform encryption", []);
  }
};

const decryptData = (data) => {
  try {
    const salt = config.Encryption.saltForUserData;
    const secretKey = `${salt}`;
    const decryptedForm = CryptoJS.AES.decrypt(data, secretKey).toString(
      CryptoJS.enc.Utf8
    );
    return resultObject(1, "Success: successfully decypted", [decryptedForm]);
  } catch (error) {
    writeErrToFile({
      when: "while decrypting",
      where: "decryptData()",
      error: error.message,
    });
    return resultObject(0, "Failed: failed to decrypt data", []);
  }
};

const hashData = async (data) => {
  try {
    var hash = crypto
      .createHash(config.Encryption.algorithm)
      .update(data)
      .digest(config.Encryption.outputEncoding);
    return resultObject(1, "Success: Successfully hashed", [hash]);
  } catch (error) {
    writeErrToFile({
      when: "while hashing data",
      where: "hashData()",
      error: error.message,
    });
    return resultObject(
      0,
      `Failed: couldn't perform hashing -> ${error.message}`,
      []
    );
  }
};
const comparePassword = async function (password, hashedPassword) {
  try {
    const encodedPassword = crypto
      .createHash(config.Encryption.algorithm)
      .update(password)
      .digest(config.Encryption.outputEncoding);
    if (encodedPassword === hashedPassword)
      return resultObject(1, "Success: password comparison done successfully", [true]);
    return resultObject(1, "Success: password comparison done successfully", [false]);
  } catch (error) {
    writeErrToFile({
      when: "performing password comparison",
      where:"comparePassword()",
      error: error.message,
    });
    return resultObject(0, "Failed: Error occoured at password comparison", []);
  }
};
module.exports = {
  hashData,encryptData,decryptData,comparePassword
}