package auth

import (
	"errors"
	"net/mail"
	"real-time-forum/internal/models"
	"strings"
	"unicode"
)

// ValidateRegisterRequest checks if the user registration data is valid.
func ValidateRegisterRequest(req *models.RegisterRequest) error {
	// Trim whitespace from all string fields
	req.Nickname = strings.TrimSpace(req.Nickname)
	req.FirstName = strings.TrimSpace(req.FirstName)
	req.LastName = strings.TrimSpace(req.LastName)
	req.Email = strings.TrimSpace(req.Email)

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
