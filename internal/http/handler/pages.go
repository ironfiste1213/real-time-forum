package handler

import (
	"net/http"
	"strings"
)

// IndexHandler serves the main index.html file for all non-api routes.
// This is necessary for a Single Page Application (SPA) where routing is handled client-side.
func IndexHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.Header().Set("Content-Type", "text/html")
		w.WriteHeader(http.StatusMethodNotAllowed)
		w.Write([]byte(`
<!DOCTYPE html>
<html>
<head>
    <title>Method Not Allowed</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        h1 { color: #d9534f; }
    </style>
</head>
<body>
    <h1>405 Method Not Allowed</h1>
    <p>The requested method is not allowed for this resource.</p>
    <p>Please use GET to access the page.</p>
</body>
</html>
		`))
		return
	}

	// Check if this is an API request
	if strings.HasPrefix(r.URL.Path, "/api/") {
		// For API requests that don't match any route, return JSON 404
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		w.Write([]byte(`{"message": "API endpoint not found"}`))
		return
	}

	// For non-API routes, always serve index.html (SPA routing)
	// The frontend router will handle showing 404 for invalid routes
	http.ServeFile(w, r, "./public/index.html")
}
