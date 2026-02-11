package validation

import (
	"html"
	"regexp"
	"strings"
	"unicode/utf8"
)

// Configuration constants for content validation
const (
	MaxTitleLength   = 200  // Maximum characters for post title
	MaxContentLength = 5000 // Maximum characters for post content
	MaxCommentLength = 1000 // Maximum characters for comment content

	// Rate limiting configuration
	RateLimitRequests = 10 // Maximum requests per time window
	RateLimitWindow   = 60 // Time window in seconds (1 minute)

)


// Forbidden characters - control characters that should not be allowed
var controlCharPattern = regexp.MustCompile(`[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]`)

// ValidationError represents a validation error with a specific field and message
type ValidationError struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}

// ValidationResult holds the result of validation
type ValidationResult struct {
	Valid  bool              `json:"valid"`
	Errors []ValidationError `json:"errors,omitempty"`
}

// NewValidationResult creates a new validation result
func NewValidationResult() *ValidationResult {
	return &ValidationResult{
		Valid:  true,
		Errors: []ValidationError{},
	}
}

// AddError adds an error to the validation result
func (v *ValidationResult) AddError(field, message string) {
	v.Valid = false
	v.Errors = append(v.Errors, ValidationError{
		Field:   field,
		Message: message,
	})
}

// HasErrors returns true if there are validation errors
func (v *ValidationResult) HasErrors() bool {
	return !v.Valid
}

// ValidateContent is a generic validator for text content
func ValidateContent(text string, maxLength int, fieldName string) *ValidationResult {
	result := NewValidationResult()

	// Check if empty or whitespace only
	trimmed := strings.TrimSpace(text)
	if trimmed == "" {
		result.AddError(fieldName, fieldName+" cannot be empty")
		return result
	}

	// Check max length
	if utf8.RuneCountInString(text) > maxLength {
		result.AddError(fieldName, fieldName+" exceeds maximum length of "+itoa(maxLength)+" characters")
		return result
	}

	// Check for forbidden characters (control characters)
	if controlCharPattern.MatchString(text) {
		result.AddError(fieldName, fieldName+" contains invalid characters")
		return result
	}

	return result
}

// ValidatePost validates a post's title and content
func ValidatePost(title string, content string) *ValidationResult {
	result := NewValidationResult()

	// Validate title
	titleResult := ValidateContent(title, MaxTitleLength, "Title")
	if titleResult.HasErrors() {
		result.Errors = append(result.Errors, titleResult.Errors...)
	}

	// Validate content
	contentResult := ValidateContent(content, MaxContentLength, "Content")
	if contentResult.HasErrors() {
		result.Errors = append(result.Errors, contentResult.Errors...)
	}

	return result
}

// ValidateComment validates a comment's content
func ValidateComment(content string) *ValidationResult {
	return ValidateContent(content, MaxCommentLength, "Comment")
}

// SanitizeHTML escapes HTML characters to prevent XSS attacks
func SanitizeHTML(text string) string {
	// First, escape HTML special characters
	sanitized := html.EscapeString(text)

	// Remove any potential JavaScript event handlers
	sanitized = regexp.MustCompile(`(?i)javascript:`).ReplaceAllString(sanitized, "")
	sanitized = regexp.MustCompile(`(?i)on\w+\s*=`).ReplaceAllString(sanitized, "")

	// Remove potential data: URLs that could be used for XSS
	sanitized = regexp.MustCompile(`(?i)data:`).ReplaceAllString(sanitized, "datablocked:")

	return sanitized
}

// itoa converts int to string (helper function)
func itoa(n int) string {
	return string(rune('0'+n/1000%10)) + string(rune('0'+n/100%10)) + string(rune('0'+n/10%10)) + string(rune('0'+n%10))
}
