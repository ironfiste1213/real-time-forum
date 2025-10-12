package repo

import (
	"database/sql"
	"errors"
	"real-time-forum/internal/models"

	"github.com/mattn/go-sqlite3"
)

// ErrDuplicateEntry is returned when a database insert fails due to a UNIQUE constraint.
var ErrDuplicateEntry = errors.New("duplicate entry")

// CreateUser inserts a new user into the database.
func CreateUser(user *models.User) error {
	stmt, err := DB.Prepare(`
		INSERT INTO users (nickname, email, password_hash, first_name, last_name, age, gender)
		VALUES (?, ?, ?, ?, ?, ?, ?)
	`)
	if err != nil {
		return err
	}
	defer stmt.Close()

	_, err = stmt.Exec(user.Nickname, user.Email, user.PasswordHash, user.FirstName, user.LastName, user.Age, user.Gender)
	if err != nil {
		// Check if the error is a UNIQUE constraint violation.
		var sqliteErr sqlite3.Error
		if errors.As(err, &sqliteErr) && sqliteErr.ExtendedCode == sqlite3.ErrConstraintUnique {
			return ErrDuplicateEntry
		}
		return err
	}
	return nil
}

func GetUserByEmail(email string) (*models.User, error) {
	stmt, err := DB.Prepare(`
		SELECT id, nickname, email, password_hash, first_name, last_name, age, gender
		FROM users
		WHERE email = ?
	`)
	if err != nil {
		return nil, err
	}
	defer stmt.Close()

	user := &models.User{}
	err = stmt.QueryRow(email).Scan(&user.ID, &user.Nickname, &user.Email, &user.PasswordHash, &user.FirstName, &user.LastName, &user.Age, &user.Gender)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil // No user found
		}
		return nil, err
	}
	return user, nil
}

// GetUserByNickname retrieves a user by their nickname.
// This is primarily used for registration validation.
func GetUserByNickname(nickname string) (*models.User, error) {
	stmt, err := DB.Prepare(`
		SELECT id, nickname, email, password_hash, first_name, last_name, age, gender
		FROM users
		WHERE nickname = ?
	`)
	if err != nil {
		return nil, err
	}
	defer stmt.Close()

	user := &models.User{}
	err = stmt.QueryRow(nickname).Scan(&user.ID, &user.Nickname, &user.Email, &user.PasswordHash, &user.FirstName, &user.LastName, &user.Age, &user.Gender)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil // No user found
		}
		return nil, err
	}
	return user, nil
}

// GetUserByEmailOrNickname retrieves a user by either their email or nickname.
// This is primarily used for the login process.
func GetUserByEmailOrNickname(identifier string) (*models.User, error) {
	stmt, err := DB.Prepare(`
		SELECT id, nickname, email, password_hash, first_name, last_name, age, gender, created_at
		FROM users
		WHERE email = ? OR nickname = ?
	`)
	if err != nil {
		return nil, err
	}
	defer stmt.Close()

	user := &models.User{}
	err = stmt.QueryRow(identifier, identifier).Scan(&user.ID, &user.Nickname, &user.Email, &user.PasswordHash, &user.FirstName, &user.LastName, &user.Age, &user.Gender, &user.CreatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil // No user found, which is a valid case for a login attempt
		}
		return nil, err
	}
	return user, nil
}
