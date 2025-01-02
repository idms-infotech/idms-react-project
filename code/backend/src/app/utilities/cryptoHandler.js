const CryptoJS = require("crypto-js");
const {CONSTANTS} = require("../../config/config");

class AESCrypto {
    constructor(secretKey) {
        this.secretKey = secretKey;
    }

    encrypt(text) {
        return CryptoJS.AES.encrypt(text, this.secretKey).toString();
    }

    decrypt(text) {
        const bytes = CryptoJS.AES.decrypt(text, this.secretKey);
        const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
        return decryptedText;
    }
}

module.exports = new AESCrypto(CONSTANTS.sessionSecret);
