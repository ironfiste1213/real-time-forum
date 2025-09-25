package main

import (
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
	println("Register handler called!")
	w.Header().Set("Content-Type", "application/json")

	if r.Method != "POST" {
		println("Wrong method:", r.Method)
		http.Error(w, "Method not allowed", 405)
		return
	}

	var req RegisterRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		println("JSON decode error:", err.Error())
		json.NewEncoder(w).Encode(map[string]string{"message": "Invalid JSON"})
		return
	}

	// For now, just print the user data and return success
	println("New user registered:", req.Nickname, req.Email)

	response := map[string]string{"message": "Registration successful"}
	json.NewEncoder(w).Encode(response)
	println("Response sent!")
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
