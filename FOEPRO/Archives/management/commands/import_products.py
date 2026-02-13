from django.core.management.base import BaseCommand
from Archives.models import Category, Product
import json
import csv


class Command(BaseCommand):
    help = 'Import products from JSON or CSV file'

    def add_arguments(self, parser):
        parser.add_argument('file_path', type=str, help='Path to JSON or CSV file')
        parser.add_argument('--format', type=str, choices=['json', 'csv'], default='json', help='File format')

    def handle(self, *args, **options):
        file_path = options['file_path']
        format_type = options['format']

        if format_type == 'json':
            self.import_from_json(file_path)
        else:
            self.import_from_csv(file_path)

        self.stdout.write(self.style.SUCCESS('Products imported successfully!'))

    def import_from_json(self, file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            products = json.load(f)

        for product_data in products:
            category_name = product_data.get('category', 'Uncategorized')
            category, _ = Category.objects.get_or_create(name=category_name)

            product, created = Product.objects.update_or_create(
                name=product_data['name'],
                defaults={
                    'category': category,
                    'description': product_data.get('description', ''),
                    'price': product_data.get('price', 0),
                    'stock': product_data.get('stock', 0),
                    'image': product_data.get('image', ''),
                }
            )
            action = 'Created' if created else 'Updated'
            self.stdout.write(f'{action}: {product.name}')

    def import_from_csv(self, file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                category_name = row.get('category', 'Uncategorized')
                category, _ = Category.objects.get_or_create(name=category_name)

                product, created = Product.objects.update_or_create(
                    name=row['name'],
                    defaults={
                        'category': category,
                        'description': row.get('description', ''),
                        'price': row.get('price', 0),
                        'stock': row.get('stock', 0),
                    }
                )
                action = 'Created' if created else 'Updated'
                self.stdout.write(f'{action}: {product.name}')
