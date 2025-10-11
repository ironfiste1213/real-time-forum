package http

import (
	"encoding/json"
	"net/http"
	"real-time-forum/internal/auth"
	"real-time-forum/internal/repo"

	"real-time-forum/internal/models"
)

// IndexHandler serves the main index.html file for all non-api routes.
// This is necessary for a Single Page Application (SPA) where routing is handled client-side.
func IndexHandler(w http.ResponseWriter, r *http.Request) {
	// If the path is not the root, it's a client-side route.
	// Serve index.html and let the frontend router handle it.
	// We check if the path is not an API endpoint to avoid conflicts.
	// A better solution would be a more advanced router, but this works for now.
	if r.URL.Path != "/" && r.URL.Path != "/login" && r.URL.Path != "/register" {
		// This logic can be improved, for now we assume non-root is a client-side route
	}
	http.ServeFile(w, r, "./public/index.html")
}

// RegisterHandler handles user registration.
// Placeholder function.
func RegisterHandler(w http.ResponseWriter, r *http.Request) {
	// check if the request method is POST
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Parse the JSON request body
	var req models.RegisterRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	// Step 3: Validate the input data using our new helper
	if err := auth.ValidateRegisterRequest(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Step 4: Hash the password using our new helper
	hashedPassword, err := auth.HashPassword(req.Password)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	// Step 5: Create a user model and save it to the database
	user := &models.User{
		Nickname:     req.Nickname,
		Email:        req.Email,
		PasswordHash: hashedPassword,
		FirstName:    req.FirstName,
		LastName:     req.LastName,
		Age:          req.Age,
		Gender:       req.Gender,
	}

	err = repo.CreateUser(user)
	if err != nil {
		if err == repo.ErrDuplicateEntry {
			http.Error(w, "Email or nickname is already in use", http.StatusConflict)
		} else {
			http.Error(w, "Internal server error", http.StatusInternalServerError)
		}
		return
	}

	// Set the content type to application/json
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"message": "Registration successful!"})
}

// LoginHandler handles user login.
// Placeholder function.
func LoginHandler(w http.ResponseWriter, r *http.Request) {
	// Set the content type to application/json
	w.Header().Set("Content-Type", "application/json")

	// TODO: Implement actual user login logic (parsing, validation, session creation)

	// For now, send a valid JSON success response with dummy user data
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{"message": "Login successful!", "user": map[string]string{"nickname": "TestUser"}})
}

func logoutHandler(w http.ResponseWriter, r *http.Request) {
	// Set the content type to application/json
	w.Header().Set("Content-Type", "application/json")
}
