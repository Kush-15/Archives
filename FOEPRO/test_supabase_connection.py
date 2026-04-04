#!/usr/bin/env python
"""Test script to verify Supabase connection strings"""

import psycopg2
import sys
import os
from time import sleep

# Fix encoding for Windows
if sys.platform.startswith('win'):
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Connection strings to test
CONNECTION_STRINGS = {
    "connection_string_1": "postgresql://postgres:FCHJo8Q5qr33MWWf@db.fqsyfscypmzsqupnegfu.supabase.co:5432/postgres",
    "connection_string_2": "postgresql://postgres.fqsyfscypmzsqupnegfu:FCHJo8Q5qr33MWWf@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"
}

def test_connection(name, connection_string):
    """Test a single connection string"""
    print(f"\n{'='*60}")
    print(f"Testing: {name}")
    print(f"Connection string: {connection_string[:50]}...")
    print(f"{'='*60}")
    
    try:
        print("Attempting to connect...")
        conn = psycopg2.connect(connection_string)
        
        # Test the connection with a simple query
        cursor = conn.cursor()
        cursor.execute("SELECT version();")
        version = cursor.fetchone()
        
        print("[SUCCESS] Connected successfully!")
        print(f"PostgreSQL version: {version[0]}")
        
        # Try to list tables
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            LIMIT 5;
        """)
        tables = cursor.fetchall()
        print(f"Sample tables found: {len(tables)}")
        if tables:
            for table in tables:
                print(f"  - {table[0]}")
        
        cursor.close()
        conn.close()
        return True
        
    except psycopg2.OperationalError as e:
        print("[FAILED] Connection Error")
        print(f"Error: {str(e)[:200]}")
        return False
    except Exception as e:
        print("[FAILED] Unexpected Error")
        print(f"Error: {type(e).__name__}: {str(e)[:200]}")
        return False

def main():
    print("\n" + "="*60)
    print("Supabase Connection String Test")
    print("="*60)
    
    results = {}
    
    for name, connection_string in CONNECTION_STRINGS.items():
        results[name] = test_connection(name, connection_string)
        sleep(1)  # Small delay between attempts
    
    # Summary
    print(f"\n{'='*60}")
    print("SUMMARY")
    print(f"{'='*60}")
    
    working_connections = [name for name, success in results.items() if success]
    
    if working_connections:
        print("\n[SUCCESS] Working connection(s):")
        for name in working_connections:
            print(f"  - {name}")
            if name == "connection_string_2":
                print(f"    -> Use this for your .env file (original pooler connection)")
    else:
        print("\n[FAILED] No working connections found")
        print("Please verify:")
        print("  1. Credentials are correct")
        print("  2. Network/firewall allows outbound connections")
        print("  3. Supabase project is active")
    
    print(f"{'='*60}\n")
    
    return 0 if working_connections else 1

if __name__ == "__main__":
    sys.exit(main())
