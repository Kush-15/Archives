import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'FOEPRO.settings')
django.setup()

from Archives.models import Product, Category, User

print("=" * 50)
print("SUPABASE DATABASE VERIFICATION")
print("=" * 50)
print()
print(f"Connected to: db.fqsyfscypmzsqupnegfu.supabase.co")
print()
print(f"Users:     {User.objects.count()}")
print(f"Categories: {Category.objects.count()}")
print(f"Products:   {Product.objects.count()}")
print()

if Product.objects.exists():
    print("Products in database:")
    for p in Product.objects.all():
        img = p.image_url[:50] + "..." if p.image_url and len(p.image_url) > 50 else (p.image_url or "No image")
        print(f"  [{p.id}] {p.name}")
        print(f"      Price: ${p.price} | Stock: {p.stock}")
        print(f"      Image URL: {img}")
        print()
else:
    print("No products found!")
