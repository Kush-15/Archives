import psycopg2
import socket
import os
import sys

# ==========================================
# CREDENTIALS (Hardcoded for testing)
# ==========================================
# Direct Connection (Port 5432)
DIRECT_HOST = "db.fqsyfscypmzsqupnegfu.supabase.co"

# Pooler Connection (Port 6543)
POOLER_HOST = "aws-0-ap-south-1.pooler.supabase.com"

# Common Credentials
DB_NAME = "postgres"
DB_USER = "postgres.fqsyfscypmzsqupnegfu"
DB_PASS = "fDp4WJkBwkpZRhKK" # Ensure this is your current password

print("\n" + "="*60)
print("🔎 SUPABASE CONNECTION DIAGNOSTIC")
print("="*60 + "\n")

# ---------------------------------------------------------
# TEST 1: DNS Lookup (Checking if your internet blocks it)
# ---------------------------------------------------------
print(f"TEST 1: DNS Lookup for Direct Host ({DIRECT_HOST})")
try:
    ip = socket.gethostbyname(DIRECT_HOST)
    print(f"   ✅ SUCCESS! Resolved to IP: {ip}")
except socket.gaierror as e:
    print(f"   ❌ FAILED! DNS Error. Your internet cannot find Supabase.")
    print(f"   Error: {e}")
    print("   👉 TIP: Try switching to Mobile Hotspot or checking VPN.")

print("-" * 60)

# ---------------------------------------------------------
# TEST 2: Connection Pooler (Port 6543) - PREFERRED
# ---------------------------------------------------------
print(f"TEST 2: Testing Pooler Connection (Port 6543)")
print(f"   Host: {POOLER_HOST}")
print(f"   User: {DB_USER}")
try:
    conn = psycopg2.connect(
        host=POOLER_HOST,
        port=6543,
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASS,
        sslmode='require',
        connect_timeout=10
    )
    print("   ✅ SUCCESS! Connected via Pooler (6543).")
    conn.close()
except psycopg2.OperationalError as e:
    print("   ❌ FAILED! Could not connect to Pooler.")
    print(f"   Error: {e}")
    if "password authentication failed" in str(e):
        print("   👉 DIAGNOSIS: Wrong Password. Please reset it in Supabase Dashboard.")
    elif "Tenant or user not found" in str(e):
        print("   👉 DIAGNOSIS: Supabase internal sync issue. RESET PASSWORD in Dashboard to fix.")

print("-" * 60)

# ---------------------------------------------------------
# TEST 3: Direct Connection (Port 5432) - FALLBACK
# ---------------------------------------------------------
print(f"TEST 3: Testing Direct Connection (Port 5432)")
print(f"   Host: {DIRECT_HOST}")
try:
    conn = psycopg2.connect(
        host=DIRECT_HOST,
        port=5432,
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASS,
        sslmode='require',
        connect_timeout=10
    )
    print("   ✅ SUCCESS! Connected via Direct Host (5432).")
    conn.close()
except Exception as e:
    print("   ❌ FAILED! Could not connect Direct.")
    print(f"   Error: {e}")

print("\n" + "="*60 + "\n")