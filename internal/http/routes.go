package http

import (
	"log"
	"net/http"
	"real-time-forum/internal/http/handler"
	"strings"
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

	// Handle all /api/posts/... routes
	mux.HandleFunc("/api/posts/", func(w http.ResponseWriter, r *http.Request) {
		log.Printf("Router: Handling path: %s", r.URL.Path)
		// Trim the prefix to see what's left
		idStr := strings.TrimPrefix(r.URL.Path, "/api/posts/")

		// If idStr is empty, the path was /api/posts/ or /api/posts.
		// This is for listing all posts (GET) or creating a new one (POST).
		if idStr == "" {
			log.Printf("Router: Path is for list/create. Routing by method: %s", r.Method)
			switch r.Method {
			case http.MethodGet:
				handler.GetAllPostsHandler(w, r)
			case http.MethodPost:
				AuthMiddleware(http.HandlerFunc(handler.CreatePostHandler)).ServeHTTP(w, r)
			default:
				handler.RespondWithError(w, http.StatusMethodNotAllowed, "Method not allowed for this path")
			}
		} else if r.Method == http.MethodGet { // If there's an ID and method is GET, fetch the specific post.
			log.Printf("Router: Path is for a specific resource (ID: %s).", idStr)
			handler.GetPostByIDHandler(w, r)
		} else { // Any other method on a specific post ID is not allowed.
			handler.RespondWithError(w, http.StatusMethodNotAllowed, "Method not allowed for a specific post")
		}
	})

	mux.HandleFunc("/api/categories", handler.GetAllCategoriesHandler)

	mux.HandleFunc("/", handler.IndexHandler)
}
