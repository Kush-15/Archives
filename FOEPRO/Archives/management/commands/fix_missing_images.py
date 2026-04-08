"""
Django management command to fix missing product images.
Creates placeholder images for products that don't have corresponding image files.
"""

from django.core.management.base import BaseCommand
from django.conf import settings
from Archives.models import Product
import os

try:
    from PIL import Image, ImageDraw, ImageFont
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False


class Command(BaseCommand):
    help = 'Create placeholder images for products with missing image files'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be created without actually creating files',
        )
        parser.add_argument(
            '--width',
            type=int,
            default=400,
            help='Width of placeholder images (default: 400)',
        )
        parser.add_argument(
            '--height',
            type=int,
            default=400,
            help='Height of placeholder images (default: 400)',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        width = options['width']
        height = options['height']
        
        # Define media products directory
        products_dir = os.path.join(settings.MEDIA_ROOT, 'products')
        
        # Ensure directory exists
        if not dry_run:
            os.makedirs(products_dir, exist_ok=True)
        
        # Get all products
        products = Product.objects.all()
        
        if not products.exists():
            self.stdout.write(self.style.WARNING('No products found in database'))
            return
        
        missing = []
        existing = []
        
        for product in products:
            image_filename = f"{product.slug}.jpg"
            image_path = os.path.join(products_dir, image_filename)
            
            if os.path.exists(image_path):
                existing.append(product)
            else:
                missing.append(product)
        
        self.stdout.write(f"\nProduct Image Status:")
        self.stdout.write(f"  Total products: {len(products)}")
        self.stdout.write(f"  Existing images: {len(existing)}")
        self.stdout.write(f"  Missing images: {len(missing)}")
        
        if existing:
            self.stdout.write(self.style.SUCCESS(f"\nProducts with images:"))
            for p in existing:
                self.stdout.write(f"  - {p.name} ({p.slug}.jpg)")
        
        if not missing:
            self.stdout.write(self.style.SUCCESS('\nAll products have images!'))
            return
        
        self.stdout.write(self.style.WARNING(f"\nProducts missing images:"))
        for p in missing:
            self.stdout.write(f"  - {p.name} ({p.slug}.jpg)")
        
        if dry_run:
            self.stdout.write(self.style.NOTICE('\n[DRY RUN] No files created'))
            return
        
        if not PIL_AVAILABLE:
            self.stdout.write(self.style.ERROR(
                '\nPillow (PIL) is not installed. Cannot create placeholder images.'
            ))
            self.stdout.write('Install with: pip install Pillow')
            self.stdout.write('\nAlternatively, manually create the following files:')
            for p in missing:
                self.stdout.write(f"  - {os.path.join(products_dir, f'{p.slug}.jpg')}")
            return
        
        # Color palette for vintage electronics theme
        colors = [
            (64, 64, 64),    # Dark gray
            (45, 52, 54),    # Charcoal
            (44, 62, 80),    # Dark blue-gray
            (39, 55, 70),    # Navy
            (52, 73, 94),    # Dark steel
            (55, 66, 83),    # Slate
            (74, 35, 90),    # Purple
            (40, 55, 71),    # Dark teal
            (30, 39, 46),    # Almost black
            (46, 64, 83),    # Blue gray
        ]
        
        created_count = 0
        for i, product in enumerate(missing):
            image_filename = f"{product.slug}.jpg"
            image_path = os.path.join(products_dir, image_filename)
            
            # Pick a color based on index
            bg_color = colors[i % len(colors)]
            
            try:
                self._create_placeholder(
                    image_path,
                    product.name,
                    width,
                    height,
                    bg_color
                )
                self.stdout.write(self.style.SUCCESS(f'Created: {image_filename}'))
                created_count += 1
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Failed to create {image_filename}: {e}'))
        
        self.stdout.write(self.style.SUCCESS(f'\nCreated {created_count} placeholder images'))

    def _create_placeholder(self, path, product_name, width, height, bg_color):
        """Create a placeholder image with product name text."""
        # Create image with background color
        img = Image.new('RGB', (width, height), color=bg_color)
        draw = ImageDraw.Draw(img)
        
        # Calculate text color (light color for dark backgrounds)
        text_color = (220, 220, 220)
        
        # Try to use a system font, fall back to default if not available
        font_size = min(width, height) // 12
        try:
            # Try common system fonts
            font_names = ['arial.ttf', 'Arial.ttf', 'DejaVuSans.ttf', 'FreeSans.ttf']
            font = None
            for font_name in font_names:
                try:
                    font = ImageFont.truetype(font_name, font_size)
                    break
                except (OSError, IOError):
                    continue
            if font is None:
                font = ImageFont.load_default()
        except Exception:
            font = ImageFont.load_default()
        
        # Word wrap the product name
        words = product_name.split()
        lines = []
        current_line = ""
        max_chars_per_line = width // (font_size // 2 + 2)  # Approximate
        
        for word in words:
            test_line = f"{current_line} {word}".strip()
            if len(test_line) <= max_chars_per_line:
                current_line = test_line
            else:
                if current_line:
                    lines.append(current_line)
                current_line = word
        if current_line:
            lines.append(current_line)
        
        # Draw centered text
        line_height = font_size + 10
        total_text_height = len(lines) * line_height
        y_start = (height - total_text_height) // 2
        
        for i, line in enumerate(lines):
            # Get text bounding box
            bbox = draw.textbbox((0, 0), line, font=font)
            text_width = bbox[2] - bbox[0]
            x = (width - text_width) // 2
            y = y_start + i * line_height
            draw.text((x, y), line, fill=text_color, font=font)
        
        # Add a subtle border
        border_color = tuple(min(c + 30, 255) for c in bg_color)
        draw.rectangle([0, 0, width-1, height-1], outline=border_color, width=2)
        
        # Add "PLACEHOLDER" label at bottom
        small_font_size = font_size // 2
        try:
            small_font = ImageFont.truetype('arial.ttf', small_font_size)
        except (OSError, IOError):
            small_font = ImageFont.load_default()
        
        label = "PLACEHOLDER"
        label_bbox = draw.textbbox((0, 0), label, font=small_font)
        label_width = label_bbox[2] - label_bbox[0]
        label_x = (width - label_width) // 2
        label_y = height - small_font_size - 20
        draw.text((label_x, label_y), label, fill=(150, 150, 150), font=small_font)
        
        # Save as JPEG
        img.save(path, 'JPEG', quality=85)
