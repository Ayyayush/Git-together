# GitTogether – Backend

GitTogether is the backend for a developer networking and collaboration platform where developers can discover other developers, build professional connections, and communicate in real time.

The backend is built using Node.js, Express.js, MongoDB, Mongoose, Socket.io, JWT, bcrypt, and Groq/LangChain for optional AI-generated recommendation explanations.

---

## 🌐 Live API

Backend: https://git-together-xhn9.onrender.com

---

## 🧠 What is GitTogether?

GitTogether is a networking platform designed specifically for developers.

Users can:

- Create and manage developer profiles
- Discover other developers
- Search developers by skills and professional information
- Receive developer recommendations
- Send and manage connection requests
- Build professional connections
- Chat in real time
- Receive notifications

The goal is to make it easier for developers to find relevant people for projects, hackathons, open-source work, and technical collaboration.

---

# ✨ Major Features

## 🔐 Authentication & Authorization

- User signup
- User login
- Logout
- JWT authentication
- HTTP-only cookie authentication
- Protected routes
- Authentication middleware
- Password hashing using bcrypt
- Username validation
- Username availability checking
- Secure session handling

The backend is treated as the source of truth for authentication and authorization.

---

## 👤 Developer Profiles

Users can maintain professional developer profiles containing information such as:

- Username
- Profile photo
- About
- Skills
- Developer title
- College
- Degree
- Graduation year
- Company
- Experience level
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
- Personal website
- Availability
- Projects

---

## 📊 Profile Strength

The backend calculates profile completeness based on information provided by the developer.

Factors include:

- About/Bio
- Skills
- Projects
- Resume
- Portfolio
- Education
- Experience
- Social links
- Availability

This helps users identify incomplete areas of their profiles.

---

## 🔍 Developer Search

Developers can search for other users using:

- Username
- First name
- Last name
- Skills
- Developer title
- Company
- College

Search functionality includes:

- Case-insensitive matching
- Regex-based search
- Authentication protection
- Logged-in user exclusion
- Limited search results

---

## 📰 Developer Feed

The developer feed provides profiles that are eligible for discovery.
The feed filters out users such as:

- The logged-in user
- Existing connections
- Pending connection requests
- Ignored users
- Previously reviewed users

The feed also supports:

- Pagination
- MongoDB filtering
- Optimized queries
- Profile-based sorting

---

## 🤝 Connection System

Users can:

- Send connection requests
- Accept requests
- Reject requests
- Ignore requests
- View pending requests
- View accepted connections

The backend validates connection requests to prevent:

- Self requests
- Duplicate requests
- Invalid request reviews

Connection relationships are stored separately from user profile data using the `ConnectionRequest` model.

---

## 🤝 Developer Recommendations

GitTogether includes a rule-based developer recommendation system.

Developers are ranked using profile information such as:

- Common skills
- Developer title
- Company
- College
- Experience level
- Availability
- Location

Each matching factor contributes to a recommendation score.

The candidates are then ranked based on their score and the highest-ranked developers are returned as recommendations.

For the highest-ranked recommendations, Groq/LangChain can be used to generate an explanation of why the developers are a potential match.

The AI is used for the explanation only.

**The recommendation ranking itself is rule-based.**

---

## 💬 Real-Time Chat

Real-time communication is implemented using Socket.io.

Features include:

- Real-time messaging
- Conversation management
- Chat history
- Persistent message storage
- Seen status
- Typing indicator
- Online/offline status
- Last seen
- Conversation retrieval

Messages are persisted in MongoDB so that chat history remains available after the real-time connection ends.

---

## 🔔 Notifications

The backend supports notifications for important activities such as:

- Connection requests
- Messages

Notifications are stored in MongoDB and can be retrieved through REST APIs.

---

# 🗄️ Database Design

GitTogether uses MongoDB with Mongoose.

Main models include:

- User
- ConnectionRequest
- Chat
- Notification

The application uses:

- ObjectId references
- Embedded documents
- `populate()`
- MongoDB indexes

### User

Stores developer profile information.

### ConnectionRequest

Stores the relationship between two developers and the request status.

Example:

```js
{
  fromUserId,
  toUserId,
  status
}