package http

import (
	"net/http"
	"real-time-forum/internal/http/handler"
)

// RegisterRoutes sets up all the application's routes.
// It uses a ServeMux for better modularity and to avoid using the default global multiplexer.
func RegisterRoutes(mux *http.ServeMux) {
	// Serve static assets (CSS, JS) from the /public directory.
	fs := http.FileServer(http.Dir("./public"))
	mux.Handle("/css/", fs)
	mux.Handle("/js/", fs)

	// API and page routes
	mux.HandleFunc("/register", handler.RegisterHandler)
	mux.HandleFunc("/login", handler.LoginHandler)
	mux.HandleFunc("/logout", handler.LogoutHandler)

	mux.HandleFunc("/", handler.IndexHandler)

	// Example of a protected route.
	// Any handler wrapped with `AuthMiddleware` will require a valid session.
	// mux.Handle("/api/posts/create", AuthMiddleware(http.HandlerFunc(handler.CreatePostHandler)))
	// mux.Handle("/api/user/profile", AuthMiddleware(http.HandlerFunc(handler.GetUserProfileHandler)))
}
