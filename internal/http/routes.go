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
		path := strings.TrimPrefix(r.URL.Path, "/api/posts/")
		path = strings.TrimSuffix(path, "/") // Handle trailing slashes

		// Check if the request is for comments on a specific post
		// e.g., /api/posts/123/comments
		if strings.HasSuffix(path, "/comments") {
			log.Printf("Router: Path is for comments. Routing by method: %s", r.Method)
			switch r.Method {
			case http.MethodGet:
				handler.GetCommentsByPostIDHandler(w, r)
			case http.MethodPost:
				AuthMiddleware(http.HandlerFunc(handler.CreateCommentHandler)).ServeHTTP(w, r)
			default:
				handler.RespondWithError(w, http.StatusMethodNotAllowed, "Method not allowed for comments")
			}
			return
		}

		// If path is empty, the original path was /api/posts/ or /api/posts.
		// This is for listing all posts (GET) or creating a new one (POST).
		if path == "" {
			log.Printf("Router: Path is for list/create. Routing by method: %s", r.Method)
			switch r.Method {
			case http.MethodGet:
				handler.GetAllPostsHandler(w, r)
			case http.MethodPost:
				AuthMiddleware(http.HandlerFunc(handler.CreatePostHandler)).ServeHTTP(w, r)
			}
		} else if r.Method == http.MethodGet { // If there's an ID and method is GET, fetch the specific post.
			log.Printf("Router: Path is for a specific resource (ID: %s).", path)
			handler.GetPostByIDHandler(w, r)
		}
	})

	mux.HandleFunc("/api/categories", handler.GetAllCategoriesHandler)

	mux.HandleFunc("/", handler.IndexHandler)
}
