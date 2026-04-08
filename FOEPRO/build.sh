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
mkdir -p .vercel/output/static
mkdir -p .vercel/output/functions/api

cp -r Archives/static/* .vercel/output/static/ 2>/dev/null || true
cp -r media/* .vercel/output/static/media/ 2>/dev/null || true
cp api/index.py .vercel/output/functions/api/index.py

cat > .vercel/output/config.json << 'EOF'
{
  "version": 3,
  "functions": {
    "api/index.py": {
      "runtime": "python3.9",
      "handler": "api/index.py"
    }
  },
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/index.py"
    },
    {
      "src": "/static/(.*)",
      "dest": "/static/$1"
    },
    {
      "src": "/media/(.*)",
      "dest": "/static/media/$1"
    },
    {
      "handle": "filesystem"
    },
    {
      "src": "/(.*)",
      "dest": "/api/index.py"
    }
  ]
}
EOF

echo "=== Verifying config.json ==="
ls -la .vercel/output/config.json
cat .vercel/output/config.json

echo "=== Build complete ==="
