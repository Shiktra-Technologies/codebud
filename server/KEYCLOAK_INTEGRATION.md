# Keycloak Integration Guide

## Overview

CodeBud now supports Keycloak for centralized authentication and authorization. This integration provides:

- Single Sign-On (SSO) capabilities
- Centralized user management
- Role-based access control (RBAC)
- Token-based authentication
- Backwards compatibility with custom JWT tokens

## Architecture

The application now supports **dual authentication modes**:

1. **Keycloak Authentication** (Primary) - When Keycloak is configured
2. **Custom JWT Authentication** (Fallback) - For backwards compatibility

### Authentication Flow

1. Client sends request with `Authorization: Bearer <token>` header
2. Server attempts Keycloak token verification first
3. If Keycloak is not configured or token is invalid, falls back to custom JWT
4. User context is set in Flask's `g` object for request handling

## Setup Instructions

### 1. Install Dependencies

```bash
cd server
pip install -r requirements.txt
```

This will install `python-keycloak==3.9.0` along with other dependencies.

### 2. Configure Keycloak Server

#### Option A: Docker (Recommended for Development)

```bash
docker run -d \
  --name keycloak \
  -p 8080:8080 \
  -e KEYCLOAK_ADMIN=admin \
  -e KEYCLOAK_ADMIN_PASSWORD=admin \
  quay.io/keycloak/keycloak:latest \
  start-dev
```

#### Option B: Manual Installation

Download and install Keycloak from: https://www.keycloak.org/downloads

### 3. Create Realm and Client

1. **Access Keycloak Admin Console**
   - URL: `http://localhost:8080/`
   - Username: `admin`
   - Password: `admin`

2. **Create Realm**
   - Name: `codebud`
   - Click "Create"

3. **Create Client**
   - Client ID: `codebud-backend`
   - Client Protocol: `openid-connect`
   - Access Type: `confidential`
   - Valid Redirect URIs: `*` (for development)
   - Save and copy the **Client Secret** from the Credentials tab

### 4. Create Roles

Create the following realm roles in Keycloak:

- `student` (default role)
- `mentor`
- `company`
- `admin`
- `super_admin`

**To create roles:**
1. Go to Realm Settings → Roles
2. Click "Add Role"
3. Enter role name and save

### 5. Configure Environment Variables

Create a `.env` file in the `server/` directory:

```bash
# Copy from example
cp .env.example .env
```

Edit `.env` and set Keycloak configuration:

```env
# Keycloak Configuration
KEYCLOAK_SERVER_URL=http://localhost:8080/
KEYCLOAK_REALM=codebud
KEYCLOAK_CLIENT_ID=codebud-backend
KEYCLOAK_CLIENT_SECRET=<your-client-secret-from-keycloak>

# Keycloak Admin Credentials
KEYCLOAK_ADMIN_USERNAME=admin
KEYCLOAK_ADMIN_PASSWORD=admin
```

### 6. Test the Integration

Start the Flask server:

```bash
python app.py
```

The server will:
- Load Keycloak configuration
- Initialize Keycloak service
- Enable Keycloak authentication if properly configured

## Role Mapping

Keycloak roles are automatically mapped to application roles:

| Keycloak Role | Application Role | Priority |
|---------------|------------------|----------|
| super_admin   | super_admin      | Highest  |
| admin         | admin            | High     |
| mentor        | mentor           | Medium   |
| company       | company          | Low      |
| student       | student          | Default  |

**Priority Rules:**
- Users can have multiple roles in Keycloak
- The highest priority role is applied
- If no role is assigned, defaults to `student`

## API Usage

### Authentication Header

All protected endpoints require the Authorization header:

```http
Authorization: Bearer <keycloak-token-or-jwt>
```

### Token Types Supported

1. **Keycloak Access Token** (Primary)
   - Obtained from Keycloak OAuth2 flow
   - Contains user info and roles
   - Verified against Keycloak public key

2. **Custom JWT Token** (Fallback)
   - Legacy tokens from `/auth/login` endpoint
   - Still supported for backwards compatibility

### Example Request

```javascript
fetch('https://api.codebud.com/api/user/profile', {
  headers: {
    'Authorization': `Bearer ${keycloakToken}`,
    'Content-Type': 'application/json'
  }
})
```

## User Management

### Creating Users Programmatically

The Keycloak service provides methods for user management:

```python
from services.keycloak_service import keycloak_service

# Create a new user
user_id = keycloak_service.create_user(
    email='student@example.com',
    username='student',
    first_name='John',
    last_name='Doe',
    password='secure-password',
    role='student'
)

# Assign role to existing user
keycloak_service.assign_role_to_user(user_id, 'mentor')

# Update user role
keycloak_service.update_user_role(user_id, 'student', 'mentor')
```

### Manual User Creation (Keycloak Admin Console)

1. Go to Users → Add User
2. Fill in user details
3. Click "Save"
4. Go to Credentials tab → Set Password
5. Go to Role Mappings → Assign appropriate role

## Security Considerations

### Token Verification

- Keycloak tokens are verified using the realm's public key
- Token expiration is checked automatically
- Invalid or expired tokens return 401 Unauthorized

### Role-Based Access Control

Protected routes use decorators:

```python
@app.route('/admin/users')
@require_admin
def admin_users():
    # Only accessible by admin or super_admin
    pass

@app.route('/mentor/sessions')
@require_mentor
def mentor_sessions():
    # Accessible by mentor, admin, or super_admin
    pass
```

### Available Decorators

- `@require_auth` - Requires any authenticated user
- `@require_admin` - Requires admin or super_admin role
- `@require_mentor` - Requires mentor, admin, or super_admin role
- `@require_company` - Requires company, admin, or super_admin role
- `@require_super_admin` - Requires super_admin role only

## Troubleshooting

### Keycloak Not Available

If Keycloak server is not accessible:
- Application falls back to custom JWT authentication
- No Keycloak-specific errors are raised
- Check logs for connection warnings

### Token Verification Fails

If Keycloak tokens are being rejected:
1. Verify `KEYCLOAK_CLIENT_SECRET` is correct
2. Check that the realm name matches
3. Ensure token hasn't expired
4. Verify the token was issued by the correct realm

### Role Not Recognized

If user roles aren't working:
1. Check that roles exist in Keycloak realm
2. Verify roles are assigned to the user
3. Check role mapping logic in `keycloak_service.py`
4. Ensure token includes role information

### Installation Issues

If `python-keycloak` installation fails:
```bash
# Try upgrading pip first
pip install --upgrade pip

# Install with verbose output
pip install python-keycloak==3.9.0 -v
```

## Migration Guide

### From Custom JWT to Keycloak

1. **Keep Both Systems Running** (Recommended)
   - Configure Keycloak as primary
   - Keep JWT as fallback
   - Gradual migration of users

2. **Test Authentication**
   - Create test users in Keycloak
   - Verify token authentication works
   - Test all role-based access controls

3. **Migrate Existing Users**
   - Export users from MongoDB
   - Import into Keycloak using Admin API
   - Map existing roles to Keycloak roles

4. **Update Frontend**
   - Implement Keycloak login flow
   - Update token storage
   - Handle token refresh

## Production Deployment

### Environment Variables

Update `.env` for production:

```env
KEYCLOAK_SERVER_URL=https://auth.codebud.com/
KEYCLOAK_REALM=codebud-production
KEYCLOAK_CLIENT_ID=codebud-backend
KEYCLOAK_CLIENT_SECRET=<production-client-secret>
KEYCLOAK_ADMIN_USERNAME=<admin-username>
KEYCLOAK_ADMIN_PASSWORD=<secure-admin-password>
```

### SSL/TLS Configuration

- Use HTTPS for Keycloak server in production
- Configure SSL certificates
- Update redirect URIs to use HTTPS

### High Availability

For production environments:
- Deploy Keycloak in cluster mode
- Use external database (PostgreSQL recommended)
- Configure load balancer
- Set up backup and disaster recovery

## Resources

- [Keycloak Documentation](https://www.keycloak.org/documentation)
- [python-keycloak Library](https://python-keycloak.readthedocs.io/)
- [OAuth 2.0 / OpenID Connect](https://oauth.net/2/)

## Support

For issues or questions:
1. Check this documentation
2. Review Keycloak logs: `docker logs keycloak`
3. Review application logs
4. Contact DevOps team for production issues
