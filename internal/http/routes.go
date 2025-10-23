package http

import (
	"net/http"
	"real-time-forum/internal/http/handler"
)

// RegisterRoutes sets up all the application's routes.
// It uses a ServeMux for better modularity and to avoid using the default global multiplexer.
func RegisterRoutes(mux *http.ServeMux) {
	// Serve static assets (CSS, JS) from the /public directory.
	fileServer := http.FileServer(http.Dir("./public"))
	mux.Handle("/css/", fileServer)
	mux.Handle("/js/", fileServer)

	// API and page routes
	mux.HandleFunc("/register", handler.RegisterHandler)
	mux.HandleFunc("/login", handler.LoginHandler)
	mux.HandleFunc("/logout", handler.LogoutHandler)

	// Handle /api/posts, routing by method.
	// This keeps middleware application out of the handler package.
	mux.HandleFunc("/api/posts", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			handler.GetAllPostsHandler(w, r)
		case http.MethodPost:
			// Apply AuthMiddleware only for the POST method.
			AuthMiddleware(http.HandlerFunc(handler.CreatePostHandler)).ServeHTTP(w, r)
		default:
			handler.RespondWithError(w, http.StatusMethodNotAllowed, "Method not allowed")
		}
	})

	mux.HandleFunc("/api/categories", handler.GetAllCategoriesHandler)

	mux.HandleFunc("/", handler.IndexHandler)
}
