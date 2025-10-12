real-time-forum/
├── cmd/
│   └── server/
│       └── main.go         # Main application entry point
├── internal/
│   ├── http/
│   │   ├── middleware.go   # HTTP middleware (e.g., auth, logging)
│   │   ├── routes.go       # Route definitions and handlers mapping
│   │   └── responses.go    # Standardized JSON response helpers
│   ├── auth/
│   │   ├── session.go      # Session and cookie management
│   │   └── password.go     # Password hashing and validation
│   ├── ws/
│   │   ├── hub.go          # Central hub for managing WebSocket clients
│   │   ├── client.go       # Represents a single WebSocket client
│   │   └── events.go       # Defines and handles WebSocket event logic
│   ├── repo/
│   │   ├── db.go           # Database connection and migration logic
│   │   ├── users.go        # User-related database queries
│   │   ├── posts.go        # Post-related database queries
│   │   ├── comments.go     # Comment-related database queries
│   │   └── messages.go     # Private message database queries
│   ├── models/
│   │   ├── user.go         # User and Session data models
│   │   ├── post.go         # Post and Category data models
│   │   ├── comment.go      # Comment data model
│   │   └── message.go      # Private Message data model
│   └── util/
│       ├── id.go           # Utility for generating unique IDs
│       └── time.go         # Time formatting and helper functions
├── migrations/
│   └── 001_init.sql      # Initial database schema migration
├── public/
│   ├── index.html        # The single HTML file for the SPA
│   ├── css/
│   │   └── style.css     # Main stylesheet
│   └── js/
│       ├── app.js          # Main frontend application logic
│       ├── router.js       # Client-side router for SPA navigation
│       ├── api.js          # Client-side API request handler
│       ├── ws.js           # WebSocket connection and event handling
│       ├── state.js        # Global state management for the frontend
│       ├── utils/
│       │   ├── debounce.js   # Debounce utility function
│       │   ├── throttle.js   # Throttle utility function
│       │   ├── time.js       # Time formatting helpers
│       │   └── dom.js        # DOM manipulation helpers
│       └── ui/
│           ├── auth.js       # Renders and manages auth forms
│           ├── sidebar.js    # Renders the user list/sidebar
│           ├── feed.js       # Renders the post feed
│           ├── postDetail.js # Renders a single post and its comments
│           └── chat.js       # Renders the real-time chat interface
├── go.mod                  # Go module dependencies
├── go.sum                  # Go module checksums
├── Makefile                # Helper commands for building/running the project
└── README.md               # This file! Project overview and documentation

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