#!/bin/bash
set -e

echo "=== Building frontend ==="
cd "Archives/templates/Archives/vintage-e-commerce-frontend-build"

npm install
npm run build

cd ../../../..

echo "=== Running collectstatic ==="
export DATABASE_URL=""
export USE_REMOTE_DB="0"
export RUNSERVER_REMOTE_DB="0"
python manage.py collectstatic --noinput

echo "=== Creating Vercel output structure ==="
mkdir -p .vercel/output/functions/api
mkdir -p .vercel/output/static

# Copy frontend build to static
cp -r Archives/templates/Archives/vintage-e-commerce-frontend-build/dist/* .vercel/output/static/
# Copy Django static files
cp -r staticfiles/admin .vercel/output/static/ 2>/dev/null || true
cp -r staticfiles/rest_framework .vercel/output/static/ 2>/dev/null || true
cp -r media .vercel/output/static/media/ 2>/dev/null || true
# Copy API function
cp api/index.py .vercel/output/functions/api/index.py

cat > .vercel/output/functions/api/.func << 'EOF'
{"runtime": "python3.9"}
EOF

cat > .vercel/output/config.json << 'EOF'
{
  "version": 3,
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/index"
    },
    {
      "handle": "filesystem"
    },
    {
      "src": "/(.*)",
      "dest": "/static/index.html"
    }
  ]
}
EOF

echo "=== Verifying config.json ==="
ls -la .vercel/output/config.json
cat .vercel/output/config.json

echo "=== Build complete ==="
