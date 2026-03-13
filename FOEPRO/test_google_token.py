#!/usr/bin/env python
"""
Debug script to test Google OAuth token verification.
This helps identify issues with token verification without needing a full OAuth flow.
"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'FOEPRO.settings')
django.setup()

from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests
from Archives.google_oauth import _get_credentials
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def test_credentials_loading():
    """Test if credentials can be loaded."""
    print("\n=== Testing Credentials Loading ===")
    try:
        creds = _get_credentials()
        print(f"✓ Client ID: {creds['client_id'][:40]}...")
        print(f"✓ Client Secret: {creds['client_secret'][:20]}...")
        print(f"✓ Redirect URI: {creds['redirect_uri']}")
        return creds
    except Exception as e:
        print(f"✗ Error loading credentials: {e}")
        return None

def test_certs_fetch():
    """Test if we can fetch Google's public certs for token verification."""
    print("\n=== Testing Google Certs Fetch ===")
    try:
        from google.auth import jwt
        # Try to fetch the cert set that would be used for verification
        request = google_requests.Request()
        # This is what verify_oauth2_token does internally
        from google.oauth2._service_account import _GOOGLE_OAUTH2_CERT_RE
        
        print("✓ Can import verification libraries")
        print("  (Full cert fetch requires a valid ID token)")
        return True
    except Exception as e:
        print(f"✗ Error with verification library: {e}")
        return False

def main():
    print("=" * 60)
    print("Google OAuth Token Verification Test")
    print("=" * 60)
    
    creds = test_credentials_loading()
    if not creds:
        sys.exit(1)
    
    test_certs_fetch()
    
    print("\n" + "=" * 60)
    print("Next steps:")
    print("1. Go to http://127.0.0.1:8000/api/auth/google/login/")
    print("2. Select your Google account")
    print("3. Check Django server console for detailed error logs")
    print("=" * 60)

if __name__ == '__main__':
    main()
