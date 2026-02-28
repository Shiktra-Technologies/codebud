#!/usr/bin/env python3
"""Test MongoDB connection and verify database is working"""

import os
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

def test_mongodb_connection():
    """Test MongoDB connection and basic operations"""
    print("\n" + "="*60)
    print("MongoDB Connection Test")
    print("="*60)
    
    mongodb_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/')
    database_name = os.getenv('DATABASE_NAME', 'codebud')
    
    print(f"\n[1] Testing connection to: {database_name}")
    print(f"    URI: {mongodb_uri[:30]}...")
    
    try:
        # Create client with timeout
        client = MongoClient(mongodb_uri, serverSelectionTimeoutMS=5000)
        
        # Test connection
        print("\n[2] Attempting to connect...")
        server_info = client.server_info()
        print(f"    ✓ Connected successfully!")
        print(f"    MongoDB version: {server_info.get('version', 'unknown')}")
        
        # Get database
        db = client[database_name]
        
        # Check if db is None
        print(f"\n[3] Database object check:")
        print(f"    db is not None: {db is not None}")
        print(f"    Database name: {db.name}")
        
        # List collections
        print(f"\n[4] Checking collections...")
        collections = db.list_collection_names()
        if collections:
            print(f"    Found {len(collections)} collections:")
            for coll in collections:
                count = db[coll].count_documents({})
                print(f"      - {coll}: {count} documents")
        else:
            print("    No collections found (fresh database)")
        
        # Test write operation
        print(f"\n[5] Testing write operation...")
        test_collection = db['_connection_test']
        result = test_collection.insert_one({'test': True, 'timestamp': 'test'})
        print(f"    ✓ Write successful! ID: {result.inserted_id}")
        
        # Test read operation
        print(f"\n[6] Testing read operation...")
        doc = test_collection.find_one({'test': True})
        print(f"    ✓ Read successful! Found document: {doc is not None}")
        
        # Cleanup
        test_collection.delete_one({'test': True})
        print(f"    ✓ Cleanup successful!")
        
        print("\n" + "="*60)
        print("✅ ALL TESTS PASSED - MongoDB is working correctly!")
        print("="*60 + "\n")
        
        return True
        
    except Exception as e:
        print(f"\n❌ CONNECTION FAILED!")
        print(f"    Error: {type(e).__name__}")
        print(f"    Message: {str(e)}")
        print("\n" + "="*60)
        print("Database will fall back to Mock (In-Memory) mode")
        print("="*60 + "\n")
        return False

if __name__ == '__main__':
    test_mongodb_connection()
