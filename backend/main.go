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

	// Serve all frontend files
	fs := http.FileServer(http.Dir("frontend"))
	http.Handle("/static/", http.StripPrefix("/static/", fs))
	http.Handle("/app.js", fs)
	http.Handle("/style.css", fs)

	// Routes
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "frontend/index.html")
	})
	
	// Registration endpoint
	http.HandleFunc("/register", registerHandler)

	log.Println("Server started on http://localhost:8080")
	err = http.ListenAndServe(":8080", nil)
	if err != nil {
		log.Fatal(err)
	}
}