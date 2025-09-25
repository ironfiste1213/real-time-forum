package main

import (
	"database/sql"
	"log"

	_ "github.com/mattn/go-sqlite3"
)

var DB *sql.DB

func initialdb() error {
	var err error

	DB, err = sql.Open("sqlite3", "./forum.db")
	if err != nil {
		return err
	}

	err = DB.Ping()
	if err != nil {
		return err
	}

	log.Println("Datbase connected successfully!")
	return nil
}

func Creattables() error {
	query := `
	-- USERS (Enhanced with new fields)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nickname TEXT NOT NULL UNIQUE,  -- From old forum
    email TEXT NOT NULL UNIQUE,     -- From old forum
    password_hash TEXT NOT NULL,    -- From old forum (encrypted)
    first_name TEXT NOT NULL,       -- NEW
    last_name TEXT NOT NULL,        -- NEW
    age INTEGER NOT NULL,           -- NEW
    gender TEXT NOT NULL,           -- NEW
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    is_online BOOLEAN DEFAULT FALSE,-- NEW for real-time status
    session_token TEXT UNIQUE       -- For authentication
);

-- CATEGORIES (From old forum)
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT
);

-- POSTS (From old forum)
CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
);

-- POST_CATEGORIES (From old forum - many-to-many)
CREATE TABLE IF NOT EXISTS post_categories (
    post_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    PRIMARY KEY (post_id, category_id),
    FOREIGN KEY (post_id) REFERENCES posts (id),
    FOREIGN KEY (category_id) REFERENCES categories (id)
);

-- COMMENTS (From old forum)
CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts (id),
    FOREIGN KEY (user_id) REFERENCES users (id)
);

-- LIKES (From old forum - for posts and comments)
CREATE TABLE IF NOT EXISTS likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    post_id INTEGER,
    comment_id INTEGER,
    type INTEGER NOT NULL, -- 1 for like, -1 for dislike
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (post_id) REFERENCES posts (id),
    FOREIGN KEY (comment_id) REFERENCES comments (id),
    CHECK (post_id IS NOT NULL OR comment_id IS NOT NULL)
);

-- PRIVATE_MESSAGES (NEW for real-time chat)
CREATE TABLE IF NOT EXISTS private_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (sender_id) REFERENCES users (id),
    FOREIGN KEY (receiver_id) REFERENCES users (id)
);

-- SESSIONS (For authentication)
CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_token TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id)
); `

	_, err := DB.Exec(query)
	if err != nil {
		return err
	}
	log.Println("all forum tables created seccessfully !")
	return nil
}

func Closdb() {
	if DB != nil {
		DB.Close()
		log.Println("databse connection closed ! ")
	}
}
