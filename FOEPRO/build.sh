#!/bin/bash
set -e

echo "=== Building frontend ==="
cd "Archives/templates/Archives/vintage-e-commerce-frontend-build"

# Install dependencies and build frontend
npm install
npm run build

# Return to project root
cd ../../../..

echo "=== Running collectstatic ==="
# Use SQLite for collectstatic (psycopg2 fails on Vercel serverless)
export DATABASE_URL=""
export USE_REMOTE_DB="0"
export RUNSERVER_REMOTE_DB="0"
python manage.py collectstatic --noinput

echo "=== Build complete ==="
