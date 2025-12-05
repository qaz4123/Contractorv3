"""
Tests for property analyzer service.
"""

import pytest
from src.models.property import Property, FinancialAssumptions
from src.services.property_analyzer import PropertyAnalyzerService


def test_calculate_mortgage_payment():
    """Test mortgage payment calculation."""
    service = PropertyAnalyzerService()
    
    # Test with typical values
    payment = service.calculate_mortgage_payment(
        loan_amount=400000,
        annual_rate=7.0,
        years=30
    )
    
    # Should be around $2661 for these parameters
    assert 2600 < payment < 2700
    
    # Test with 0% interest
    payment_zero = service.calculate_mortgage_payment(
        loan_amount=300000,
        annual_rate=0.0,
        years=30
    )
    
    # Should be exactly loan_amount / (years * 12)
    assert payment_zero == 300000 / (30 * 12)


def test_calculate_property_analysis():
    """Test complete property analysis."""
    service = PropertyAnalyzerService()
    
    property_data = Property(
        address="123 Main St",
        city="San Francisco",
        state="CA",
        zip_code="94102",
        purchase_price=500000,
        property_type="single_family",
        bedrooms=3,
        bathrooms=2,
        square_feet=1500,
        year_built=2000
    )
    
    assumptions = FinancialAssumptions(
        down_payment_percentage=20.0,
        interest_rate=7.0,
        loan_term_years=30,
        monthly_rent=3000,
        vacancy_rate=5.0,
        property_tax_annual=5000,
        insurance_annual=1200,
        maintenance_percentage=10.0,
        property_management_percentage=10.0
    )
    
    analysis = service.calculate_property_analysis(property_data, assumptions)
    
    # Verify calculations
    assert analysis.purchase_price == 500000
    assert analysis.down_payment == 100000  # 20% of 500k
    assert analysis.loan_amount == 400000
    assert analysis.closing_costs == 15000  # 3% of 500k
    assert analysis.total_cash_needed == 115000
    
    # Verify monthly calculations
    assert analysis.monthly_rental_income > 0
    assert analysis.monthly_expenses > 0
    assert analysis.monthly_mortgage_payment > 0
    
    # Verify return metrics exist
    assert analysis.cap_rate >= 0
    assert analysis.cash_on_cash_return != 0


def test_generate_analysis_report():
    """Test report generation."""
    service = PropertyAnalyzerService()
    
    property_data = Property(
        address="123 Main St",
        city="San Francisco",
        state="CA",
        zip_code="94102",
        purchase_price=500000,
        property_type="single_family",
        bedrooms=3,
        bathrooms=2,
        square_feet=1500,
        year_built=2000
    )
    
    assumptions = FinancialAssumptions(
        monthly_rent=3000,
        property_tax_annual=5000,
        insurance_annual=1200
    )
    
    analysis = service.calculate_property_analysis(property_data, assumptions)
    report = service.generate_analysis_report(analysis)
    
    # Verify report structure
    assert 'summary' in report
    assert 'returns' in report
    assert 'purchase_breakdown' in report
    assert 'monthly_breakdown' in report
    assert 'long_term' in report
    
    # Verify formatted values
    assert '$' in report['summary']['purchase_price']
    assert '%' in report['returns']['cap_rate']


def test_property_to_dict():
    """Test property serialization."""
    property_data = Property(
        address="123 Main St",
        city="San Francisco",
        state="CA",
        zip_code="94102",
        purchase_price=500000,
        property_type="single_family",
        bedrooms=3,
        bathrooms=2,
        square_feet=1500,
        year_built=2000
    )
    
    data = property_data.to_dict()
    
    assert data['address'] == "123 Main St"
    assert data['purchase_price'] == 500000
    assert data['bedrooms'] == 3


def test_financial_assumptions_defaults():
    """Test default financial assumptions."""
    assumptions = FinancialAssumptions()
    
    assert assumptions.down_payment_percentage == 20.0
    assert assumptions.interest_rate == 7.0
    assert assumptions.loan_term_years == 30
    assert assumptions.vacancy_rate == 5.0
