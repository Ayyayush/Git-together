# 🚀 GitTogether – Backend for a Developer Networking Platform

GitTogether is a **production-style backend for a developer networking platform**, built using **Node.js, Express.js, MongoDB, Mongoose, JWT, Socket.io, and RESTful APIs**.

The project focuses on **clean architecture, scalable backend design, authentication, real-time communication, and production-ready engineering practices.**

> This project is built with a backend-first mindset while following industry-standard practices.

---

# 🧠 What is GitTogether?

GitTogether is a platform where developers can:

- 👨‍💻 Discover other developers
- 🤝 Build professional connections
- 💬 Chat in real time
- ⭐ Upgrade to premium memberships
- 📂 Showcase projects and developer profiles
- 🚀 Build a professional developer network

It combines ideas from platforms like **LinkedIn**, **GitHub**, and **real-time messaging applications** into one backend system.

---

# ✨ Major Features

## 🔐 Authentication & Authorization

- User Signup
- User Login
- Logout
- JWT Authentication
- HTTP-only Cookie Authentication
- Protected Routes
- Authentication Middleware
- Password Hashing using bcrypt
- Token Expiration Handling

---

## 👤 Developer Profile System

Developers can maintain rich professional profiles.

Supported profile fields include:

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

Profile strength is calculated automatically based on profile completeness.

It considers:

- Profile Photo
- Bio
- Skills
- Projects
- Resume
- Education
- Experience
- Social Links
- Availability

This encourages users to build complete developer profiles.

---

## 🤝 Connection System

GitTogether provides a professional networking workflow.

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
- Invalid review operations

---

## 📰 Smart Feed System

The feed intelligently filters developers.

It automatically excludes:

- Logged-in user
- Existing connections
- Ignored users
- Rejected users
- Users with pending requests

Features:

- Pagination
- MongoDB filtering
- Optimized queries
- Sorted by latest users

---

## 💬 Real-Time Chat (Socket.io)

GitTogether includes a production-style real-time messaging system.

Features:

- Socket.io Integration
- Room-based messaging
- Automatic room generation
- Persistent chat storage
- MongoDB chat history
- Read status support
- Real-time message delivery

---

## 💎 Premium Membership Foundation

The backend includes support for premium memberships.

Fields include:

- Premium Status
- Premium Type
- Premium Expiry
- Razorpay Order ID
- Razorpay Payment ID

This lays the foundation for payment integration using Razorpay.

---

## 📂 Project Showcase

Each developer can maintain multiple projects.

Every project supports:

- Title
- Description
- GitHub Repository
- Live Demo
- Tech Stack
- Project Image

---

## 🗄️ Database Design

Designed using production-style MongoDB modeling.

Includes:

- User Schema
- ConnectionRequest Schema
- Chat Schema
- Embedded Message Schema
- Embedded Project Schema

Relationships use:

- ObjectId References
- Populate
- Compound Indexes
- Embedded Documents

---

## 🔒 Validation & Security

The backend follows the principle:

> Never trust client input.

Validation includes:

- API Validation
- Mongoose Validation
- URL Validation
- Email Validation
- Enum Validation
- Password Hashing
- Secure Cookies
- Authentication Middleware

---

## ⚡ Performance Optimizations

Implemented optimizations include:

- Compound Indexes
- Pagination using Skip & Limit
- Population only when required
- Lean response payloads
- RESTful endpoint design
- Modular route architecture

---

# 📡 REST API Modules

## Authentication

- POST /signup
- POST /login
- POST /logout

---

## Profile

- GET /profile/view
- PATCH /profile/edit

---

## Connections

- POST /request/send/:status/:toUserId
- POST /request/review/:status/:requestId

---

## User

- GET /feed
- GET /user/requests
- GET /user/connections

---

## Chat

- Socket.io Events
  - joinChat
  - sendMessage
  - messageReceived

---

# 🛠️ Tech Stack

### Backend

- Node.js
- Express.js

### Database

- MongoDB
- Mongoose

### Authentication

- JWT
- bcrypt
- cookie-parser

### Real-Time Communication

- Socket.io

### Validation

- validator

---

# 📁 Project Architecture

The project follows a modular architecture.

```
src/
│
├── config/
├── middlewares/
├── models/
├── routes/
├── utils/
├── socket/
├── app.js
```

Each module has a single responsibility, making the project easier to maintain and scale.

---

# 🎯 What This Project Demonstrates

This project showcases practical backend engineering concepts such as:

- Authentication & Authorization
- REST API Design
- Database Modeling
- Business Logic Implementation
- Real-Time Communication
- Middleware Design
- Secure Cookie Authentication
- MongoDB Relationships
- Pagination
- Schema Validation
- Scalable Folder Structure
- Production-Oriented Coding Practices

---

# 🚀 Future Enhancements

Planned improvements include:

- Razorpay Payment Integration
- AI-powered Profile Coach
- Notification System
- Email Verification
- Forgot Password & Reset Password
- Recommendation Engine
- Advanced Developer Search
- Skill-based Matching
- File Uploads using Cloudinary
- Deployment with Docker & CI/CD

---

# 📚 Learning Resource

This project was built while learning backend engineering concepts through **Namaste Node.js by Akshay Saini**, and then extended with additional production-style features beyond the course.

---

# ⭐ One-Line Summary

**GitTogether is a scalable backend for a developer networking platform featuring secure authentication, smart developer discovery, professional networking, real-time chat, profile management, and a production-oriented architecture.**

---

# 🙌 Credits

Inspired by **Namaste Node.js – Akshay Saini**

Extended with additional production-style features including developer profiles, Socket.io chat, profile strength calculation, premium membership foundation, and scalable backend architecture.

---

⭐ If you found this project useful, consider giving it a **Star**!