const express = require("express");
const connectDB = require("./config/database");

const app = express();

connectDB()
    .then(() => {
        console.log("Database connected");

        app.listen(7777, () => {
            console.log("Server listening on port 7777");
        });
    })
    .catch((err) => {
        console.error("Failed to connect to database");
        console.error(err.message);
        process.exit(1);
    });
