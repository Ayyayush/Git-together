const validator = require("validator");

const validateSignupData = (req) => {
    const { firstName, lastName, emailId, password } = req.body;

    if (!firstName || !lastName || !emailId || !password) {
        throw new Error("All fields are required");
    }

    if (!validator.isEmail(emailId)) {
        throw new Error("Invalid email format");
    }

    if (password.length < 8) {
        throw new Error("Password must be at least 8 characters long");
    }

    if (firstName.length < 3 || lastName.length < 3) {
        throw new Error("Name must be at least 3 characters long");
    }
};

module.exports = validateSignupData;
