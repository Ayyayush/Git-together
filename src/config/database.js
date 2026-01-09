const mongoose = require("mongoose");

const connectDB = async () => {
    await mongoose.connect("mongodb+srv://ayushzp159_db_user:nWfUvSjvNP6LcnQD@cluster0.bxwqic1.mongodb.net/gittogether");
};

module.exports = connectDB;

