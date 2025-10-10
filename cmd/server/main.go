package main

import (
	"log"
	"net/http"
	httpInternal "real-time-forum/internal/http"
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

	// Run database migrations.
	if err := repo.MigrateDB("./migrations/001_init.sql"); err != nil {
		log.Fatalf("Failed to run database migrations: %v", err)
	}

	// Serve static files (CSS, JS, images) from the public directory.
	// The README mentions a 'public' directory for the frontend.
	http.Handle("/", http.FileServer(http.Dir("./public")))

	// API endpoints
	http.HandleFunc("/register", httpInternal.RegisterHandler)
	http.HandleFunc("/login", httpInternal.LoginHandler)

	// TODO: Add WebSocket endpoint /ws
	log.Println("Starting server on http://localhost:8080")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatalf("Could not start server: %s\n", err)
	}
}
