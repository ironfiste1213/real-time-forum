package auth

import (
	"net/http"
	"real-time-forum/internal/repo"
	"time"

	"github.com/gofrs/uuid"
)

// CreateSession generates a new session for a user and stores it in the database.
func CreateSession(userID int) (string, error) {
	// Generate a new UUID for the session token.
	token, err := uuid.NewV4()
	if err != nil {
		return "", err
	}

	sessionToken := token.String()
	expiry := time.Now().Add(24 * time.Hour) // Session expires in 24 hours

	// Prepare the SQL statement to insert the new session.
	stmt, err := repo.DB.Prepare(`
		INSERT INTO sessions (user_id, token, expiry)
		VALUES (?, ?, ?)
	`)
	if err != nil {
		return "", err
	}
	defer stmt.Close()

	// Execute the statement.
	_, err = stmt.Exec(userID, sessionToken, expiry)
	if err != nil {
		return "", err
	}

	return sessionToken, nil
}

// SetSessionCookie creates and sets the session cookie on the HTTP response.
func SetSessionCookie(w http.ResponseWriter, token string) {
	http.SetCookie(w, &http.Cookie{
		Name:     "session_token",
		Value:    token,
		Path:     "/",
		Expires:  time.Now().Add(24 * time.Hour),
		HttpOnly: true,
		Secure:   false, // Set to true in production with HTTPS
		SameSite: http.SameSiteLaxMode,
	})
}

// DeleteSession removes a session from the database based on its token.
func DeleteSession(token string) error {
	stmt, err := repo.DB.Prepare("DELETE FROM sessions WHERE token = ?")
	if err != nil {
		return err
	}
	defer stmt.Close()

	_, err = stmt.Exec(token)
	return err
}
