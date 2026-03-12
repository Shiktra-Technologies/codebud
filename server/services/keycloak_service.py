"""
Keycloak Service
Handles Keycloak authentication and authorization for the CodeBud platform.
"""
import os
import logging
from typing import Optional, Dict, Any
from keycloak import KeycloakOpenID, KeycloakAdmin
from keycloak.exceptions import KeycloakError, KeycloakAuthenticationError
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)


class KeycloakService:
    """Service for managing Keycloak authentication and user management"""

    def __init__(self):
        """Initialize Keycloak service with configuration from environment"""
        self.server_url = os.getenv('KEYCLOAK_SERVER_URL', 'http://localhost:8080/')
        self.realm_name = os.getenv('KEYCLOAK_REALM', 'codebud')
        self.client_id = os.getenv('KEYCLOAK_CLIENT_ID', 'codebud-backend')
        self.client_secret = os.getenv('KEYCLOAK_CLIENT_SECRET', '')
        
        # Admin credentials for user management
        self.admin_username = os.getenv('KEYCLOAK_ADMIN_USERNAME', 'admin')
        self.admin_password = os.getenv('KEYCLOAK_ADMIN_PASSWORD', '')
        
        # Initialize Keycloak OpenID Connect client
        self.keycloak_openid = KeycloakOpenID(
            server_url=self.server_url,
            client_id=self.client_id,
            realm_name=self.realm_name,
            client_secret_key=self.client_secret
        )
        
        # Initialize Keycloak Admin client (for user management)
        # Note: Admin user authenticates against 'master' realm, then manages the target realm
        self.keycloak_admin = None
        if self.admin_username and self.admin_password:
            try:
                # First, create admin connection to master realm
                admin_connection = KeycloakAdmin(
                    server_url=self.server_url,
                    username=self.admin_username,
                    password=self.admin_password,
                    realm_name='master',
                    verify=True
                )
                
                # Then create connection for managing the target realm
                self.keycloak_admin = KeycloakAdmin(
                    server_url=self.server_url,
                    token=admin_connection.token,
                    realm_name=self.realm_name,
                    verify=True
                )
                logger.info(f"Keycloak admin client initialized successfully for realm: {self.realm_name}")
            except Exception as e:
                logger.warning(f"Failed to initialize Keycloak admin client: {e}")
                # Try alternative approach - connect directly to realm with admin credentials
                try:
                    self.keycloak_admin = KeycloakAdmin(
                        server_url=self.server_url,
                        client_id=self.client_id,
                        client_secret_key=self.client_secret,
                        realm_name=self.realm_name,
                        verify=True
                    )
                    logger.info(f"Keycloak admin client initialized via client credentials")
                except Exception as e2:
                    logger.warning(f"Alternative admin initialization also failed: {e2}")

    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Verify and decode a Keycloak access token
        
        Args:
            token: The JWT access token from Keycloak
            
        Returns:
            Decoded token payload if valid, None otherwise
        """
        try:
            # Get public key from Keycloak
            KEYCLOAK_PUBLIC_KEY = (
                "-----BEGIN PUBLIC KEY-----\n"
                + self.keycloak_openid.public_key()
                + "\n-----END PUBLIC KEY-----"
            )
            
            # Decode and verify token
            options = {
                "verify_signature": True,
                "verify_aud": False,  # We might not have audience in every token
                "verify_exp": True
            }
            
            token_info = self.keycloak_openid.decode_token(
                token,
                key=KEYCLOAK_PUBLIC_KEY,
                options=options
            )
            
            return token_info
            
        except KeycloakAuthenticationError as e:
            logger.error(f"Keycloak authentication error: {e}")
            return None
        except Exception as e:
            logger.error(f"Token verification failed: {e}")
            return None

    def get_user_info(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Get user information from Keycloak using access token
        
        Args:
            token: The JWT access token
            
        Returns:
            User information dictionary or None
        """
        try:
            user_info = self.keycloak_openid.userinfo(token)
            return user_info
        except Exception as e:
            logger.error(f"Failed to get user info: {e}")
            return None

    def introspect_token(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Introspect token to check if it's active and get metadata
        
        Args:
            token: The JWT access token
            
        Returns:
            Token introspection result or None
        """
        try:
            token_info = self.keycloak_openid.introspect(token)
            return token_info if token_info.get('active') else None
        except Exception as e:
            logger.error(f"Token introspection failed: {e}")
            return None

    def get_user_roles(self, token_info: Dict[str, Any]) -> list:
        """
        Extract user roles from token information
        
        Args:
            token_info: Decoded token information
            
        Returns:
            List of role names
        """
        roles = []
        
        # Get realm roles
        if 'realm_access' in token_info:
            roles.extend(token_info['realm_access'].get('roles', []))
        
        # Get client roles
        if 'resource_access' in token_info and self.client_id in token_info['resource_access']:
            roles.extend(token_info['resource_access'][self.client_id].get('roles', []))
        
        return roles

    def map_keycloak_role_to_app_role(self, keycloak_roles: list) -> str:
        """
        Map Keycloak roles to application role
        
        Args:
            keycloak_roles: List of Keycloak role names
            
        Returns:
            Application role (super_admin, admin, mentor, company, student)
        """
        # Priority order: super_admin > admin > mentor > company > student
        role_priority = {
            'super_admin': 5,
            'admin': 4,
            'mentor': 3,
            'company': 2,
            'student': 1
        }
        
        mapped_role = 'student'  # Default role
        max_priority = 0
        
        for role in keycloak_roles:
            role_lower = role.lower().replace('-', '_')
            if role_lower in role_priority and role_priority[role_lower] > max_priority:
                mapped_role = role_lower
                max_priority = role_priority[role_lower]
        
        return mapped_role

    def create_user(self, email: str, username: str, first_name: str, 
                   last_name: str, password: str, role: str = 'student') -> Optional[str]:
        """
        Create a new user in Keycloak
        
        Args:
            email: User email
            username: Username
            first_name: First name
            last_name: Last name
            password: User password
            role: User role (will be added as Keycloak role)
            
        Returns:
            User ID if successful, None otherwise
        """
        if not self.keycloak_admin:
            logger.error("Keycloak admin client not initialized")
            return None
        
        try:
            # Create user
            user_id = self.keycloak_admin.create_user({
                "email": email,
                "username": username,
                "firstName": first_name,
                "lastName": last_name,
                "enabled": True,
                "emailVerified": False,
                "credentials": [{
                    "type": "password",
                    "value": password,
                    "temporary": False
                }]
            })
            
            # Assign role to user
            if role and user_id:
                self.assign_role_to_user(user_id, role)
            
            return user_id
            
        except KeycloakError as e:
            logger.error(f"Failed to create user in Keycloak: {e}")
            return None

    def assign_role_to_user(self, user_id: str, role_name: str) -> bool:
        """
        Assign a role to a user in Keycloak
        
        Args:
            user_id: Keycloak user ID
            role_name: Name of the role to assign
            
        Returns:
            True if successful, False otherwise
        """
        if not self.keycloak_admin:
            return False
        
        try:
            # Get role by name
            role = self.keycloak_admin.get_realm_role(role_name)
            
            # Assign role to user
            self.keycloak_admin.assign_realm_roles(user_id, [role])
            return True
            
        except Exception as e:
            logger.error(f"Failed to assign role to user: {e}")
            return False

    def update_user_role(self, user_id: str, old_role: str, new_role: str) -> bool:
        """
        Update user's role in Keycloak
        
        Args:
            user_id: Keycloak user ID
            old_role: Current role to remove
            new_role: New role to assign
            
        Returns:
            True if successful, False otherwise
        """
        if not self.keycloak_admin:
            return False
        
        try:
            # Remove old role
            if old_role:
                old_role_obj = self.keycloak_admin.get_realm_role(old_role)
                self.keycloak_admin.delete_realm_roles_of_user(user_id, [old_role_obj])
            
            # Assign new role
            return self.assign_role_to_user(user_id, new_role)
            
        except Exception as e:
            logger.error(f"Failed to update user role: {e}")
            return False

    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """
        Get user from Keycloak by email
        
        Args:
            email: User email
            
        Returns:
            User object or None
        """
        if not self.keycloak_admin:
            return None
        
        try:
            users = self.keycloak_admin.get_users({"email": email})
            return users[0] if users else None
        except Exception as e:
            logger.error(f"Failed to get user by email: {e}")
            return None

    def delete_user(self, user_id: str) -> bool:
        """
        Delete a user from Keycloak
        
        Args:
            user_id: Keycloak user ID
            
        Returns:
            True if successful, False otherwise
        """
        if not self.keycloak_admin:
            return False
        
        try:
            self.keycloak_admin.delete_user(user_id)
            return True
        except Exception as e:
            logger.error(f"Failed to delete user: {e}")
            return False

    def is_enabled(self) -> bool:
        """Check if Keycloak integration is enabled and configured"""
        return bool(self.client_secret and self.server_url)


# Global instance
keycloak_service = KeycloakService()
