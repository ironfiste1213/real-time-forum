package models

type RegisterRequest struct {
	Nickname  string `json:"nickname"`
	Email     string `json:"email"`
	Password  string `json:"password"`
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
	Age       int    `json:"age"`
	Gender    string `json:"gender"`
}

type loginRequest struct {
	Identifier string `json:"Identifier"` // Can be either nickname or email
	Password   string `json:"password"`
}
