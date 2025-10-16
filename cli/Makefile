# Traefik Log Dashboard CLI Makefile

# Variables
BINARY_NAME=traefik-log-dashboard
GO=go
GOFLAGS=-v
BUILD_DIR=bin
VERSION?=1.0.0
COMMIT=$(shell git rev-parse --short HEAD 2>/dev/null || echo "unknown")
BUILD_TIME=$(shell date -u +"%Y-%m-%dT%H:%M:%SZ")
LDFLAGS=-ldflags "-X main.Version=$(VERSION) -X main.Commit=$(COMMIT) -X main.BuildTime=$(BUILD_TIME)"

# Default target
.PHONY: all
all: clean build

# Build the application
.PHONY: build
build:
	@echo "Building $(BINARY_NAME)..."
	@mkdir -p $(BUILD_DIR)
	$(GO) build $(GOFLAGS) $(LDFLAGS) -o $(BUILD_DIR)/$(BINARY_NAME) ./cmd/traefik-log-dashboard

# Build for multiple platforms
.PHONY: build-all
build-all: clean
	@echo "Building for multiple platforms..."
	@mkdir -p $(BUILD_DIR)
	GOOS=linux GOARCH=amd64 $(GO) build $(LDFLAGS) -o $(BUILD_DIR)/$(BINARY_NAME)-linux-amd64 ./cmd/traefik-log-dashboard
	GOOS=linux GOARCH=arm64 $(GO) build $(LDFLAGS) -o $(BUILD_DIR)/$(BINARY_NAME)-linux-arm64 ./cmd/traefik-log-dashboard
	GOOS=darwin GOARCH=amd64 $(GO) build $(LDFLAGS) -o $(BUILD_DIR)/$(BINARY_NAME)-darwin-amd64 ./cmd/traefik-log-dashboard
	GOOS=darwin GOARCH=arm64 $(GO) build $(LDFLAGS) -o $(BUILD_DIR)/$(BINARY_NAME)-darwin-arm64 ./cmd/traefik-log-dashboard
	GOOS=windows GOARCH=amd64 $(GO) build $(LDFLAGS) -o $(BUILD_DIR)/$(BINARY_NAME)-windows-amd64.exe ./cmd/traefik-log-dashboard
	@echo "Built binaries for all platforms in $(BUILD_DIR)/"

# Install the application
.PHONY: install
install: build
	@echo "Installing $(BINARY_NAME)..."
	$(GO) install $(LDFLAGS) ./cmd/traefik-log-dashboard

# Run the application with demo data
.PHONY: run
run: build
	@echo "Running $(BINARY_NAME) with demo data..."
	./$(BUILD_DIR)/$(BINARY_NAME) --demo

# Run the application with custom log file
.PHONY: run-file
run-file: build
	@echo "Running $(BINARY_NAME) with log file..."
	@if [ -z "$(FILE)" ]; then \
		echo "Usage: make run-file FILE=/path/to/access.log"; \
		exit 1; \
	fi
	./$(BUILD_DIR)/$(BINARY_NAME) --file $(FILE)

# Run the application connecting to agent
.PHONY: run-agent
run-agent: build
	@echo "Running $(BINARY_NAME) with agent..."
	./$(BUILD_DIR)/$(BINARY_NAME) --url http://localhost:8080

# Run tests
.PHONY: test
test:
	@echo "Running tests..."
	$(GO) test $(GOFLAGS) ./...

# Run tests with coverage
.PHONY: test-coverage
test-coverage:
	@echo "Running tests with coverage..."
	$(GO) test -cover -coverprofile=coverage.out ./...
	$(GO) tool cover -html=coverage.out -o coverage.html
	@echo "Coverage report generated: coverage.html"

# Run tests with race detector
.PHONY: test-race
test-race:
	@echo "Running tests with race detector..."
	$(GO) test -race $(GOFLAGS) ./...

# Run benchmarks
.PHONY: bench
bench:
	@echo "Running benchmarks..."
	$(GO) test -bench=. -benchmem ./...

# Clean build artifacts
.PHONY: clean
clean:
	@echo "Cleaning build artifacts..."
	@rm -rf $(BUILD_DIR)
	@rm -f coverage.out coverage.html
	@$(GO) clean

# Format code
.PHONY: fmt
fmt:
	@echo "Formatting code..."
	$(GO) fmt ./...

# Lint code
.PHONY: lint
lint:
	@echo "Linting code..."
	@if command -v golangci-lint > /dev/null; then \
		golangci-lint run ./...; \
	else \
		echo "golangci-lint not installed. Install with: go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest"; \
	fi

# Vet code
.PHONY: vet
vet:
	@echo "Vetting code..."
	$(GO) vet ./...

# Run all checks (fmt, vet, lint, test)
.PHONY: check
check: fmt vet lint test

# Download dependencies
.PHONY: deps
deps:
	@echo "Downloading dependencies..."
	$(GO) mod download
	$(GO) mod verify

# Tidy dependencies
.PHONY: tidy
tidy:
	@echo "Tidying dependencies..."
	$(GO) mod tidy

# Update dependencies
.PHONY: update
update:
	@echo "Updating dependencies..."
	$(GO) get -u ./...
	$(GO) mod tidy

# Generate documentation
.PHONY: docs
docs:
	@echo "Generating documentation..."
	@if command -v godoc > /dev/null; then \
		echo "Starting godoc server at http://localhost:6060"; \
		godoc -http=:6060; \
	else \
		echo "godoc not installed. Install with: go install golang.org/x/tools/cmd/godoc@latest"; \
	fi

# Show help
.PHONY: help
help:
	@echo "Traefik Log Dashboard CLI - Available targets:"
	@echo ""
	@echo "  make build          - Build the application"
	@echo "  make build-all      - Build for all platforms (Linux, macOS, Windows)"
	@echo "  make install        - Install the application"
	@echo "  make run            - Run with demo data"
	@echo "  make run-file       - Run with log file (use FILE=/path/to/log)"
	@echo "  make run-agent      - Run connecting to agent"
	@echo "  make test           - Run tests"
	@echo "  make test-coverage  - Run tests with coverage report"
	@echo "  make test-race      - Run tests with race detector"
	@echo "  make bench          - Run benchmarks"
	@echo "  make clean          - Clean build artifacts"
	@echo "  make fmt            - Format code"
	@echo "  make lint           - Lint code (requires golangci-lint)"
	@echo "  make vet            - Vet code"
	@echo "  make check          - Run all checks (fmt, vet, lint, test)"
	@echo "  make deps           - Download dependencies"
	@echo "  make tidy           - Tidy dependencies"
	@echo "  make update         - Update dependencies"
	@echo "  make docs           - Generate and serve documentation"
	@echo "  make help           - Show this help message"
	@echo ""
	@echo "Examples:"
	@echo "  make build"
	@echo "  make run"
	@echo "  make run-file FILE=/var/log/traefik/access.log"
	@echo "  make test-coverage"

# Development mode - watch for changes and rebuild
.PHONY: dev
dev:
	@echo "Development mode - watching for changes..."
	@if command -v air > /dev/null; then \
		air; \
	else \
		echo "air not installed. Install with: go install github.com/cosmtrek/air@latest"; \
		echo "Falling back to simple rebuild..."; \
		while true; do \
			make build && ./$(BUILD_DIR)/$(BINARY_NAME) --demo; \
			sleep 2; \
		done; \
	fi