#!/bin/sh
set -e

# Create data directory if it doesn't exist
mkdir -p /app/data 2>/dev/null || true

# Execute the command
exec "$@"
