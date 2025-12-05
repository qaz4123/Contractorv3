"""
Google Cloud Secret Manager integration for secure credential management.
"""

from typing import Optional

try:
    from google.cloud import secretmanager
except ImportError:
    secretmanager = None

from config.config import Config


class SecretManagerService:
    """Service for retrieving secrets from Google Cloud Secret Manager."""
    
    def __init__(self):
        """Initialize Secret Manager client."""
        if secretmanager is None:
            raise ImportError(
                "google-cloud-secret-manager is not installed. "
                "Install it with: pip install google-cloud-secret-manager"
            )
        
        if not Config.GOOGLE_CLOUD_PROJECT:
            raise ValueError(
                "GOOGLE_CLOUD_PROJECT environment variable must be set"
            )
        
        self.client = secretmanager.SecretManagerServiceClient()
        self.project_id = Config.GOOGLE_CLOUD_PROJECT
    
    def get_secret(self, secret_name: str, version: str = "latest") -> Optional[str]:
        """
        Retrieve a secret from Google Cloud Secret Manager.
        
        Args:
            secret_name: Name of the secret
            version: Version of the secret (default: "latest")
            
        Returns:
            Secret value as string, or None if not found
        """
        try:
            name = f"projects/{self.project_id}/secrets/{secret_name}/versions/{version}"
            response = self.client.access_secret_version(request={"name": name})
            return response.payload.data.decode("UTF-8")
        except Exception as e:
            print(f"Error retrieving secret {secret_name}: {e}")
            return None
    
    def create_secret(self, secret_name: str, secret_value: str) -> bool:
        """
        Create a new secret in Google Cloud Secret Manager.
        
        Args:
            secret_name: Name for the secret
            secret_value: Value to store
            
        Returns:
            True if successful
        """
        try:
            parent = f"projects/{self.project_id}"
            
            # Create the secret
            secret = self.client.create_secret(
                request={
                    "parent": parent,
                    "secret_id": secret_name,
                    "secret": {"replication": {"automatic": {}}},
                }
            )
            
            # Add the secret version with the value
            self.client.add_secret_version(
                request={
                    "parent": secret.name,
                    "payload": {"data": secret_value.encode("UTF-8")},
                }
            )
            
            return True
        except Exception as e:
            print(f"Error creating secret {secret_name}: {e}")
            return False


def load_api_keys_from_secret_manager() -> dict:
    """
    Load API keys from Google Cloud Secret Manager.
    
    Returns:
        Dictionary of API keys
    """
    try:
        service = SecretManagerService()
        
        return {
            'zillow_api_key': service.get_secret('ZILLOW_API_KEY') or '',
            'redfin_api_key': service.get_secret('REDFIN_API_KEY') or '',
            'realtor_api_key': service.get_secret('REALTOR_API_KEY') or '',
        }
    except Exception as e:
        print(f"Warning: Could not load secrets from Secret Manager: {e}")
        return {
            'zillow_api_key': '',
            'redfin_api_key': '',
            'realtor_api_key': '',
        }
