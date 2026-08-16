const validator = require("validator");


const validateSignupData = (req) => {
  const { firstName, lastName, emailId, password, username } = req.body;

  if (!firstName || !lastName || !emailId || !password || !username) {
    throw new Error("All fields are required");
  }

  const usernameRegex = /^[a-z0-9_]+$/;
  if (!usernameRegex.test(username)) {
    throw new Error("Username can only contain lowercase letters, numbers, and underscores");
  }

  if (username.length < 3 || username.length > 30) {
    throw new Error("Username must be between 3 and 30 characters long");
  }

  if (!validator.isEmail(emailId)) {
    throw new Error("Invalid email format");
  }

  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters long");
  }

  if (firstName.length < 2 || lastName.length < 1) {
    throw new Error("Please enter a valid first and last name");
  }
};


const validateEditProfileData = (req) => {
  const allowedEditFields = [
    "firstName",
    "lastName",
    "emailId",
    "username",
    "photoUrl",
    "gender",
    "age",
    "about",
    "skills",
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

  if (req.body.username) {
    const usernameRegex = /^[a-z0-9_]+$/;
    if (!usernameRegex.test(req.body.username)) {
      throw new Error("Username can only contain lowercase letters, numbers, and underscores");
    }
    if (req.body.username.length < 3 || req.body.username.length > 30) {
      throw new Error("Username must be between 3 and 30 characters long");
    }
  }

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