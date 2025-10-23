package handler

import (
	"encoding/json"
	"net/http"
	"real-time-forum/internal/repo"
)

// GetAllCategoriesHandler retrieves all categories.
func GetAllCategoriesHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		RespondWithError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	categories, err := repo.GetAllCategories()
	if err != nil {
		RespondWithError(w, http.StatusInternalServerError, "Failed to retrieve categories")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(categories)
}
