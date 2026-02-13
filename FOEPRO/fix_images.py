import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'FOEPRO.settings')
django.setup()

from Archives.models import Product

print("Copying image URLs to image_url field...")

for p in Product.objects.all():
    img = str(p.image) if p.image else ''
    if img.startswith('http'):
        p.image_url = img
        p.image = None
        p.save()
        print(f"  {p.name}: {p.image_url[:50]}...")
    elif img:
        print(f"  {p.name}: Local file - {img}")
    else:
        print(f"  {p.name}: No image")

print("\nDone!")
