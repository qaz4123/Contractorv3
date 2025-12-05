"""
Configuration module for Property Analyzer application.
All API keys and credentials should be loaded from environment variables or Google Secret Manager.
"""

import os
from typing import Optional


class Config:
    """Base configuration class."""
    
    # Google Cloud Configuration
    GOOGLE_CLOUD_PROJECT: Optional[str] = os.getenv('GOOGLE_CLOUD_PROJECT', '')
    GCP_REGION: str = os.getenv('GCP_REGION', 'us-central1')
    
    # Firestore Configuration
    FIRESTORE_COLLECTION_PROPERTIES: str = os.getenv('FIRESTORE_COLLECTION_PROPERTIES', 'properties')
    FIRESTORE_COLLECTION_ANALYSES: str = os.getenv('FIRESTORE_COLLECTION_ANALYSES', 'analyses')
    
    # Google Cloud Storage
    GCS_BUCKET_NAME: Optional[str] = os.getenv('GCS_BUCKET_NAME', '')
    
    # API Keys - Should be loaded from Google Secret Manager in production
    ZILLOW_API_KEY: Optional[str] = os.getenv('ZILLOW_API_KEY', '')
    REDFIN_API_KEY: Optional[str] = os.getenv('REDFIN_API_KEY', '')
    REALTOR_API_KEY: Optional[str] = os.getenv('REALTOR_API_KEY', '')
    
    # Database Configuration (if using Cloud SQL)
    DB_HOST: Optional[str] = os.getenv('DB_HOST', '')
    DB_PORT: int = int(os.getenv('DB_PORT', '5432'))
    DB_NAME: Optional[str] = os.getenv('DB_NAME', '')
    DB_USER: Optional[str] = os.getenv('DB_USER', '')
    DB_PASSWORD: Optional[str] = os.getenv('DB_PASSWORD', '')
    
    # Application Settings
    FLASK_ENV: str = os.getenv('FLASK_ENV', 'production')
    FLASK_DEBUG: bool = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    PORT: int = int(os.getenv('PORT', '8080'))
    
    @classmethod
    def validate_config(cls) -> None:
        """Validate that required configuration is set."""
        if not cls.GOOGLE_CLOUD_PROJECT:
            raise ValueError("GOOGLE_CLOUD_PROJECT must be set")


class DevelopmentConfig(Config):
    """Development configuration."""
    FLASK_ENV = 'development'
    FLASK_DEBUG = True


class ProductionConfig(Config):
    """Production configuration."""
    FLASK_ENV = 'production'
    FLASK_DEBUG = False


# Configuration dictionary
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': ProductionConfig
}


def get_config(env: str = 'default') -> Config:
    """Get configuration based on environment."""
    return config.get(env, config['default'])
