"""
Property data models for the property analyzer application.
"""

from dataclasses import dataclass, asdict
from typing import Optional, Dict, Any
from datetime import datetime


@dataclass
class Property:
    """Property data model."""
    
    address: str
    city: str
    state: str
    zip_code: str
    purchase_price: float
    property_type: str  # 'single_family', 'multi_family', 'condo', 'townhouse'
    bedrooms: int
    bathrooms: float
    square_feet: int
    year_built: int
    lot_size: Optional[float] = None
    listing_url: Optional[str] = None
    mls_number: Optional[str] = None
    property_id: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert property to dictionary."""
        data = asdict(self)
        if self.created_at:
            data['created_at'] = self.created_at.isoformat()
        if self.updated_at:
            data['updated_at'] = self.updated_at.isoformat()
        return data
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Property':
        """Create property from dictionary."""
        if 'created_at' in data and isinstance(data['created_at'], str):
            try:
                data['created_at'] = datetime.fromisoformat(data['created_at'])
            except (ValueError, TypeError):
                data['created_at'] = None
        if 'updated_at' in data and isinstance(data['updated_at'], str):
            try:
                data['updated_at'] = datetime.fromisoformat(data['updated_at'])
            except (ValueError, TypeError):
                data['updated_at'] = None
        return cls(**data)


@dataclass
class FinancialAssumptions:
    """Financial assumptions for property analysis."""
    
    down_payment_percentage: float = 20.0
    interest_rate: float = 7.0
    loan_term_years: int = 30
    closing_costs_percentage: float = 3.0
    
    # Income assumptions
    monthly_rent: float = 0.0
    vacancy_rate: float = 5.0  # percentage
    other_monthly_income: float = 0.0
    
    # Expense assumptions
    property_tax_annual: float = 0.0
    insurance_annual: float = 0.0
    hoa_monthly: float = 0.0
    maintenance_percentage: float = 10.0  # percentage of rent
    property_management_percentage: float = 10.0  # percentage of rent
    utilities_monthly: float = 0.0
    
    # Appreciation and holding
    appreciation_rate: float = 3.0  # annual percentage
    holding_period_years: int = 5
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return asdict(self)
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'FinancialAssumptions':
        """Create from dictionary."""
        return cls(**data)


@dataclass
class PropertyAnalysis:
    """Property analysis results."""
    
    property_id: str
    analysis_date: datetime
    
    # Purchase details
    purchase_price: float
    down_payment: float
    loan_amount: float
    closing_costs: float
    total_cash_needed: float
    
    # Monthly cash flow
    monthly_rental_income: float
    monthly_expenses: float
    monthly_mortgage_payment: float
    monthly_cash_flow: float
    
    # Annual metrics
    annual_cash_flow: float
    annual_roi: float  # Return on Investment
    cash_on_cash_return: float
    cap_rate: float  # Capitalization rate
    
    # Long-term projections
    total_profit: float
    total_equity: float
    irr: Optional[float] = None  # Internal Rate of Return
    
    analysis_id: Optional[str] = None
    created_at: Optional[datetime] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        data = asdict(self)
        data['analysis_date'] = self.analysis_date.isoformat()
        if self.created_at:
            data['created_at'] = self.created_at.isoformat()
        return data
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'PropertyAnalysis':
        """Create from dictionary."""
        if 'analysis_date' in data and isinstance(data['analysis_date'], str):
            try:
                data['analysis_date'] = datetime.fromisoformat(data['analysis_date'])
            except (ValueError, TypeError):
                data['analysis_date'] = datetime.now()
        if 'created_at' in data and isinstance(data['created_at'], str):
            try:
                data['created_at'] = datetime.fromisoformat(data['created_at'])
            except (ValueError, TypeError):
                data['created_at'] = None
        return cls(**data)
