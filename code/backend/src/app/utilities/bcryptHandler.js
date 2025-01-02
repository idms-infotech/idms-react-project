const bcrypt = require("bcrypt");
const saltRounds = 8; // Adjust the number of salt rounds based on your security requirements

class BcryptHandler {
    async hashPassword(password) {
        try {
            const hashedPassword = await bcrypt.hash(password, bcrypt.genSaltSync(saltRounds));
            return hashedPassword;
        } catch (error) {
            console.error("Error hashing password:", error.message);
            throw error;
        }
    }

    async verifyPassword(password, hashedPassword) {
        try {
            const match = await bcrypt.compare(password, hashedPassword);
            return match;
        } catch (error) {
            console.error("Error verifying password:", error.message);
            throw error;
        }
    }
}

// Example usage:
module.exports = new BcryptHandler();
