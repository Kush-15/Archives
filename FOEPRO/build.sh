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
export DATABASE_URL=""
export USE_REMOTE_DB="0"
export RUNSERVER_REMOTE_DB="0"
python manage.py collectstatic --noinput

echo "=== Creating Vercel output structure ==="
# Create the output structure for Vercel
mkdir -p .vercel/output/static
mkdir -p .vercel/output/functions/api

# Copy static files to output
cp -r Archives/static/* .vercel/output/static/ 2>/dev/null || true

# Copy media files to output/static/media
cp -r media/* .vercel/output/static/media/ 2>/dev/null || true

# Copy Python function to output
cp api/index.py .vercel/output/functions/api/index.py

# Create config.json for Vercel build output API
cat > .vercel/output/config.json << EOF
{
  "functions": {
    ".vercel/output/functions/api/index.py": {
      "runtime": "python3.9"
    }
  },
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/functions/api/index.py"
    },
    {
      "src": "/static/(.*)"
    },
    {
      "src": "/media/(.*)"
    },
    {
      "src": "/(.*)",
      "dest": "/functions/api/index.py"
    }
  ]
}
EOF

echo "=== Build complete ==="
