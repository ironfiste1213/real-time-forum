package repo

import (
	"database/sql"
	"log"
	"os"

	_ "github.com/mattn/go-sqlite3" // SQLite driver
)

// DB is the global database connection pool.
var DB *sql.DB

// InitDB initializes the database connection pool.
// It's meant to be called once at application startup.
func InitDB(dataSourceName string) error {
	var err error
	DB, err = sql.Open("sqlite3", dataSourceName)
	if err != nil {
		return err
	}

	// Ping the database to verify the connection is alive.
	if err = DB.Ping(); err != nil {
		return err
	}

	log.Println("Database connected successfully!")
	return nil
}

// CloseDB closes the database connection.
func CloseDB() {
	DB.Close()
}

// MigrateDB executes the SQL migration script to set up the database schema.
func MigrateDB(filepath string) error {
	query, err := os.ReadFile(filepath)
	if err != nil {
		return err
	}

	if _, err := DB.Exec(string(query)); err != nil {
		return err
	}

	log.Println("Database migration completed successfully!")
	return nil
}
