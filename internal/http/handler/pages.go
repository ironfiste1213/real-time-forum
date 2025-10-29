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

	// Check if the path starts with /api/
	if strings.HasPrefix(r.URL.Path, "/api/") {
		// For API routes, return a HTML 404 error page
		w.Header().Set("Content-Type", "text/html")
		w.WriteHeader(http.StatusNotFound)
		w.Write([]byte(`
<!DOCTYPE html>
<html>
<head>
    <title>404 Not Found</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        h1 { color: #d9534f; }
    </style>
</head>
<body>
    <h1>404 Not Found</h1>
    <p>The requested API endpoint was not found.</p>
</body>
</html>
		`))
		return
	}

	// For non-API routes, serve index.html (SPA routing)
	http.ServeFile(w, r, "./public/index.html")
}
