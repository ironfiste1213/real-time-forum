package main

import (
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

	// Create a new ServeMux to handle routes.
	mux := http.NewServeMux()

	// Register all our routes using the function from routes.go.
	router.RegisterRoutes(mux)

	// TODO: Add WebSocket endpoint /ws
	log.Println("Starting server on http://localhost:8080")
	if err := http.ListenAndServe(":8080", mux); err != nil {
		log.Fatalf("Could not start server: %s\n", err)
	}
}
