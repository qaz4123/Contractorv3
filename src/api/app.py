"""
Flask API for Property Analyzer application.
Designed to run on Google Cloud Run or App Engine.
"""

import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

from config.config import get_config
from ..models.property import Property, FinancialAssumptions
from ..services.property_analyzer import PropertyAnalyzerService
from ..services.firestore_service import FirestoreService

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Load configuration
env = os.getenv('FLASK_ENV', 'production')
config = get_config(env)
app.config.from_object(config)

# Initialize services
try:
    firestore_service = FirestoreService()
except Exception as e:
    print(f"Warning: Firestore service not initialized: {e}")
    firestore_service = None

analyzer_service = PropertyAnalyzerService()


@app.route('/')
def index():
    """Health check endpoint."""
    return jsonify({
        'status': 'ok',
        'service': 'Property Analyzer API',
        'version': '1.0.0',
        'environment': env
    })


@app.route('/api/properties', methods=['POST'])
def create_property():
    """Create a new property."""
    try:
        data = request.get_json()
        
        property_data = Property(
            address=data['address'],
            city=data['city'],
            state=data['state'],
            zip_code=data['zip_code'],
            purchase_price=float(data['purchase_price']),
            property_type=data['property_type'],
            bedrooms=int(data['bedrooms']),
            bathrooms=float(data['bathrooms']),
            square_feet=int(data['square_feet']),
            year_built=int(data['year_built']),
            lot_size=data.get('lot_size'),
            listing_url=data.get('listing_url'),
            mls_number=data.get('mls_number')
        )
        
        if firestore_service:
            property_id = firestore_service.save_property(property_data)
            property_data.property_id = property_id
        
        return jsonify({
            'success': True,
            'property': property_data.to_dict()
        }), 201
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400


@app.route('/api/properties/<property_id>', methods=['GET'])
def get_property(property_id):
    """Get a property by ID."""
    try:
        if not firestore_service:
            return jsonify({
                'success': False,
                'error': 'Firestore service not configured'
            }), 503
        
        property_data = firestore_service.get_property(property_id)
        
        if property_data:
            return jsonify({
                'success': True,
                'property': property_data.to_dict()
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Property not found'
            }), 404
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/properties', methods=['GET'])
def list_properties():
    """List all properties."""
    try:
        if not firestore_service:
            return jsonify({
                'success': False,
                'error': 'Firestore service not configured'
            }), 503
        
        limit = int(request.args.get('limit', 100))
        properties = firestore_service.list_properties(limit=limit)
        
        return jsonify({
            'success': True,
            'properties': [p.to_dict() for p in properties],
            'count': len(properties)
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/analyze', methods=['POST'])
def analyze_property():
    """Analyze a property investment."""
    try:
        data = request.get_json()
        
        # Parse property data
        property_data = Property(
            address=data['property']['address'],
            city=data['property']['city'],
            state=data['property']['state'],
            zip_code=data['property']['zip_code'],
            purchase_price=float(data['property']['purchase_price']),
            property_type=data['property']['property_type'],
            bedrooms=int(data['property']['bedrooms']),
            bathrooms=float(data['property']['bathrooms']),
            square_feet=int(data['property']['square_feet']),
            year_built=int(data['property']['year_built']),
            property_id=data['property'].get('property_id')
        )
        
        # Parse financial assumptions
        assumptions_data = data.get('assumptions', {})
        assumptions = FinancialAssumptions(
            down_payment_percentage=float(assumptions_data.get('down_payment_percentage', 20.0)),
            interest_rate=float(assumptions_data.get('interest_rate', 7.0)),
            loan_term_years=int(assumptions_data.get('loan_term_years', 30)),
            closing_costs_percentage=float(assumptions_data.get('closing_costs_percentage', 3.0)),
            monthly_rent=float(assumptions_data.get('monthly_rent', 0.0)),
            vacancy_rate=float(assumptions_data.get('vacancy_rate', 5.0)),
            other_monthly_income=float(assumptions_data.get('other_monthly_income', 0.0)),
            property_tax_annual=float(assumptions_data.get('property_tax_annual', 0.0)),
            insurance_annual=float(assumptions_data.get('insurance_annual', 0.0)),
            hoa_monthly=float(assumptions_data.get('hoa_monthly', 0.0)),
            maintenance_percentage=float(assumptions_data.get('maintenance_percentage', 10.0)),
            property_management_percentage=float(assumptions_data.get('property_management_percentage', 10.0)),
            utilities_monthly=float(assumptions_data.get('utilities_monthly', 0.0)),
            appreciation_rate=float(assumptions_data.get('appreciation_rate', 3.0)),
            holding_period_years=int(assumptions_data.get('holding_period_years', 5))
        )
        
        # Perform analysis
        analysis = analyzer_service.calculate_property_analysis(property_data, assumptions)
        
        # Save analysis to Firestore
        if firestore_service and property_data.property_id:
            analysis_id = firestore_service.save_analysis(analysis)
            analysis.analysis_id = analysis_id
        
        # Generate report
        report = analyzer_service.generate_analysis_report(analysis)
        
        return jsonify({
            'success': True,
            'analysis': analysis.to_dict(),
            'report': report
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400


@app.route('/api/properties/<property_id>/analyses', methods=['GET'])
def get_property_analyses(property_id):
    """Get all analyses for a property."""
    try:
        if not firestore_service:
            return jsonify({
                'success': False,
                'error': 'Firestore service not configured'
            }), 503
        
        analyses = firestore_service.get_analyses_for_property(property_id)
        
        return jsonify({
            'success': True,
            'analyses': [a.to_dict() for a in analyses],
            'count': len(analyses)
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors."""
    return jsonify({
        'success': False,
        'error': 'Endpoint not found'
    }), 404


@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors."""
    return jsonify({
        'success': False,
        'error': 'Internal server error'
    }), 500


if __name__ == '__main__':
    port = int(os.getenv('PORT', 8080))
    app.run(host='0.0.0.0', port=port, debug=config.FLASK_DEBUG)
