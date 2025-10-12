package handler

import (
	"encoding/json"
	"net/http"
)

// RespondWithError sends a JSON-formatted error message.
func RespondWithError(w http.ResponseWriter, code int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(map[string]string{"message": message})
}
