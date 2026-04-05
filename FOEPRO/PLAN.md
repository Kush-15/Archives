# Plan: Local Product Image Integration via icrawler
## Problem
Product images on TheArchives are not loading because they reference external Wikipedia URLs, which return *429 (Too Many Requests)* due to rate limiting. The \Product\ model also has no image field (removed in migration 0007).
## Solution
Use *icrawler* (free Python library) to download product images locally, serve them from the Django backend, and update the frontend to use local paths.
---
## Steps
### Step 1: Install icrawler
\\\`bash
pip install icrawler
\\\`
### Step 2: Create image download script
*File:* \FOEPRO/download_product_images.py\
- Python script that uses icrawler's \GoogleImageCrawler\ to download 1 high-quality image per product
- Use product names as search keywords (e.g., \"Sony Walkman TPS-L2 vintage\")
- Save images to \media/products/\ with slug-based filenames (e.g., \sony-walkman-tpsl2.jpg\)
- Filter for \min_size=(400, 400)\ to ensure adequate quality
### Step 3: Create media directory
- Ensure \media/products/\ directory exists under \FOEPRO/\
- Django's \MEDIA_ROOT\ is already configured at \BASE_DIR / 'media'\
### Step 4: Update frontend product data
*File:* \Archives/templates/Archives/vintage-e-commerce-frontend-build/src/data/products.ts\
- Replace all 12 Wikipedia URLs with local paths: \/media/products/{slug}.jpg\
- Each product's \images\ array will point to the locally downloaded image
### Step 5: Re-add image field to Product model (backend)
*File:* \Archives/models.py\
- Add \image_url = CharField(max_length=500, blank=True, null=True)\ to Product model
- Create a new migration via \python manage.py makemigrations\
*File:* \Archives/serializers.py\
- Add \image_url\ to the serializer \fields\
### Step 6: Update \api_link_product\ view
*File:* \Archives/views.py\
- Pass \image_url\ from the frontend when linking products to the backend
- Update \ProductDetail.tsx\ to send \image_url\ alongside slug/name/category
### Step 7: Verify
- Run \python manage.py migrate\ to apply the new migration
- Confirm images are served at \/media/products/\ in DEBUG mode
- Verify frontend renders images from local paths
---
## Files to modify
| # | File | Action |
|---|------|--------|
| 1 | \FOEPRO/download_product_images.py\ | *NEW* — icrawler download script |
| 2 | \Archives/models.py\ | Add \image_url\ field |
| 3 | \Archives/serializers.py\ | Add \image_url\ to fields |
| 4 | \Archives/views.py\ | Handle \image_url\ in \api_link_product\ |
| 5 | \src/data/products.ts\ | Update 12 image URLs to local paths |
| 6 | \src/pages/ProductDetail.tsx\ | Send \image_url\ when linking product |
## Why icrawler over NanoBanana
- *Free* — no API costs (NanoBanana: \$0.045–\$0.151 per image)
- *Real product photos* — downloads actual photos of real vintage products
- *Simple integration* — \pip install\ + 5 lines of code
- *Adequate for this use case* — 12 known vintage products with well-documented imagery online
## Current state
- 12 products in \products.ts\ each with a single Wikipedia image URL
- Wikipedia URLs return 429 (rate limited) — images fail to load
- Product model has no image field (removed in migration 0007)
- \MEDIA_ROOT\ and \MEDIA_URL\ already configured in \settings.py\
- No local product images exist yet
<environment_details>
Current time: 2026-04-04T23:03:22+05:30
</environment_details>