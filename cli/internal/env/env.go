package env

import "os"

// GetEnv retrieves an environment variable or returns a default value
func GetEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// MustGetEnv retrieves an environment variable or panics if not found
func MustGetEnv(key string) string {
	value := os.Getenv(key)
	if value == "" {
		panic("required environment variable not set: " + key)
	}
	return value
}

// SetEnv sets an environment variable
func SetEnv(key, value string) error {
	return os.Setenv(key, value)
}

// UnsetEnv unsets an environment variable
func UnsetEnv(key string) error {
	return os.Unsetenv(key)
}

// HasEnv checks if an environment variable is set
func HasEnv(key string) bool {
	_, exists := os.LookupEnv(key)
	return exists
}