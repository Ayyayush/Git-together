const express = require("express");

const app = express();

// Middleware to parse JSON
app.use(express.json());

// ------------------------------------
// Health & Root Routes
// ------------------------------------
app.get("/", (req, res) => {
    res.send("GitTogether API is running");
});

app.get("/health", (req, res) => {
    res.status(200).json({ status: "OK" });
});

// ------------------------------------
// Auth Routes
// ------------------------------------
app.post("/api/auth/register", (req, res) => {
    res.send("User registered");
});

app.post("/api/auth/login", (req, res) => {
    res.send("User logged in");
});

app.post("/api/auth/logout", (req, res) => {
    res.send("User logged out");
});

// ------------------------------------
// User Routes
// ------------------------------------
app.get("/api/users", (req, res) => {
    res.send("All users");
});

app.get("/api/users/:userId", (req, res) => {
    res.send(`User details for ${req.params.userId}`);
});

app.put("/api/users/:userId", (req, res) => {
    res.send(`User ${req.params.userId} updated`);
});

app.delete("/api/users/:userId", (req, res) => {
    res.send(`User ${req.params.userId} deleted`);
});

// ------------------------------------
// Project Routes (Core Feature)
// ------------------------------------
app.post("/api/projects", (req, res) => {
    res.send("Project created");
});

app.get("/api/projects", (req, res) => {
    res.send("All projects");
});

app.get("/api/projects/:projectId", (req, res) => {
    res.send(`Project ${req.params.projectId}`);
});

app.put("/api/projects/:projectId", (req, res) => {
    res.send(`Project ${req.params.projectId} updated`);
});

app.delete("/api/projects/:projectId", (req, res) => {
    res.send(`Project ${req.params.projectId} deleted`);
});

// ------------------------------------
// Collaboration Routes
// ------------------------------------
app.post("/api/projects/:projectId/join", (req, res) => {
    res.send(`Joined project ${req.params.projectId}`);
});

app.post("/api/projects/:projectId/leave", (req, res) => {
    res.send(`Left project ${req.params.projectId}`);
});

app.get("/api/projects/:projectId/collaborators", (req, res) => {
    res.send(`Collaborators of project ${req.params.projectId}`);
});

// ------------------------------------
// Fallback Route (Always LAST)
// ------------------------------------
app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
});

// ------------------------------------
// Start Server
// ------------------------------------
app.listen(3005, () => {
    console.log("Server running on port 3005");
});
