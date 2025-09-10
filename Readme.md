# Real-Time Forum

## Project Overview

Real-Time Forum is a full-stack web application built with **Golang**, **SQLite**, **HTML/CSS/JS**, and **WebSockets**.
It is a **Single Page Application (SPA)** where users can register, login, create posts, comment, and chat in real-time.

---

## 📂 Folder Structure

```
real-time-forum/
│
├── backend/              # Go backend
│   ├── main.go           # Entry point: HTTP + WebSocket server
│   ├── handlers.go       # HTTP handlers: auth, posts, comments
│   ├── ws.go             # WebSocket hub for real-time messages
│   ├── db.go             # SQLite connection + migrations
│   ├── models.go         # Structs: User, Post, Comment, Message
│   ├── auth.go           # Registration, login, logout, sessions
│   └── utils.go          # Helpers: hashing, UUID, etc.
│
├── frontend/             # Client-side
│   ├── index.html        # Single Page Application
│   ├── style.css         # Styles
│   ├── app.js            # SPA controller (show/hide sections)
│   ├── auth.js           # Login / Register logic
│   ├── posts.js          # Posts + comments logic
│   ├── chat.js           # Private messaging + WebSocket logic
│   └── ui.js             # DOM helpers (render data, show/hide)
│
├── forum.db              # SQLite database (created at runtime)
├── go.mod                # Go modules
└── go.sum                # Go modules lock
```

---

## 💡 Features

### Frontend (SPA)

* Registration / Login forms
* Posts feed with categories
* Commenting on posts
* Private messaging with online/offline users
* Real-time updates via WebSockets
* SPA navigation (show/hide sections without reload)

### Backend (Golang)

* HTTP server serving SPA and APIs
* WebSocket hub for real-time chat
* SQLite database for storing users, posts, comments, messages
* Authentication: register, login, logout, sessions
* Password hashing with bcrypt
* UUID generation for unique IDs

---

## 🗓 10-Day Development Plan

| Day | Task                                                                                      |
| --- | ----------------------------------------------------------------------------------------- |
| 1   | Setup folder structure and empty files, create `index.html` and `style.css`.              |
| 2   | Setup Go server (`main.go`) and serve static frontend files.                              |
| 3   | Connect to SQLite database (`db.go`) and create tables: users, posts, comments, messages. |
| 4   | Implement registration backend (`auth.go`) and connect with `auth.js`.                    |
| 5   | Implement login backend and session handling. Test login/register flows.                  |
| 6   | Implement posts creation and fetching (`posts.js` + handlers.go).                         |
| 7   | Implement comments creation and fetching for posts.                                       |
| 8   | Implement WebSocket hub (`ws.go`) for private messaging.                                  |
| 9   | Implement frontend chat logic (`chat.js`) and real-time updates.                          |
| 10  | Testing, debugging, CSS improvements, final touches, SPA polish.                          |

---

## 💡 Notes

* Always build feature by feature; do not jump to chat before auth works.
* Keep backend and frontend clearly separated.
* Use Go routines and channels for WebSocket real-time handling.
* Debounce/throttle scroll for loading older messages in chat.
* Only **standard Go packages** plus `gorilla/websocket`, `sqlite3`, `bcrypt`, and `uuid` are allowed.

---

This README serves as the **project roadmap** and guide for building the Real-Time Forum from scratch.
