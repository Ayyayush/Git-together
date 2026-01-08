const adminAuth = (req, res, next) => {
    console.log("Admin auth is checked");

    const token = "xyz";

    const isAdminAuthorized = token === "xyz";

    if (!isAdminAuthorized) {
        return res.status(401).send("Unauthorized request");
    }

    next();
};

module.exports = adminAuth;
