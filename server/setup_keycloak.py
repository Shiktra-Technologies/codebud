#!/usr/bin/env python3
"""
Keycloak Setup Script
Automatically configures Keycloak realm, client, and roles for CodeBud
"""
import requests
import json
import sys
import time

# Keycloak Configuration
KEYCLOAK_URL = "http://localhost:8080"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin"
REALM_NAME = "codebud"
CLIENT_ID = "codebud-backend"

def get_admin_token():
    """Get admin access token"""
    url = f"{KEYCLOAK_URL}/realms/master/protocol/openid-connect/token"
    data = {
        'client_id': 'admin-cli',
        'username': ADMIN_USERNAME,
        'password': ADMIN_PASSWORD,
        'grant_type': 'password'
    }
    
    try:
        response = requests.post(url, data=data)
        response.raise_for_status()
        return response.json()['access_token']
    except Exception as e:
        print(f"❌ Failed to get admin token: {e}")
        sys.exit(1)

def create_realm(token):
    """Create CodeBud realm"""
    url = f"{KEYCLOAK_URL}/admin/realms"
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    realm_config = {
        'realm': REALM_NAME,
        'enabled': True,
        'displayName': 'CodeBud Platform',
        'registrationAllowed': False,
        'loginWithEmailAllowed': True,
        'duplicateEmailsAllowed': False,
        'resetPasswordAllowed': True,
        'editUsernameAllowed': False,
        'bruteForceProtected': True
    }
    
    try:
        response = requests.post(url, headers=headers, json=realm_config)
        if response.status_code == 201:
            print(f"✅ Realm '{REALM_NAME}' created successfully")
            return True
        elif response.status_code == 409:
            print(f"ℹ️  Realm '{REALM_NAME}' already exists")
            return True
        else:
            print(f"❌ Failed to create realm: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error creating realm: {e}")
        return False

def create_roles(token):
    """Create application roles"""
    roles = ['student', 'mentor', 'company', 'admin', 'super_admin']
    
    for role in roles:
        url = f"{KEYCLOAK_URL}/admin/realms/{REALM_NAME}/roles"
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
        
        role_config = {
            'name': role,
            'description': f'CodeBud {role} role'
        }
        
        try:
            response = requests.post(url, headers=headers, json=role_config)
            if response.status_code == 201:
                print(f"✅ Role '{role}' created")
            elif response.status_code == 409:
                print(f"ℹ️  Role '{role}' already exists")
            else:
                print(f"⚠️  Warning: Failed to create role '{role}': {response.status_code}")
        except Exception as e:
            print(f"⚠️  Error creating role '{role}': {e}")

def create_client(token):
    """Create CodeBud backend client"""
    url = f"{KEYCLOAK_URL}/admin/realms/{REALM_NAME}/clients"
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    client_config = {
        'clientId': CLIENT_ID,
        'name': 'CodeBud Backend API',
        'description': 'Backend API client for CodeBud platform',
        'enabled': True,
        'clientAuthenticatorType': 'client-secret',
        'redirectUris': ['*'],
        'webOrigins': ['*'],
        'protocol': 'openid-connect',
        'publicClient': False,
        'bearerOnly': False,
        'standardFlowEnabled': True,
        'implicitFlowEnabled': False,
        'directAccessGrantsEnabled': True,
        'serviceAccountsEnabled': True,
        'authorizationServicesEnabled': False,
        'fullScopeAllowed': True
    }
    
    try:
        response = requests.post(url, headers=headers, json=client_config)
        if response.status_code == 201:
            print(f"✅ Client '{CLIENT_ID}' created successfully")
            return True
        elif response.status_code == 409:
            print(f"ℹ️  Client '{CLIENT_ID}' already exists")
            return True
        else:
            print(f"❌ Failed to create client: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error creating client: {e}")
        return False

def get_client_secret(token):
    """Get client secret for the backend client"""
    # First, get the client UUID
    url = f"{KEYCLOAK_URL}/admin/realms/{REALM_NAME}/clients"
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    try:
        response = requests.get(url, headers=headers, params={'clientId': CLIENT_ID})
        response.raise_for_status()
        clients = response.json()
        
        if not clients:
            print(f"❌ Client '{CLIENT_ID}' not found")
            return None
        
        client_uuid = clients[0]['id']
        
        # Get client secret
        secret_url = f"{KEYCLOAK_URL}/admin/realms/{REALM_NAME}/clients/{client_uuid}/client-secret"
        secret_response = requests.get(secret_url, headers=headers)
        secret_response.raise_for_status()
        
        secret = secret_response.json()['value']
        print(f"✅ Client secret retrieved")
        return secret
        
    except Exception as e:
        print(f"❌ Error getting client secret: {e}")
        return None

def update_env_file(client_secret):
    """Update .env file with client secret"""
    try:
        with open('.env', 'r') as f:
            content = f.read()
        
        # Replace placeholder with actual secret
        updated_content = content.replace(
            'KEYCLOAK_CLIENT_SECRET=<your-client-secret-from-keycloak>',
            f'KEYCLOAK_CLIENT_SECRET={client_secret}'
        )
        
        with open('.env', 'w') as f:
            f.write(updated_content)
        
        print(f"✅ .env file updated with client secret")
        return True
    except Exception as e:
        print(f"❌ Error updating .env file: {e}")
        return False

def main():
    print("=" * 60)
    print("CodeBud Keycloak Setup")
    print("=" * 60)
    print()
    
    # Wait a bit for Keycloak to be fully ready
    print("⏳ Waiting for Keycloak to be ready...")
    time.sleep(2)
    
    # Get admin token
    print("🔑 Getting admin access token...")
    token = get_admin_token()
    print("✅ Admin token obtained")
    print()
    
    # Create realm
    print("🏗️  Creating realm...")
    if not create_realm(token):
        print("❌ Setup failed at realm creation")
        sys.exit(1)
    print()
    
    # Create roles
    print("👥 Creating roles...")
    create_roles(token)
    print()
    
    # Create client
    print("🔧 Creating client...")
    if not create_client(token):
        print("❌ Setup failed at client creation")
        sys.exit(1)
    print()
    
    # Get client secret
    print("🔐 Retrieving client secret...")
    client_secret = get_client_secret(token)
    if not client_secret:
        print("❌ Setup failed at secret retrieval")
        sys.exit(1)
    print()
    
    # Update .env file
    print("📝 Updating .env file...")
    if not update_env_file(client_secret):
        print("❌ Setup failed at .env update")
        sys.exit(1)
    print()
    
    print("=" * 60)
    print("✅ Keycloak setup completed successfully!")
    print("=" * 60)
    print()
    print("Configuration:")
    print(f"  Server URL: {KEYCLOAK_URL}")
    print(f"  Realm: {REALM_NAME}")
    print(f"  Client ID: {CLIENT_ID}")
    print(f"  Client Secret: {client_secret[:10]}...")
    print()
    print("Next steps:")
    print("  1. Restart your Flask server")
    print("  2. Access Keycloak Admin Console: http://localhost:8080/admin")
    print(f"     Username: {ADMIN_USERNAME}")
    print(f"     Password: {ADMIN_PASSWORD}")
    print("  3. Create users and assign roles as needed")
    print()

if __name__ == '__main__':
    main()
