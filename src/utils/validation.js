const validator = require("validator");

/*
 * ============================
 * Validate Signup Data
 * ============================
 */
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

/*
 * ============================
 * Validate Edit Profile Data
 * ============================
 */
const validateEditProfileData = (req) => {
    const allowedEditFields = [
        "firstName",
        "lastName",
        "emailId",
        "photoUrl",
        "gender",
        "age",
        "about",
        "skills"
    ];

    const isEditAllowed = Object.keys(req.body).every((field) =>
        allowedEditFields.includes(field)
    );

    if (!isEditAllowed) {
        throw new Error("Invalid fields for profile update");
    }
};

module.exports = {
    validateSignupData,
    validateEditProfileData
};
