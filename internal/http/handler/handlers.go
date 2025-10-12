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

	// Step 4: Check for duplicate email or nickname before proceeding
	existingUser, err := repo.GetUserByEmail(req.Email)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	if existingUser != nil {
		http.Error(w, "Email is already in use", http.StatusConflict)
		return
	}

	existingUser, err = repo.GetUserByNickname(req.Nickname)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	if existingUser != nil {
		http.Error(w, "Nickname is already in use", http.StatusConflict)
		return
	}

	// Step 5: Hash the password using our new helper
	hashedPassword, err := auth.HashPassword(req.Password)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	// Step 6: Create a user model and save it to the database
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

	// 1. Parse the request
	var req models.LoginRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	// 2. Look up the user by email or nickname
	user, err := repo.GetUserByEmailOrNickname(req.Identifier)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	if user == nil {
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	// 3. Verify the password
	if !auth.CheckPasswordHash(req.Password, user.PasswordHash) {
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	// 4. Create a new session
	sessionToken, err := auth.CreateSession(user.ID)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	// 5. Set the session cookie
	auth.SetSessionCookie(w, sessionToken)

	// 6. Send a success response
	w.WriteHeader(http.StatusOK)

	// Define the user details you want to send in the response
	userDetails := map[string]interface{}{
		"id":        user.ID,
		"nickname":  user.Nickname,
		"firstName": user.FirstName,
		"lastName":  user.LastName,
		"age":       user.Age,
		"gender":    user.Gender,
		"email":     user.Email,
	}

	// Create the response payload
	response := map[string]interface{}{
		"message": "Login successful!",
		"user":    userDetails,
	}

	json.NewEncoder(w).Encode(response)
}

func LogoutHandler(w http.ResponseWriter, r *http.Request) {
	// 1. Get the session cookie from the request
	cookie, err := r.Cookie("session_token")
	if err != nil {
		// If the cookie is not found, the user is effectively logged out.
		// We can just send a success response.
		if err == http.ErrNoCookie {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"message": "Already logged out"}`))
			return
		}
		// For other errors, it might be a bad request.
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	// 2. Delete the session from the database
	sessionToken := cookie.Value
	auth.DeleteSession(sessionToken) // We can ignore the error here, as the main goal is to delete the cookie

	// Expire the session cookie by setting its MaxAge to a negative value
	sessionCookie := &http.Cookie{
		Name:     "session_token",
		Value:    "",
		Path:     "/",
		MaxAge:   -1, // This tells the browser to delete the cookie
		HttpOnly: true,
		Secure:   false, // Set to true in production with HTTPS
		SameSite: http.SameSiteLaxMode,
	}
	http.SetCookie(w, sessionCookie)

	// Set the content type to application/json
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"message": "Logout successful"}`))
}
