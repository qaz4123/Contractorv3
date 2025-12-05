"""
Google Cloud Firestore service for property data storage.
"""

from typing import List, Optional, Dict, Any
from datetime import datetime

try:
    from google.cloud import firestore
except ImportError:
    firestore = None

from config.config import Config
from ..models.property import Property, PropertyAnalysis


class FirestoreService:
    """Service for interacting with Google Cloud Firestore."""
    
    def __init__(self):
        """Initialize Firestore client."""
        if firestore is None:
            raise ImportError(
                "google-cloud-firestore is not installed. "
                "Install it with: pip install google-cloud-firestore"
            )
        
        if not Config.GOOGLE_CLOUD_PROJECT:
            raise ValueError(
                "GOOGLE_CLOUD_PROJECT environment variable must be set. "
                "Please configure your Google Cloud project."
            )
        
        self.db = firestore.Client(project=Config.GOOGLE_CLOUD_PROJECT)
        self.properties_collection = Config.FIRESTORE_COLLECTION_PROPERTIES
        self.analyses_collection = Config.FIRESTORE_COLLECTION_ANALYSES
    
    def save_property(self, property_data: Property) -> str:
        """
        Save property to Firestore.
        
        Args:
            property_data: Property object to save
            
        Returns:
            Document ID of the saved property
        """
        property_dict = property_data.to_dict()
        property_dict['created_at'] = datetime.now()
        property_dict['updated_at'] = datetime.now()
        
        if property_data.property_id:
            # Update existing property
            doc_ref = self.db.collection(self.properties_collection).document(property_data.property_id)
            doc_ref.set(property_dict, merge=True)
            return property_data.property_id
        else:
            # Create new property
            doc_ref = self.db.collection(self.properties_collection).document()
            property_dict['property_id'] = doc_ref.id
            doc_ref.set(property_dict)
            return doc_ref.id
    
    def get_property(self, property_id: str) -> Optional[Property]:
        """
        Get property by ID from Firestore.
        
        Args:
            property_id: ID of the property
            
        Returns:
            Property object or None if not found
        """
        doc_ref = self.db.collection(self.properties_collection).document(property_id)
        doc = doc_ref.get()
        
        if doc.exists:
            return Property.from_dict(doc.to_dict())
        return None
    
    def list_properties(self, limit: int = 100) -> List[Property]:
        """
        List all properties from Firestore.
        
        Args:
            limit: Maximum number of properties to return
            
        Returns:
            List of Property objects
        """
        properties = []
        docs = self.db.collection(self.properties_collection).limit(limit).stream()
        
        for doc in docs:
            properties.append(Property.from_dict(doc.to_dict()))
        
        return properties
    
    def delete_property(self, property_id: str) -> bool:
        """
        Delete property from Firestore.
        
        Args:
            property_id: ID of the property to delete
            
        Returns:
            True if successful
        """
        self.db.collection(self.properties_collection).document(property_id).delete()
        return True
    
    def save_analysis(self, analysis: PropertyAnalysis) -> str:
        """
        Save property analysis to Firestore.
        
        Args:
            analysis: PropertyAnalysis object to save
            
        Returns:
            Document ID of the saved analysis
        """
        analysis_dict = analysis.to_dict()
        analysis_dict['created_at'] = datetime.now()
        
        if analysis.analysis_id:
            # Update existing analysis
            doc_ref = self.db.collection(self.analyses_collection).document(analysis.analysis_id)
            doc_ref.set(analysis_dict, merge=True)
            return analysis.analysis_id
        else:
            # Create new analysis
            doc_ref = self.db.collection(self.analyses_collection).document()
            analysis_dict['analysis_id'] = doc_ref.id
            doc_ref.set(analysis_dict)
            return doc_ref.id
    
    def get_analyses_for_property(self, property_id: str) -> List[PropertyAnalysis]:
        """
        Get all analyses for a property.
        
        Args:
            property_id: ID of the property
            
        Returns:
            List of PropertyAnalysis objects
        """
        analyses = []
        docs = (self.db.collection(self.analyses_collection)
                .where('property_id', '==', property_id)
                .order_by('analysis_date', direction=firestore.Query.DESCENDING)
                .stream())
        
        for doc in docs:
            analyses.append(PropertyAnalysis.from_dict(doc.to_dict()))
        
        return analyses
    
    def get_analysis(self, analysis_id: str) -> Optional[PropertyAnalysis]:
        """
        Get analysis by ID.
        
        Args:
            analysis_id: ID of the analysis
            
        Returns:
            PropertyAnalysis object or None if not found
        """
        doc_ref = self.db.collection(self.analyses_collection).document(analysis_id)
        doc = doc_ref.get()
        
        if doc.exists:
            return PropertyAnalysis.from_dict(doc.to_dict())
        return None
