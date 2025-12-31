#!/bin/sh
set -e

# Create data directory if it doesn't exist
mkdir -p /app/data 2>/dev/null || true

# Create geolite2-redist cache directory with proper permissions
# This directory is needed for geolite2-redist to download and cache GeoLite2 databases
# The directory must exist and be writable for geolite2-redist to download databases
if [ -d "/app/node_modules/geolite2-redist" ]; then
  mkdir -p /app/node_modules/geolite2-redist/dbs-tmp 2>/dev/null || true
  chmod 755 /app/node_modules/geolite2-redist/dbs-tmp 2>/dev/null || true
  # Ensure the directory is writable (fix permissions if needed)
  chmod -R u+w /app/node_modules/geolite2-redist/dbs-tmp 2>/dev/null || true
else
  # If geolite2-redist directory doesn't exist, create it
  # This can happen if the package structure is different
  mkdir -p /app/node_modules/geolite2-redist/dbs-tmp 2>/dev/null || true
  chmod 755 /app/node_modules/geolite2-redist/dbs-tmp 2>/dev/null || true
fi

# Execute the command
exec "$@"
