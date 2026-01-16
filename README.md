# 🚀 Gittogether – Backend for a Developer Matching Platform

Gittogether is a **production-style backend system inspired by Tinder / LinkedIn-style connections**, built while following **Namaste Node.js by Akshay Saini**.

The focus of this project is **clean architecture, real-world backend practices, scalability, and backend-first thinking**.

> This project is not just about APIs — it’s about **thinking like a backend engineer**.

---

## 🧠 What is Gittogether?

**Gittogether** is a developer connection platform where users can:

* Discover new developers
* Send & receive connection requests
* Accept, reject, or ignore requests
* Build meaningful professional connections
* Browse a smart, filtered feed (similar to Tinder / LinkedIn)

All powered by a **secure, scalable Node.js backend**.

---

## 🏗️ High-Level Features Implemented

### ✅ Core Backend Features

* User Signup & Login APIs
* Password encryption using **bcrypt**
* **JWT-based authentication**
* Secure authentication using **HTTP-only cookies**
* Auth middleware for protected routes
* Clean, RESTful API design
* MongoDB schema modeling using **Mongoose**

---

### 🔐 Authentication & Security

* Password hashing using bcrypt
* JWT token generation & verification
* Tokens stored securely in cookies (HTTP-only)
* Centralized authentication middleware
* Token expiry handling & auto logout behavior
* No trust on client-side data

---

### 🤝 Connection Request System

* Dedicated **ConnectionRequest schema**
* Requests flow: `fromUserId → toUserId`
* Controlled request statuses using enums:

  * `interested`
  * `accepted`
  * `rejected`
  * `ignored`
* Strict business rules while reviewing requests
* Prevention of duplicate requests using **compound indexes**

---

### 🧩 Database Design (LLD Focus)

* Clean separation of schemas
* Relationships using `ref`
* Data fetching using `populate`
* Indexing for performance optimization
* Compound indexes for scalability
* Automatic timestamps for lifecycle tracking

---

### 📰 Feed System (Tinder / Instagram Style)

The feed shows **only relevant & new profiles**.

The feed automatically excludes:

* The logged-in user
* Already connected users
* Users who are ignored
* Users who are rejected
* Users with existing connection requests

Built using **real-world MongoDB query logic**.

---

### 📄 Pagination

* Efficient feed loading
* `skip` & `limit` based pagination
* Optimized for large datasets
* Better performance & user experience

---

### ⚙️ Validation & Sanitization

* API-level input validation
* Database-level validation using Mongoose
* Custom validators
* External validation libraries
* Strong principle: **Never trust `req.body`**

---

## 📚 Learning-Oriented Project Structure

* Each lecture has its **own `.md` file**
* Concepts explained in **Hinglish (Hindi + English)**
* Covers:

  * Thought process
  * Design decisions
  * Backend best practices
* Easy to revise & interview-ready

---

## 🛠️ Tech Stack

* **Node.js**
* **Express.js**
* **MongoDB**
* **Mongoose**
* **JWT**
* **bcrypt**
* **cookie-parser**

---

## 🎯 Why This Project Matters

This project helped me understand:

* How real-world backend systems are designed
* Why schema & database design matters
* How to think before writing APIs
* How authentication & authorization actually work
* How scalable systems are built step-by-step

> This is not a tutorial project —
> **this is a backend engineering journey.**

---

## 🔥 One-Line Summary

**Gittogether** is a production-grade backend for a developer connection platform, built with clean architecture, secure authentication, smart feed logic, and real-world database design — fully documented lecture-by-lecture.

---

## 🙌 Credits

Inspired by **Namaste Node.js – Akshay Saini**

---

⭐ If you like this project, feel free to star the repository and explore the notes!
