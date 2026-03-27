#!/usr/bin/env python
"""
Django runserver workaround - runs WSGI server directly without Django's runserver command.
This avoids the autoreloader/signal handling issues on Windows.
Usage: python runserver.py [port]
"""
import os
import sys
import signal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'FOEPRO.settings')

import django
django.setup()

from django.core.wsgi import get_wsgi_application
from django.conf import settings
from wsgiref.simple_server import make_server

application = get_wsgi_application()

def run_server(port):
    print(f"Starting server at http://127.0.0.1:{port}/")
    print(f"ALLOWED_HOSTS: {settings.ALLOWED_HOSTS}")
    print("Press Ctrl+C to stop")
    
    httpd = make_server('127.0.0.1', port, application)
    
    # Handle shutdown gracefully
    def shutdown(signum, frame):
        print("\nShutting down...")
        httpd.shutdown()
    
    signal.signal(signal.SIGINT, shutdown)
    
    # Use handle_request in a loop instead of serve_forever
    try:
        while True:
            httpd.handle_request()
    except KeyboardInterrupt:
        pass

if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    run_server(port)
