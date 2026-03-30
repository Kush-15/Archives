#!/bin/bash
set -e

# Navigate to frontend directory
cd "Archives/templates/Archives/vintage-e-commerce-frontend-build"

# Install dependencies and build frontend
npm install
npm run build

# Return to project root
cd ../../../..

# Use SQLite for collectstatic (psycopg2 fails on Vercel serverless)
export DATABASE_URL=""
export USE_REMOTE_DB="0"
export RUNSERVER_REMOTE_DB="0"
python manage.py collectstatic --noinput
