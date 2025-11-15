# Backend Authentication Module Documentation

## Overview of Authentication Module
The authentication module handles everything related to user accounts and security. Its main job is to:
- Let new users create accounts (registration)
- Let existing users sign in (login)
- Let users sign out (logout)
- Keep track of who is logged in using "sessions" (like a temporary pass that proves you're logged in)
- Protect certain parts of the app so only logged-in users can access them (using middleware)

Key concepts:
- **Sessions**: A way to remember users without storing passwords. Each session has a unique token (like a ticket) that expires after 24 hours.
- **Password Hashing**: Passwords are never stored as plain text. They're "hashed" (scrambled) using bcrypt, so even if someone hacks the database, they can't read the passwords.
- **Middleware**: Code that runs before your main handlers to check if the user is logged in. If not, it blocks the request.

The module is split into files for organization:
- `handler/auth.go`: The main functions that handle HTTP requests (register, login, logout)
- `auth/session.go`: Functions for creating and managing sessions
- `auth/password.go`: Functions for hashing and checking passwords
- `auth/validation.go`: Functions to check if user input (like email, password) is valid
- `auth/context.go`: Helper to get user info from requests
- `middleware.go`: Code to protect routes
- Models and repo files for data and database access

## Data Models
These are the structures that hold user and request data. They're defined in `internal/models/`.

### User struct (from `user.go`)
```go
type User struct {
    ID           int        `json:"id"`
    Nickname     string     `json:"nickname"`
    Email        string     `json:"email"`
    PasswordHash string     `json:"-"` // Not sent to client
    FirstName    string     `json:"firstName"`
    LastName     string     `json:"lastName"`
    Age          int        `json:"age"`
    Gender       string     `json:"gender"`
    CreatedAt    time.Time  `json:"createdAt"`
    LastLogin    *time.Time `json:"lastLogin,omitempty"`
    IsOnline     bool       `json:"isOnline"`
}
```
This represents a user in the database. Note `PasswordHash` has `json:"-"` so it's never sent to the frontend.

### Session struct
```go
type Session struct {
    UserID    int
    Token     string
    Expiry    time.Time
    CreatedAt time.Time
}
```
A session links a user to a token that expires.

### Request structs (from `register.go`)
```go
type RegisterRequest struct {
    Nickname  string `json:"nickname"`
    Email     string `json:"email"`
    Password  string `json:"password"`
    FirstName string `json:"firstName"`
    LastName  string `json:"lastName"`
    Age       int    `json:"age"`
    Gender    string `json:"gender"`
}

type LoginRequest struct {
    Identifier string `json:"identifier"` // Email or nickname
    Password   string `json:"password"`
}
```
These are what the frontend sends in JSON.

## Password Security
Passwords are handled securely using bcrypt (a strong hashing algorithm).

### HashPassword (from `password.go`)
```go
func HashPassword(password string) (string, error) {
    hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
    if err != nil {
        return "", err
    }
    return string(hashedPassword), nil
}
```
This takes a plain password and returns a scrambled version. The "cost" makes it slow to crack.

**Built-in explanation**: `bcrypt.GenerateFromPassword` is from the `golang.org/x/crypto/bcrypt` package. It takes a byte slice of the password and a cost (difficulty level). It generates a salted hash using the Blowfish cipher. The cost determines how many rounds of hashing (higher = slower, more secure). It returns the hashed password as bytes, which we convert to string.

### CheckPasswordHash
```go
func CheckPasswordHash(password, hash string) bool {
    err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
    return err == nil
}
```
This checks if a plain password matches the hashed one. Returns true if they match.

**Built-in explanation**: `bcrypt.CompareHashAndPassword` compares a hashed password (from DB) with a plain password. It extracts the salt from the hash and re-hashes the plain password to compare. If they match, no error is returned. This prevents timing attacks by being constant-time.

## Input Validation
Before creating a user, the system checks if the data is valid.

### ValidateRegisterRequest (from `validation.go`)
```go
func ValidateRegisterRequest(req *models.RegisterRequest) error {
    // Trim spaces
    req.Nickname = strings.TrimSpace(req.Nickname)
    // ... trim other fields

    if req.Nickname == "" || req.FirstName == "" || req.LastName == "" {
        return errors.New("nickname, first name, and last name cannot be empty")
    }

    if _, err := mail.ParseAddress(req.Email); err != nil {
        return errors.New("invalid email format")
    }

    if len(req.Password) < 8 {
        return errors.New("password must be at least 8 characters long")
    }

    hasUpper := false
    for _, r := range req.Password {
        if unicode.IsUpper(r) {
            hasUpper = true
            break
        }
    }
    if !hasUpper {
        return errors.New("password must contain at least one uppercase letter")
    }

    if req.Age <= 13 || req.Age > 120 {
        return errors.New("age must be between 14 and 120")
    }

    return nil
}
```
This ensures data is clean and meets rules (no empty fields, valid email, strong password, reasonable age).

**Built-in explanations**:
- `strings.TrimSpace`: From `strings` package. Removes leading/trailing whitespace from a string. Useful for cleaning user input.
- `mail.ParseAddress`: From `net/mail` package. Parses an email address string and returns an `*mail.Address` if valid, or error if invalid. It checks basic email format (local@domain).
- `unicode.IsUpper`: From `unicode` package. Checks if a rune (character) is an uppercase letter. We loop through password runes to ensure at least one uppercase.
- `errors.New`: From `errors` package. Creates a new error with a message string. Simple way to return custom errors.

## Session Management
Sessions let the app remember users without storing passwords.

### CreateSession (from `session.go`)
```go
func CreateSession(userID int) (string, error) {
    token, err := uuid.NewV4() // Generate unique token
    if err != nil {
        return "", err
    }

    sessionToken := token.String()
    expiry := time.Now().Add(24 * time.Hour)

    // Insert into database
    stmt, err := repo.DB.Prepare(`INSERT INTO sessions (user_id, token, expiry) VALUES (?, ?, ?)`)
    // ... execute
    return sessionToken, nil
}
```
Creates a new session in the DB with a UUID token.

**Built-in explanations**:
- `uuid.NewV4()`: From `github.com/gofrs/uuid` package. Generates a random UUID version 4 (universally unique identifier). It's a 128-bit number, almost guaranteed unique. We convert to string for storage.
- `time.Now()`: From `time` package. Returns the current local time as a `time.Time` value.
- `time.Now().Add(24 * time.Hour)`: Adds 24 hours to the current time. `time.Hour` is a constant for 1 hour duration.

### SetSessionCookie
```go
func SetSessionCookie(w http.ResponseWriter, token string) {
    http.SetCookie(w, &http.Cookie{
        Name:     "session_token",
        Value:    token,
        Path:     "/",
        Expires:  time.Now().Add(24 * time.Hour),
        HttpOnly: true, // Can't be read by JavaScript
        Secure:   false, // Set to true in production
        SameSite: http.SameSiteLaxMode,
    })
}
```
Sends the token as a cookie to the browser. HttpOnly prevents JavaScript access (security).

**Built-in explanation**: `http.SetCookie` is from `net/http` package. It sets a cookie on the HTTP response. The `http.Cookie` struct has fields like Name, Value, Path (where cookie is valid), Expires (when it expires), HttpOnly (prevents JS access), Secure (only over HTTPS), SameSite (CSRF protection).

### GetSessionByToken
Retrieves session from DB and checks expiry.

### DeleteSession
Removes session from DB.

## Handlers Breakdown

### RegisterHandler (from `handler/auth.go`)
Handles new user signup.

Flow:
```
User sends POST /register with JSON data
→ Handler parses JSON into RegisterRequest
→ Validates input (email format, password strength, etc.)
→ Checks if email/nickname already exists in DB
→ Hashes password
→ Creates User model and saves to DB
→ Returns success JSON
```

Key code:
```go
// Parse JSON
var req models.RegisterRequest
err := json.NewDecoder(r.Body).Decode(&req)

// Validate
if err := auth.ValidateRegisterRequest(&req); err != nil {
    RespondWithError(w, http.StatusBadRequest, err.Error())
    return
}

// Check duplicates
existingUser, err := repo.GetUserByEmail(req.Email)
if existingUser != nil {
    RespondWithError(w, http.StatusConflict, "Email is already in use")
    return
}

// Hash password
hashedPassword, err := auth.HashPassword(req.Password)

// Create user
user := &models.User{ /* fill fields */ }
err = repo.CreateUser(user)
```

**Built-in explanations**:
- `json.NewDecoder(r.Body).Decode(&req)`: From `encoding/json` package. `json.NewDecoder` creates a decoder that reads from `r.Body` (the request body). `Decode` unmarshals JSON into the struct. `r.Body` is an `io.Reader`.
- `http.StatusBadRequest`, `http.StatusConflict`: Constants from `net/http` for HTTP status codes (400 for bad request, 409 for conflict).

### LoginHandler
Handles user sign-in.

Flow:
```
User sends POST /login with identifier (email/nickname) + password
→ Handler parses JSON
→ Looks up user by email or nickname
→ If user exists, checks password hash
→ If password correct, creates session
→ Sets session cookie
→ Returns success JSON with user details
```

Key code:
```go
// Parse request
var req models.LoginRequest
json.NewDecoder(r.Body).Decode(&req)

// Find user
user, err := repo.GetUserByEmailOrNickname(req.Identifier)
if user == nil {
    RespondWithError(w, http.StatusUnauthorized, "Invalid credentials")
    return
}

// Check password
if !auth.CheckPasswordHash(req.Password, user.PasswordHash) {
    RespondWithError(w, http.StatusUnauthorized, "Invalid credentials")
    return
}

// Create session
sessionToken, err := auth.CreateSession(user.ID)
auth.SetSessionCookie(w, sessionToken)

// Return user data
response := map[string]interface{}{
    "message": "Login successful!",
    "user":    userDetails,
}
json.NewEncoder(w).Encode(response)
```

**Built-in explanations**:
- `json.NewEncoder(w).Encode(response)`: From `encoding/json`. `json.NewEncoder` creates an encoder that writes to `w` (response writer). `Encode` marshals the map to JSON and writes it.

### LogoutHandler
Handles sign-out.

Flow:
```
User sends POST /logout
→ Handler gets session cookie
→ Deletes session from DB
→ Clears cookie from browser
→ Returns success JSON
```

**Built-in explanations**:
- `r.Cookie("session_token")`: From `net/http`. Retrieves a cookie by name from the request. Returns `*http.Cookie` or error if not found.

## Middleware
### AuthMiddleware (from `middleware.go`)
Protects routes that need login.

Flow:
```
Request comes in
→ Middleware checks for session_token cookie
→ If no cookie, return 401 Unauthorized
→ If cookie, get session from DB
→ If session expired or invalid, clear cookie and return 401
→ If valid, get user from DB
→ Add user to request context
→ Call next handler
```

Key code:
```go
func AuthMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        cookie, err := r.Cookie("session_token")
        if err != nil {
            handler.RespondWithError(w, http.StatusUnauthorized, "Authentication required")
            return
        }

        session, err := auth.GetSessionByToken(cookie.Value)
        if session == nil || session.Expiry.Before(time.Now()) {
            auth.ClearSessionCookie(w)
            handler.RespondWithError(w, http.StatusUnauthorized, "Invalid session")
            return
        }

        user, err := repo.GetUserByID(session.UserID)
        // ... error handling

        ctx := context.WithValue(r.Context(), models.UserContextKey, user)
        r = r.WithContext(ctx)

        next.ServeHTTP(w, r)
    })
}
```

**Built-in explanations**:
- `http.Handler`: Interface from `net/http`. Has `ServeHTTP(ResponseWriter, *Request)` method. Middleware wraps handlers.
- `http.HandlerFunc`: Type from `net/http`. Converts a func to `http.Handler`. Used for inline handlers.
- `context.WithValue(r.Context(), models.UserContextKey, user)`: From `context` package. `context.WithValue` creates a new context with a key-value pair. Used to pass user data down the request chain.
- `r.WithContext(ctx)`: Sets the context on the request.

Routes use it like: `AuthMiddleware(http.HandlerFunc(handler.CreatePostHandler))`

## Routes Setup
In `routes.go`, auth routes are registered:
```go
mux.HandleFunc("/register", handler.RegisterHandler)
mux.HandleFunc("/login", handler.LoginHandler)
mux.HandleFunc("/logout", handler.LogoutHandler)
mux.HandleFunc("/api/auth/status", func(w http.ResponseWriter, r *http.Request) {
    AuthMiddleware(statusHandler).ServeHTTP(w, r)
})
```
The status route checks if user is logged in.

**Built-in explanation**: `http.ServeMux` (mux) from `net/http`. A request multiplexer that matches URL paths to handlers. `HandleFunc` registers a pattern and handler func.

## Database Layer
Key functions in `repo/users.go`:
- `CreateUser`: Inserts new user, handles duplicate errors.
- `GetUserByEmail/ByNickname/ByEmailOrNickname`: Fetch users for validation/login.
- `GetUserByID`: Get user by ID (used in middleware).
- `GetAllUsers`: List all users (for chat features).

Uses SQLite with prepared statements for security.

**Built-in explanations** (for DB operations):
- `DB.Prepare`: From `database/sql`. Prepares a SQL statement for execution. Prevents SQL injection by separating query from data.
- `stmt.Exec`: Executes the prepared statement with parameters.
- `stmt.QueryRow`: Executes query and returns a single row scanner.
- `row.Scan`: Scans values from the row into variables.

## Improvements
The code is solid, but suggestions:
- Add rate limiting to prevent brute-force attacks on login.
- Use HTTPS in production (set Secure: true on cookies).
- Add password reset functionality.
- Log more security events (failed logins).
- Consider JWT tokens instead of DB sessions for scalability, but DB sessions are fine for this scale.
- In validation, check for common weak passwords or add more rules.
