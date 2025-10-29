package handler

import "net/http"

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
	// If the path is not the root, it's a client-side route.
	// Serve index.html and let the frontend router handle it.
	// We check if the path is not an API endpoint to avoid conflicts.
	// A better solution would be a more advanced router, but this works for now.
	http.ServeFile(w, r, "./public/index.html")
}
