package main

import (
	"log"
	"net/http"
)

func main() {
	// Initialize database
	err := initialdb()
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer Closdb()

	// Create tables
	err = Creattables()
	if err != nil {
		log.Fatal("Failed to create tables:", err)
	}

	// This single handler is smart enough to serve index.html for "/"
	// and also find and serve files like "css/style.css" and "js/app.js".
	http.Handle("/", http.FileServer(http.Dir("../frontend")))

	// Registration endpoint
	http.HandleFunc("/register", registerHandler)

	// Login endpoint
	http.HandleFunc("/login", loginHandler)

	log.Println("Server started on http://localhost:8080")
	err = http.ListenAndServe(":8080", nil)
	if err != nil {
		log.Fatal(err)
	}
}
