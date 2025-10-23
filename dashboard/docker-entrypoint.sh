#!/bin/bash
set -e

# Create data directory if it doesn't exist
mkdir -p /app/data

# Fix ownership if running as root
if [ "$(id -u)" = "0" ]; then
  chown -R nodejs:nodejs /app/data
  chmod -R 755 /app/data
  
  # Execute as nodejs user
  exec gosu nodejs "$@"
else
  # Already running as nodejs user
  exec "$@"
fi