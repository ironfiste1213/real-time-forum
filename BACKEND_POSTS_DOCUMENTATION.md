# Backend Posts + Post Details + Comments Module Documentation

## Overview of Posts Module
The posts module handles everything related to forum posts, their details, comments, and categories. Its main job is to:
- Let users create new posts (with categories)
- Display all posts in a feed
- Show individual post details
- Allow users to comment on posts
- Manage post categories

Key concepts:
- **Posts**: Main content with title, content, author, categories, and timestamps.
- **Comments**: Replies to posts with content, author, and timestamps.
- **Categories**: Tags for posts (many-to-many relationship).
- **Feed**: List of all posts, sorted by newest first.

The module is split into files for organization:
- `handler/posts.go`: Handlers for creating posts, getting all posts, getting single post.
- `handler/comments.go`: Handlers for creating comments, getting comments by post.
- `handler/categories.go`: Handler for getting all categories.
- `models/post.go`: Post, Category, and request structs.
- `models/comment.go`: Comment and request structs.
- `repo/posts.go`: Database operations for posts and categories.
- `repo/comments.go`: Database operations for comments.

## Data Models
These are the structures that hold post, comment, and category data.

### Post struct (from `models/post.go`)
```go
type Post struct {
    ID         int       `json:"id"`
    UserID     int       `json:"userId"`
    Title      string    `json:"title"`
    Content    string    `json:"content"`
    CreatedAt  time.Time `json:"createdAt"`
    Author     *User     `json:"author"`     // Author's details
    Categories []string  `json:"categories"` // Category names
}
```
Represents a forum post with author and categories populated.

### Comment struct (from `models/comment.go`)
```go
type Comment struct {
    ID        int       `json:"id"`
    PostID    int       `json:"postId"`
    UserID    int       `json:"userId"`
    Content   string    `json:"content"`
    CreatedAt time.Time `json:"createdAt"`
    Author    *User     `json:"author"` // Author's details
}
```
Represents a comment on a post.

### Category struct
```go
type Category struct {
    ID   int    `json:"id"`
    Name string `json:"name"`
}
```
Simple category with ID and name.

### Request structs
```go
type CreatePostRequest struct {
    Title       string `json:"title"`
    Content     string `json:"content"`
    CategoryIDs []int  `json:"category_ids"`
}

type CreateCommentRequest struct {
    Content string `json:"content"`
}
```
What the frontend sends to create posts/comments.

## Posts Handlers

### CreatePostHandler (from `handler/posts.go`)
Handles creating new posts.

Flow:
```
User sends POST /api/posts with JSON + auth
→ Handler checks auth (middleware)
→ Parses JSON into CreatePostRequest
→ Creates Post model with user ID
→ Calls repo.CreatePost with categories
→ Returns success with post ID
```

Key code:
```go
user, ok := auth.GetUserFromContext(r.Context())
if !ok || user == nil {
    RespondWithError(w, http.StatusUnauthorized, "Authentication required")
    return
}

var req models.CreatePostRequest
json.NewDecoder(r.Body).Decode(&req)

post := &models.Post{
    UserID:  user.ID,
    Title:   req.Title,
    Content: req.Content,
}

postID, err := repo.CreatePost(post, req.CategoryIDs)
```

**Built-in explanations**:
- `auth.GetUserFromContext(r.Context())`: From auth package. Retrieves user from request context set by middleware.

### GetAllPostsHandler
Gets all posts for the feed.

Flow:
```
User sends GET /api/posts
→ Handler calls repo.GetAllPosts()
→ Returns JSON array of posts with authors and categories
```

### GetPostByIDHandler
Gets single post details.

Flow:
```
User sends GET /api/posts/{id}
→ Handler extracts ID from URL path
→ Calls repo.GetPostByID(id)
→ Returns JSON post with author and categories
```

Key code:
```go
idStr := strings.TrimPrefix(r.URL.Path, "/api/posts/")
idStr = strings.TrimSuffix(idStr, "/")
id, err := strconv.Atoi(idStr)
```

**Built-in explanations**:
- `strings.TrimPrefix/Suffix`: From `strings` package. Removes prefix/suffix from string. Used to extract ID from URL.
- `strconv.Atoi`: From `strconv` package. Converts string to int. Parses ID from URL.

## Comments Handlers

### CreateCommentHandler (from `handler/comments.go`)
Creates comments on posts.

Flow:
```
User sends POST /api/posts/{id}/comments with JSON + auth
→ Handler checks auth
→ Extracts post ID from URL
→ Parses JSON content
→ Creates Comment model
→ Calls repo.CreateComment
→ Returns success with comment ID
```

Key code:
```go
path := strings.TrimSuffix(r.URL.Path, "/comments")
path = strings.TrimSuffix(path, "/")             
idStr := strings.TrimPrefix(path, "/api/posts/")
PostID, err := strconv.Atoi(idStr)

var req models.CreateCommentRequest
json.NewDecoder(r.Body).Decode(&req)

comment := &models.Comment{
    PostID:  PostID,
    UserID:  user.ID,
    Content: req.Content,
}

commentID, err := repo.CreateComment(comment)
```

### GetCommentsByPostIDHandler
Gets all comments for a post.

Flow:
```
User sends GET /api/posts/{id}/comments
→ Handler extracts post ID from URL
→ Calls repo.GetCommentsByPostID(id)
→ Returns JSON array of comments with authors
```

## Categories Handler

### GetAllCategoriesHandler (from `handler/categories.go`)
Gets all available categories.

Flow:
```
User sends GET /api/categories
→ Handler calls repo.GetAllCategories()
→ Returns JSON array of categories
```

## Database Layer

### Posts Repo (from `repo/posts.go`)

#### CreatePost
Inserts post and category associations using transaction.

Key code:
```go
tx, err := DB.Begin() // Start transaction
// Insert post
stmt, err := tx.Prepare(`INSERT INTO posts (user_id, title, content, created_at) VALUES (?, ?, ?, ?)`)
res, err := stmt.Exec(post.UserID, post.Title, post.Content, time.Now())
postID, err := res.LastInsertId()

// Insert category links
for _, catID := range categoryIDs {
    _, err := stmt.Exec(postID, catID)
}

// Commit
return postID, tx.Commit()
```

**Built-in explanations**:
- `DB.Begin()`: From `database/sql`. Starts a database transaction. Changes are temporary until committed.
- `tx.Commit()`: Commits transaction, making changes permanent.
- `tx.Rollback()`: Undoes changes if error occurs.
- `res.LastInsertId()`: Gets auto-generated ID of inserted row.

#### GetAllPosts
Gets all posts with authors and categories.

Key query:
```sql
SELECT
    p.id, p.user_id, p.title, p.content, p.created_at,
    u.nickname,
    GROUP_CONCAT(c.name)
FROM posts p
JOIN users u ON p.user_id = u.id
LEFT JOIN post_categories pc ON p.id = pc.post_id
LEFT JOIN categories c ON pc.category_id = c.id
GROUP BY p.id
ORDER BY p.created_at DESC
```

**Built-in explanations**:
- `GROUP_CONCAT(c.name)`: SQLite function. Concatenates category names into comma-separated string.
- `sql.NullString`: From `database/sql`. Handles nullable string fields. Has Valid bool and String value.

#### GetPostByID
Similar to GetAllPosts but for single post.

### Comments Repo (from `repo/comments.go`)

#### CreateComment
Inserts new comment.

```go
stmt, err := DB.Prepare(`INSERT INTO comments (post_id, user_id, content, created_at) VALUES (?, ?, ?, ?)`)
res, err := stmt.Exec(comment.PostID, comment.UserID, comment.Content, time.Now())
return res.LastInsertId()
```

#### GetCommentsByPostID
Gets comments for a post with authors.

```sql
SELECT c.id, c.post_id, c.user_id, c.content, c.created_at, u.nickname
FROM comments c
JOIN users u ON c.user_id = u.id
WHERE c.post_id = ?
ORDER BY c.created_at ASC
```

## Routes Setup
In `routes.go`, posts routes are handled by a custom function:

```go
mux.HandleFunc("/api/posts/", func(w http.ResponseWriter, r *http.Request) {
    path := strings.TrimPrefix(r.URL.Path, "/api/posts/")
    path = strings.TrimSuffix(path, "/")

    if strings.HasSuffix(path, "/comments") {
        // Handle comments
        switch r.Method {
        case http.MethodGet:
            handler.GetCommentsByPostIDHandler(w, r)
        case http.MethodPost:
            AuthMiddleware(http.HandlerFunc(handler.CreateCommentHandler)).ServeHTTP(w, r)
        }
    } else if path == "" {
        // Handle posts list/create
        switch r.Method {
        case http.MethodGet:
            handler.GetAllPostsHandler(w, r)
        case http.MethodPost:
            AuthMiddleware(http.HandlerFunc(handler.CreatePostHandler)).ServeHTTP(w, r)
        }
    } else {
        // Handle single post
        handler.GetPostByIDHandler(w, r)
    }
})
```

This routes based on URL pattern and method.

## Improvements
The code is solid, but suggestions:
- Add pagination to GetAllPosts (limit/offset).
- Add validation for post/comment content length.
- Add post editing/deletion (with ownership checks).
- Add comment threading (replies to comments).
- Cache categories since they don't change often.
- Add post search functionality.
- Use prepared statements consistently (already good).
