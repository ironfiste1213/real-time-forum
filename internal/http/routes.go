package http

import (
	"encoding/json"

	"log"
	"net/http"
	"strings"

	"real-time-forum/internal/auth"
	"real-time-forum/internal/http/handler"
)

// debugLog is a helper function to add file and function name to debug logs

// InitWebSocket initializes the WebSocket hub
func InitWebSocket() {
	handler.InitWebSocket()
}

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

	// Add a new route to check authentication status
	mux.HandleFunc("/api/auth/status", func(w http.ResponseWriter, r *http.Request) {
		// This handler is wrapped by the AuthMiddleware.
		// If the middleware passes, it means the user is authenticated.
		statusHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			user, ok := auth.GetUserFromContext(r.Context())
			if !ok {
				// This case should theoretically not be reached if AuthMiddleware is working correctly.
				handler.RespondWithError(w, http.StatusInternalServerError, "Could not retrieve user from context")
				return
			}
			json.NewEncoder(w).Encode(map[string]interface{}{"isAuthenticated": true, "user": user})
		})
		AuthMiddleware(statusHandler).ServeHTTP(w, r)
	})

	// Handle all /api/posts/... routes
	mux.HandleFunc("/api/posts/", func(w http.ResponseWriter, r *http.Request) {
		log.Printf("[routes.go:RegisterRoutes] Router: Handling path: %s", r.URL.Path)
		// Trim the prefix to see what's left
		path := strings.TrimPrefix(r.URL.Path, "/api/posts/")
		path = strings.TrimSuffix(path, "/") // Handle trailing slashes

		// Check if the request is for comments on a specific post
		// e.g., /api/posts/123/comments
		if strings.HasSuffix(path, "/comments") {
			log.Printf("[routes.go:RegisterRoutes] Path is for comments. Routing by method: %s", r.Method)
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
			log.Printf("[routes.go:RegisterRoutes] Router: Path is for list/create. Routing by method: %s", r.Method)
			switch r.Method {
			case http.MethodGet:
				handler.GetAllPostsHandler(w, r)
			case http.MethodPost:
				AuthMiddleware(http.HandlerFunc(handler.CreatePostHandler)).ServeHTTP(w, r)
			}
		} else if r.Method == http.MethodGet { // If there's an ID and method is GET, fetch the specific post.
			log.Printf("[routes.go:RegisterRoutes] Router: Path is for a specific resource (ID: %s).", path)
			handler.GetPostByIDHandler(w, r)
		}
	})

	mux.HandleFunc("/api/categories", handler.GetAllCategoriesHandler)

	// Users API route - temporarily no auth for testing
	mux.HandleFunc("/api/users", handler.GetAllUsersHandler)

	// Private messaging routes
	mux.HandleFunc("/api/messages/send", func(w http.ResponseWriter, r *http.Request) {
		AuthMiddleware(http.HandlerFunc(handler.SendPrivateMessageHandler)).ServeHTTP(w, r)
	})
	mux.HandleFunc("/api/messages", func(w http.ResponseWriter, r *http.Request) {
		AuthMiddleware(http.HandlerFunc(handler.GetPrivateMessagesHandler)).ServeHTTP(w, r)
	})
	mux.HandleFunc("/api/conversations", func(w http.ResponseWriter, r *http.Request) {
		AuthMiddleware(http.HandlerFunc(handler.GetConversationsHandler)).ServeHTTP(w, r)
	})
	mux.HandleFunc("/api/messages/unread", func(w http.ResponseWriter, r *http.Request) {
		AuthMiddleware(http.HandlerFunc(handler.GetUnreadCountHandler)).ServeHTTP(w, r)
	})

	// WebSocket route
	mux.HandleFunc("/ws", handler.WebSocketHandler)

	// Catch-all handler for unmatched routes (must be last)
	// This will handle any route not matched above, including invalid API endpoints
	mux.HandleFunc("/", handler.IndexHandler)
}
