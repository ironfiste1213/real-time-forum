package main

import "golang.org/x/crypto/bcrypt"

// CheckPasswordHash compares a plaintext password with a bcrypt hash.
func CheckPasswordHash(password, hash string) bool {
	// CompareHashAndPassword returns nil on success and an error on failure.
	// It is designed to be slow to help prevent timing attacks.
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

// HashPassword returns a bcrypt hash of the password.
func HashPassword(password string) (string, error) {
	if password == "" {
		return "", nil
	}
	b, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(b), nil
}
