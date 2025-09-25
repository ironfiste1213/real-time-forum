package main

import "golang.org/x/crypto/bcrypt"

// CheckPasswordHash compares a plaintext password with a bcrypt hash.
func CheckPasswordHash(password, hash string) bool {
	// CompareHashAndPassword returns nil on success and an error on failure.
	// It is designed to be slow to help prevent timing attacks.
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}
