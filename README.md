# 🚀 GitTogether – Backend

GitTogether Backend is a **production-ready backend** powering an AI-enabled Developer Networking Platform. Built using **Node.js, Express.js, MongoDB, Socket.io, JWT, LangChain, and Groq**, it delivers secure authentication, intelligent developer discovery, real-time messaging, AI-powered recommendations, and scalable REST APIs.

The project follows **modular architecture**, **clean engineering practices**, and a **backend-first design philosophy**, making it suitable for real-world deployment and large-scale applications.

---

# 🌐 Live API

🔗 Backend: https://git-together-xhn9.onrender.com

---

# 🧠 What is GitTogether?

GitTogether is a professional networking platform built exclusively for developers.

Users can:

- 👨‍💻 Create professional developer profiles
- 🔍 Discover developers intelligently
- 🤝 Build professional connections
- 💬 Chat in real-time
- 🤖 Receive AI-powered developer recommendations
- 🧠 Optimize profiles using AI Profile Coach
- ⭐ Upgrade to premium memberships

The backend combines concepts from **LinkedIn**, **GitHub**, and **modern AI-powered networking platforms**.

---

# ✨ Major Features

---

## 🔐 Authentication & Authorization

- Secure Signup
- Secure Login
- Logout
- JWT Authentication
- HTTP-only Cookie Authentication
- Protected Routes
- Public Routes
- Authentication Middleware
- Password Hashing using bcrypt
- Username Validation
- Username Availability Checking
- Username Completion Flow for Legacy Users
- Secure Session Management

---

## 👤 Professional Developer Profiles

Developers maintain rich public profiles.

Supported fields include:

- Username
- Profile Photo
- About
- Skills
- Developer Title
- College
- Degree
- Graduation Year
- Company
- Experience Level
- Location
- Portfolio
- Resume
- GitHub
- LinkedIn
- LeetCode
- Codeforces
- CodeChef
- HackerRank
- Twitter
- Personal Website
- Availability
- Projects

---

## 📊 Automatic Profile Strength

The backend calculates profile completeness automatically.

Factors include:

- Bio
- Skills
- Projects
- Resume
- Portfolio
- Education
- Experience
- Social Links
- Availability

This encourages users to build stronger professional profiles.

---

## 🔍 Smart Developer Search

Production-ready developer search.

Search supports:

- Username
- First Name
- Last Name
- Skills
- Developer Title
- Company
- College

Features:

- Case-insensitive search
- Regex search
- Protected endpoint
- Maximum 10 results
- Premium users ranked first
- Logged-in user excluded

---

## 🤝 Connection System

Professional networking workflow.

Users can:

- Send Connection Requests
- Accept Requests
- Reject Requests
- Ignore Requests
- View Pending Requests
- View Accepted Connections

Business rules prevent:

- Duplicate requests
- Self requests
- Invalid request reviews

---

## 📰 Smart Feed

The feed intelligently excludes:

- Logged-in user
- Existing connections
- Ignored developers
- Pending requests
- Already reviewed users

Supports:

- Pagination
- Optimized MongoDB queries
- Smart filtering
- Premium-first sorting

---

## 💬 Real-Time Chat

Built using Socket.io.

Features:

- Real-time messaging
- Conversation management
- Chat history
- Seen status
- Typing indicator
- Online / Offline status
- Last Seen
- Conversation search
- Persistent MongoDB storage

---

## 🤖 AI Recommendation Engine

GitTogether includes an AI-powered recommendation engine.

Recommendations are generated based on:

- Shared Skills
- Developer Title
- Company
- College
- Experience
- Availability
- Matching Score

Top recommendations are enriched using AI-generated explanations.

---

## 🧠 LangChain Integration

The AI layer is built using:

- LangChain
- ChatGroq
- PromptTemplate
- Structured Output Parsing

LangChain is used to generate structured recommendation explanations while preserving deterministic recommendation ranking.

---

## 🤖 AI Profile Coach

Users can optimize their profiles using AI.

The coach analyzes:

- Skills
- Projects
- Resume
- Portfolio
- Social Links
- About Section
- Profile Strength

Returns:

- Overall Score
- Missing Fields
- Suggested Improvements
- Better Bio Suggestions
- Recommended Skills

---

## 🔔 Notification System

Supports:

- Connection Request Notifications
- Message Notifications

Notification APIs are designed for scalable real-time updates.

---

## 👑 Premium Membership

Premium infrastructure includes:

- Premium Status
- Premium Type
- Premium Expiry
- Razorpay Order ID
- Razorpay Payment ID

Provides the foundation for premium networking features.

---

## 📂 Project Showcase

Developers can maintain multiple projects.

Each project supports:

- Title
- Description
- GitHub Repository
- Live Demo
- Tech Stack
- Project Image

---

# 🗄️ Database Design

Production-oriented MongoDB modeling.

Schemas include:

- User
- ConnectionRequest
- Chat
- Notification
- Embedded Project
- Embedded Messages

Relationships use:

- ObjectId References
- Populate
- Indexes
- Embedded Documents

---

# 🔒 Security

Backend follows:

> Never trust client input.

Security features include:

- JWT Authentication
- HTTP-only Cookies
- bcrypt Password Hashing
- Authentication Middleware
- Mongoose Validation
- Email Validation
- URL Validation
- Enum Validation
- Username Validation
- Protected APIs

---

# ⚡ Performance Optimizations

Implemented optimizations:

- MongoDB Indexes
- Pagination
- Lean Queries
- Optimized Populate
- Modular Routing
- RESTful Architecture
- Efficient Recommendation Pipeline
- AI calls limited to top recommendations

---

# 📡 REST API Modules

## Authentication

- POST /signup
- POST /login
- POST /logout
- GET /user/check-username

---

## Profile

- GET /profile/view
- PATCH /profile/edit
- GET /user/profile/:userId

---

## Feed

- GET /feed

---

## Search

- GET /user/search

---

## Connections

- GET /user/connections
- GET /user/requests
- POST /request/send/:status/:toUserId
- POST /request/review/:status/:requestId

---

## AI

- GET /user/recommendations
- POST /profile/coach

---

## Notifications

- GET /notifications

---

## Chat

Socket.io Events

- joinChat
- sendMessage
- messageReceived
- typing
- messagesSeen
- userStatusChanged

REST APIs

- GET /chat/:targetUserId
- GET /chats/conversations

---

# 🛠️ Tech Stack

## Backend

- Node.js
- Express.js

## Database

- MongoDB
- Mongoose

## Authentication

- JWT
- bcrypt
- cookie-parser

## AI

- LangChain
- ChatGroq
- Groq API

## Real-Time

- Socket.io

## Payments

- Razorpay

## Validation

- validator

---

# 📁 Project Structure

```
src/
│
├── config/
├── middlewares/
├── models/
├── routes/
├── services/
├── socket/
├── utils/
├── app.js
```

---

# 🏗️ Backend Architecture

```
Client
   │
   ▼
Express Routes
   │
Authentication Middleware
   │
Business Logic
   │
MongoDB
   │
LangChain AI Layer
   │
Socket.io
```

---

# 🎯 Engineering Concepts Demonstrated

- JWT Authentication
- Cookie Authentication
- REST API Design
- MongoDB Modeling
- Socket.io
- Real-Time Communication
- LangChain Integration
- LLM Integration
- AI Recommendation Systems
- AI Profile Analysis
- Middleware Design
- Modular Architecture
- Pagination
- Production Security
- Clean Backend Architecture

---

# 🚀 Future Improvements

- Docker
- Docker Compose
- CI/CD (GitHub Actions)
- AWS EC2 Deployment
- Nginx Reverse Proxy
- Email Verification
- Forgot Password Flow
- OAuth Login
- Cloudinary File Uploads
- Push Notifications
- Group Chat
- Video Calling

---

# 📚 Learning

This project was initially inspired by **Namaste Node.js by Akshay Saini** and was later extended into a production-style backend featuring AI integration, intelligent recommendation systems, professional networking workflows, and scalable architecture.

---

# ⭐ One-Line Summary

**GitTogether Backend is a production-ready AI-powered backend for a developer networking platform featuring secure authentication, intelligent developer discovery, LangChain-powered recommendations, AI profile coaching, real-time messaging, professional networking, and scalable REST APIs.**

---

# 🙌 Credits

Inspired by **Namaste Node.js – Akshay Saini**

Extended with:

- AI Recommendation Engine
- LangChain Integration
- AI Profile Coach
- Smart Developer Search
- Public Developer Profiles
- Real-Time Chat
- Premium Membership Infrastructure
- Notification System
- Production-Oriented Backend Architecture

---

⭐ **If you found this project useful, consider giving it a Star!**