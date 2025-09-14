package main

import (
	"encoding/json"
	"net/http"
)

type User struct {
	Nickname  string `json:"nickname"`
	Age       int    `json:"age"`
	Gender    string `json:"gender"`
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
	Email     string `json:"email"`
	Password  string `json:"password"`
}

func registerHandler(w http.ResponseWriter, r *http.Request) {
	println("Register handler called!")
	w.Header().Set("Content-Type", "application/json")
	
	if r.Method != "POST" {
		println("Wrong method:", r.Method)
		http.Error(w, "Method not allowed", 405)
		return
	}

	var user User
	err := json.NewDecoder(r.Body).Decode(&user)
	if err != nil {
		println("JSON decode error:", err.Error())
		json.NewEncoder(w).Encode(map[string]string{"message": "Invalid JSON"})
		return
	}

	// For now, just print the user data and return success
	println("New user registered:", user.Nickname, user.Email)
	
	response := map[string]string{"message": "Registration successful"}
	json.NewEncoder(w).Encode(response)
	println("Response sent!")
}