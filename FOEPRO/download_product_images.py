#!/usr/bin/env python
"""
Download product images from Wikipedia to local media/products/ directory.
Uses requests with proper headers to avoid rate limiting.
"""

import os
import time
import requests
from pathlib import Path

# Product image URLs from products.ts
PRODUCTS = {
    'sony-walkman-tps-l2': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Original_Sony_Walkman_TPS-L2.JPG/800px-Original_Sony_Walkman_TPS-L2.JPG',
    'apple-macintosh-128k': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Apple_Macintosh_128K.png/800px-Apple_Macintosh_128K.png',
    'polaroid-sx-70': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Vintage_Polaroid_SX-70_Land_Camera_-_Design_Museum_-_DSC01627.jpg/800px-Vintage_Polaroid_SX-70_Land_Camera_-_Design_Museum_-_DSC01627.jpg',
    'nintendo-nes': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Nintendo-Entertainment-System-NES-Console-FL.jpg/800px-Nintendo-Entertainment-System-NES-Console-FL.jpg',
    'braun-t1000': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Braun_T-1000_radio.jpg/800px-Braun_T-1000_radio.jpg',
    'sony-trinitron-kv1310': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c6/Trinitron_KV-1320UB_back.jpg/800px-Trinitron_KV-1320UB_back.jpg',
    'hasselblad-500c': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Hasselblad_500_c_camera.jpg/800px-Hasselblad_500_c_camera.jpg',
    'ibm-model-m': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/IBM_Model_M_keyboard_%28US_layout_with_101_keys%29.jpg/800px-IBM_Model_M_keyboard_%28US_layout_with_101_keys%29.jpg',
    'atari-2600': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Atari-2600-Console.jpg/800px-Atari-2600-Console.jpg',
    'technics-sl1200': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Technics_SL-1200MK2-2.jpg/800px-Technics_SL-1200MK2-2.jpg',
    'commodore-64': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Commodore-64-Computer-FL.jpg/800px-Commodore-64-Computer-FL.jpg',
    'leica-m3': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Leica_M3.jpg/800px-Leica_M3.jpg',
}

# Output directory
OUTPUT_DIR = Path(__file__).parent / 'media' / 'products'

# Headers to mimic a browser request (helps avoid rate limiting)
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://en.wikipedia.org/',
}


def download_image(slug: str, url: str) -> bool:
    """Download a single image and save it locally."""
    # Determine file extension from URL
    ext = '.jpg'
    if '.png' in url.lower():
        ext = '.png'
    elif '.jpeg' in url.lower():
        ext = '.jpeg'
    
    output_path = OUTPUT_DIR / f'{slug}{ext}'
    
    # Skip if already downloaded
    if output_path.exists():
        print(f'[SKIP] {slug} - already exists')
        return True
    
    print(f'[DOWNLOAD] {slug}...')
    
    try:
        response = requests.get(url, headers=HEADERS, timeout=30)
        response.raise_for_status()
        
        with open(output_path, 'wb') as f:
            f.write(response.content)
        
        print(f'[OK] {slug} - saved ({len(response.content) / 1024:.1f} KB)')
        return True
        
    except requests.exceptions.RequestException as e:
        print(f'[ERROR] {slug} - {e}')
        return False


def main():
    """Download all product images."""
    print('=' * 60)
    print('Product Image Downloader')
    print('=' * 60)
    
    # Ensure output directory exists
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    print(f'Output directory: {OUTPUT_DIR}')
    print()
    
    success = 0
    failed = 0
    
    for slug, url in PRODUCTS.items():
        if download_image(slug, url):
            success += 1
        else:
            failed += 1
        
        # Small delay to be polite to Wikipedia servers
        time.sleep(0.5)
    
    print()
    print('=' * 60)
    print(f'Complete! {success} downloaded, {failed} failed')
    print('=' * 60)
    
    if failed > 0:
        print('\nNote: Some images failed to download. You may need to:')
        print('1. Run the script again later')
        print('2. Download them manually from the URLs above')


if __name__ == '__main__':
    main()
