package main

import (
	"database/sql"
	"errors"
)

// AuthenticateUser checks the user's credentials against the database.
// It returns the user if authentication is successful, otherwise an error.
func AuthenticateUser(identifier, password string) (*User, error) {
	var user User
	// Query for the user by nickname or email
	row := DB.QueryRow("SELECT id, nickname, email, password_hash FROM users WHERE nickname = ? OR email = ?", identifier, identifier)
	err := row.Scan(&user.ID, &user.Nickname, &user.Email, &user.PasswordHash)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("invalid credentials") // Use a generic error to prevent user enumeration
		}
		return nil, err // Other database error
	}
	// Check if the provided password matches the stored hash
	if !CheckPasswordHash(password, user.PasswordHash) {
		return nil, errors.New("invalid credentials")
	}

	return &user, nil
}
