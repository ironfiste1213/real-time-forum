package repo

import (
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
