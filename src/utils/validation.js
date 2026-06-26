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
    "skills",
    // New Developer profile fields
    "developerTitle",
    "college",
    "degree",
    "graduationYear",
    "company",
    "experienceLevel",
    "location",
    "portfolio",
    "resume",
    "github",
    "linkedin",
    "leetcode",
    "codeforces",
    "codechef",
    "hackerrank",
    "twitter",
    "website",
    "projects",
    "availability",
    "profileStrength",
  ];

  const incomingFields = Object.keys(req.body);
  const isEditAllowed = incomingFields.every((field) =>
    allowedEditFields.includes(field)
  );

  if (!isEditAllowed) {
    throw new Error("Invalid fields for profile update");
  }

  // Deep Validation for specific fields
  const urlFields = [
    "photoUrl",
    "portfolio",
    "resume",
    "github",
    "linkedin",
    "leetcode",
    "codeforces",
    "codechef",
    "hackerrank",
    "twitter",
    "website",
  ];

  for (const field of urlFields) {
    if (req.body[field] && !validator.isURL(req.body[field])) {
      throw new Error(`The field '${field}' must be a valid URL`);
    }
  }

  if (req.body.skills && !Array.isArray(req.body.skills)) {
    throw new Error("Skills must be provided as an array of strings");
  }

  if (req.body.projects) {
    if (!Array.isArray(req.body.projects)) {
      throw new Error("Projects must be provided as an array");
    }
    for (const project of req.body.projects) {
      if (!project.title || project.title.trim().length === 0) {
        throw new Error("Every project requires a valid title");
      }
      if (!project.description || project.description.trim().length === 0) {
        throw new Error("Every project requires a valid description");
      }
      if (project.github && !validator.isURL(project.github)) {
        throw new Error("Project GitHub link must be a valid URL");
      }
      if (project.live && !validator.isURL(project.live)) {
        throw new Error("Project Live link must be a valid URL");
      }
      if (project.image && !validator.isURL(project.image)) {
        throw new Error("Project Image link must be a valid URL");
      }
      if (project.techStack && !Array.isArray(project.techStack)) {
        throw new Error("Project techStack must be an array of strings");
      }
    }
  }
};

module.exports = {
  validateSignupData,
  validateEditProfileData,
};