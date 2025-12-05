"""
Main entry point for the Property Analyzer application.
Can be used for local development or as the entry point for Cloud Functions.
"""

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from src.api.app import app

# For Cloud Functions
def main(request):
    """
    Cloud Functions entry point.
    
    Args:
        request: The request object
        
    Returns:
        The response from the Flask app
    """
    with app.request_context(request.environ):
        return app.full_dispatch_request()


if __name__ == '__main__':
    # Run the Flask development server
    port = int(os.getenv('PORT', 8080))
    app.run(host='0.0.0.0', port=port, debug=True)
