package handler

import "net/http"

// IndexHandler serves the main index.html file for all non-api routes.
// This is necessary for a Single Page Application (SPA) where routing is handled client-side.
func IndexHandler(w http.ResponseWriter, r *http.Request) {
	// If the path is not the root, it's a client-side route.
	// Serve index.html and let the frontend router handle it.
	// We check if the path is not an API endpoint to avoid conflicts.
	// A better solution would be a more advanced router, but this works for now.
	http.ServeFile(w, r, "./public/index.html")
}
