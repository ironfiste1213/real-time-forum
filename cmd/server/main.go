package main

import (
	"fmt"
	"log"
	"net/http"
	router "real-time-forum/internal/http"
	"real-time-forum/internal/repo"
)

func main() {
	// Initialize the database connection.
	// The `?_foreign_keys=on` is important for SQLite to enforce foreign key constraints.
	err := repo.InitDB("./forum.db?_foreign_keys=on")
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer repo.CloseDB()

	// --- Print all users to the terminal for debugging ---
	users, err := repo.GetAllUsers()
	if err != nil {
		log.Printf("Could not retrieve users for debug printing: %v", err)
	} else {
		log.Println("--- Registered Users ---")
		if len(users) == 0 {
			log.Println("No users found in the database.")
		}
		for _, user := range users {
			fmt.Printf("  - ID: %d, Nickname: %s, Email: %s\n", user.ID, user.Nickname, user.Email)
		}
		log.Println("------------------------")
	}

	// Create a new ServeMux to handle routes.
	mux := http.NewServeMux()

	// Register all our routes using the function from routes.go.
	router.RegisterRoutes(mux)

	// TODO: Add WebSocket endpoint /ws
	log.Println("Starting server on http://localhost:8082")
	if err := http.ListenAndServe(":8082", mux); err != nil {
		log.Fatalf("Could not start server: %s\n", err)
	}
}
