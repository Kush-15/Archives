#!/bin/bash

# Navigate to frontend directory
cd "Archives/templates/Archives/vintage-e-commerce-frontend-build"

# Install dependencies and build frontend
npm install
npm run build

# Return to project root and collect static files
cd ../../../..
python manage.py collectstatic --noinput
