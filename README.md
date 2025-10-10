real-time-forum/
├── cmd/
│   └── server/
│       └── main.go
├── internal/
│   ├── http/
│   │   ├── middleware.go
│   │   ├── routes.go
│   │   └── responses.go
│   ├── auth/
│   │   ├── session.go
│   │   └── password.go
│   ├── ws/
│   │   ├── hub.go
│   │   ├── client.go
│   │   └── events.go
│   ├── repo/
│   │   ├── db.go
│   │   ├── users.go
│   │   ├── posts.go
│   │   ├── comments.go
│   │   └── messages.go
│   ├── models/
│   │   ├── user.go
│   │   ├── post.go
│   │   ├── comment.go
│   │   └── message.go
│   └── util/
│       ├── id.go
│       └── time.go
├── migrations/
│   └── 001_init.sql
├── public/
│   ├── index.html
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── app.js
│       ├── router.js
│       ├── api.js
│       ├── ws.js
│       ├── state.js
│       ├── utils/
│       │   ├── debounce.js
│       │   ├── throttle.js
│       │   ├── time.js
│       │   └── dom.js
│       └── ui/
│           ├── auth.js
│           ├── sidebar.js
│           ├── feed.js
│           ├── postDetail.js
│           └── chat.js
├── go.mod
├── go.sum
├── Makefile
└── README.md

---

# README.md

## Project: Real-Time Forum

### Overview
This project is a **single-page real-time forum** built with **Go (backend)** and **Vanilla JS (frontend)**. It includes authentication, post and comment management, and a real-time private messaging system using WebSockets.

### Tech Stack
- **Backend:** Go, Gorilla/WebSocket, SQLite, bcrypt, uuid
- **Frontend:** HTML, CSS, Vanilla JavaScript (no frameworks)
- **Database:** SQLite
- **Architecture:** SPA (Single Page Application)

---

## Folder Structure
The folder layout follows a clean separation between backend logic and frontend resources.

- `cmd/server/`: entry point (main.go)
- `internal/http/`: HTTP handlers, routing, middleware
- `internal/auth/`: session and password management
- `internal/ws/`: WebSocket hub, clients, and events
- `internal/repo/`: database interactions (users, posts, comments, messages)
- `internal/models/`: data models
- `internal/util/`: helper utilities (ID generation, time)
- `migrations/`: SQL schema and migrations
- `public/`: frontend (HTML, CSS, JS)

---

## Project Objectives
- User registration & authentication
- Create/view posts with comments
- Private messages between users (real-time)
- Online/offline presence tracking
- Single-page navigation (handled by JS)

---

## Architecture Overview

### Backend (Go)
- REST API for auth, posts, comments, messages
- WebSocket hub to manage:
  - Online users
  - Private messages
  - Presence updates
- SQLite storage for persistence
- Secure session cookies (HttpOnly)

### Frontend (JS)
- One HTML file (`index.html`) containing placeholders for dynamic views
- JS handles routing, DOM updates, and WebSocket communication
- Components for:
  - Auth forms (login/register)
  - Feed (posts & comments)
  - Chat interface (real-time PMs)
  - Sidebar (online users)

---

## Team Roles & Tasks

### Member A — Backend Developer (Go)

#### Global Tasks
- Build and maintain the backend logic
- Manage database, API routes, and WebSocket communication
- Ensure session management and data security

#### Detailed Tasks
1. **Setup & Configuration**
   - Initialize Go module, SQLite connection, and server structure
   - Create `migrations/001_init.sql`
2. **Authentication System**
   - Implement user registration, login, logout
   - Password hashing (bcrypt)
   - Session creation and validation (cookies)
3. **Forum APIs**
   - CRUD for posts and comments
   - Category management
4. **WebSocket Hub**
   - Create `hub.go`, `client.go`, and `events.go`
   - Handle presence updates and private messages
5. **Database Repository**
   - Implement `users.go`, `posts.go`, `comments.go`, `messages.go`
6. **Testing & Documentation**
   - Write unit/integration tests
   - Document APIs in README

---

### Member B — Frontend Developer (JS)

#### Global Tasks
- Handle all user interactions and UI updates
- Implement SPA routing, WebSocket events, and dynamic rendering

#### Detailed Tasks
1. **Structure & Base**
   - Build `index.html`, `style.css`, and base layout
   - Implement router (`router.js`) and API client (`api.js`)
2. **Auth Pages**
   - Registration & login forms with validation
   - Manage login state and logout
3. **Feed (Posts & Comments)**
   - Render posts list, category filters, and post details
   - Add comment creation and display logic
4. **Chat (Private Messages)**
   - Create sidebar for users (online/offline)
   - Implement chat view, message history (load 10 by 10)
   - Real-time updates via `ws.js`
5. **Utilities & Enhancements**
   - Throttle and debounce scroll/search
   - DOM helpers for cleaner rendering
   - Time formatting (e.g., '5 min ago')

---

## Workflow & Collaboration

- **Branches**: each member has their own branch (`backend-dev`, `frontend-dev`)
- **Commits**: meaningful and frequent (e.g., `feat(auth): implement login form`)
- **Merging**: use PRs to main branch after testing integration
- **Communication**: daily sync on API/WS contract alignment

---

## Run & Build Instructions

1. **Setup**
   ```bash
   make migrate
   go run ./cmd/server
   ```
   Opens server at: http://localhost:8080

2. **Frontend Access**
   Open `http://localhost:8080` in browser.

3. **WebSocket**
   Auto-connects after login via `/ws` endpoint.

---

## Success Criteria
- Only one `index.html` (SPA)
- Secure registration/login with bcrypt + sessions
- Real-time chat and online presence updates
- Posts & comments CRUD via API
- Clean architecture and separation of concerns

---

## Suggested Timeline
| Day | Member A (Backend) | Member B (Frontend) |
|-----|--------------------|---------------------|
| 1-2 | Auth system & sessions | Layout & auth UI |
| 3-4 | Posts & comments APIs | Feed & post detail |
| 5-6 | WebSocket chat hub | Chat UI integration |
| 7 | Testing & docs | Styling & UX polish |

---

## License
MIT License (for educational use).