#!/bin/bash

# Mirrorship Data Sync Script
# This script can be run manually or via cron job

set -e  # Exit on any error

echo "🚀 Starting Mirrorship data sync..."

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    exit 1
fi

# Check if the sync script exists
if [ ! -f "scripts/sync-data.js" ]; then
    echo "❌ Sync script not found at scripts/sync-data.js"
    exit 1
fi

# Load environment variables if .env file exists
if [ -f ".env" ]; then
    echo "📋 Loading environment variables from .env"
    export $(grep -v '^#' .env | xargs)
fi

# Check required environment variables
if [ -z "$MONGODB_URI" ]; then
    echo "❌ MONGODB_URI environment variable is required"
    exit 1
fi

# Run the sync script
echo "🔄 Running data sync..."
node scripts/sync-data.js

echo "✅ Data sync completed successfully!"

# Optional: Log the sync time
echo "$(date): Data sync completed" >> sync.log