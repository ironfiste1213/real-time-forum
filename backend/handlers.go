package main

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
)

// RegisterRequest defines the shape of the registration request body.
type RegisterRequest struct {
	Nickname  string `json:"nickname"`
	Age       int    `json:"age"`
	Gender    string `json:"gender"`
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
	Email     string `json:"email"`
	Password  string `json:"password"`
}

// LoginRequest defines the shape of the login request body.
type LoginRequest struct {
	Identifier string `json:"identifier"` // Can be nickname or email
	Password   string `json:"password"`
}

func registerHandler(w http.ResponseWriter, r *http.Request) {
	log.Println("Register handler called")
	w.Header().Set("Content-Type", "application/json")

	if r.Method != http.MethodPost {
		log.Println("Wrong method:", r.Method)
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Println("JSON decode error:", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Basic validation
	if req.Nickname == "" || req.Email == "" || req.Password == "" {
		http.Error(w, "nickname, email and password are required", http.StatusBadRequest)
		return
	}

	// Check if nickname or email already exists
	var existingID int
	err := DB.QueryRow("SELECT id FROM users WHERE nickname = ? OR email = ?", req.Nickname, req.Email).Scan(&existingID)
	if err != nil && err != sql.ErrNoRows {
		log.Println("DB error checking existing user:", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	if err == nil {
		// found existing user
		w.WriteHeader(http.StatusConflict)
		json.NewEncoder(w).Encode(map[string]string{"message": "nickname or email already in use"})
		return
	}

	// Hash the password
	hashed, err := HashPassword(req.Password)
	if err != nil {
		log.Println("password hashing error:", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	// Insert the new user
	res, err := DB.Exec(`INSERT INTO users (nickname, email, password_hash, first_name, last_name, age, gender) VALUES (?, ?, ?, ?, ?, ?, ?)`,
		req.Nickname, req.Email, hashed, req.FirstName, req.LastName, req.Age, req.Gender)
	if err != nil {
		log.Println("DB insert error:", err)
		http.Error(w, "Failed to create user", http.StatusInternalServerError)
		return
	}

	id, err := res.LastInsertId()
	if err != nil {
		log.Println("Failed to get last insert id:", err)
		http.Error(w, "Failed to create user", http.StatusInternalServerError)
		return
	}

	// Load the inserted user row into the existing User struct and return it
	var user User
	// last_login can be NULL in the database; scan into sql.NullTime first
	var lastLogin sql.NullTime
	row := DB.QueryRow(`SELECT id, nickname, email, password_hash, first_name, last_name, age, gender, created_at, last_login, is_online FROM users WHERE id = ?`, id)
	if err := row.Scan(&user.ID, &user.Nickname, &user.Email, &user.PasswordHash, &user.FirstName, &user.LastName, &user.Age, &user.Gender, &user.CreatedAt, &lastLogin, &user.IsOnline); err != nil {
		log.Println("Failed to query created user:", err)
		http.Error(w, "Failed to retrieve created user", http.StatusInternalServerError)
		return
	}

	// Convert sql.NullTime to *time.Time for the model
	if lastLogin.Valid {
		t := lastLogin.Time
		user.LastLogin = &t
	} else {
		user.LastLogin = nil
	}

	// Ensure password hash is not exposed (the struct already has json:"-" but clear it for safety)
	user.PasswordHash = ""

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{"message": "Registration successful", "user": user})
}

func loginHandler(w http.ResponseWriter, r *http.Request) {
	log.Println("Login handler called!")
	w.Header().Set("Content-Type", "application/json")

	if r.Method != http.MethodPost {
		log.Println("Wrong method:", r.Method)
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Println("JSON decode error:", err.Error())
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Authenticate the user
	// For now, we are not creating a session, just checking credentials.
	user, err := AuthenticateUser(req.Identifier, req.Password)
	if err != nil {
		log.Printf("Authentication failed for %s: %v", req.Identifier, err)
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"message": "Invalid credentials"})
		return
	}

	// On successful authentication
	log.Printf("User %s (ID: %d) logged in successfully", user.Nickname, user.ID)

	// TODO: Create a session and return a session token in a cookie.

	response := map[string]string{"message": "Login successful"}
	json.NewEncoder(w).Encode(response)
	log.Println("Login response sent!")
}
