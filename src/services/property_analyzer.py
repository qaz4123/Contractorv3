"""
Property analysis service with financial calculations.
"""

import math
from typing import Dict, Any
from datetime import datetime

from ..models.property import Property, FinancialAssumptions, PropertyAnalysis


class PropertyAnalyzerService:
    """Service for analyzing property investments."""
    
    @staticmethod
    def calculate_mortgage_payment(loan_amount: float, annual_rate: float, years: int) -> float:
        """
        Calculate monthly mortgage payment.
        
        Args:
            loan_amount: Principal loan amount
            annual_rate: Annual interest rate (as percentage, e.g., 7.0)
            years: Loan term in years
            
        Returns:
            Monthly payment amount
        """
        if annual_rate == 0:
            return loan_amount / (years * 12)
        
        monthly_rate = (annual_rate / 100) / 12
        num_payments = years * 12
        
        payment = loan_amount * (monthly_rate * math.pow(1 + monthly_rate, num_payments)) / \
                 (math.pow(1 + monthly_rate, num_payments) - 1)
        
        return payment
    
    @staticmethod
    def calculate_property_analysis(
        property_data: Property,
        assumptions: FinancialAssumptions
    ) -> PropertyAnalysis:
        """
        Perform comprehensive property analysis.
        
        Args:
            property_data: Property information
            assumptions: Financial assumptions
            
        Returns:
            PropertyAnalysis with all calculated metrics
        """
        purchase_price = property_data.purchase_price
        
        # Purchase calculations
        down_payment = purchase_price * (assumptions.down_payment_percentage / 100)
        loan_amount = purchase_price - down_payment
        closing_costs = purchase_price * (assumptions.closing_costs_percentage / 100)
        total_cash_needed = down_payment + closing_costs
        
        # Monthly mortgage payment
        monthly_mortgage = PropertyAnalyzerService.calculate_mortgage_payment(
            loan_amount,
            assumptions.interest_rate,
            assumptions.loan_term_years
        )
        
        # Monthly income
        gross_monthly_rent = assumptions.monthly_rent
        vacancy_loss = gross_monthly_rent * (assumptions.vacancy_rate / 100)
        monthly_rental_income = gross_monthly_rent - vacancy_loss + assumptions.other_monthly_income
        
        # Monthly expenses
        monthly_property_tax = assumptions.property_tax_annual / 12
        monthly_insurance = assumptions.insurance_annual / 12
        monthly_maintenance = gross_monthly_rent * (assumptions.maintenance_percentage / 100)
        monthly_property_management = gross_monthly_rent * (assumptions.property_management_percentage / 100)
        
        monthly_expenses = (
            monthly_property_tax +
            monthly_insurance +
            assumptions.hoa_monthly +
            monthly_maintenance +
            monthly_property_management +
            assumptions.utilities_monthly
        )
        
        # Monthly cash flow
        monthly_cash_flow = monthly_rental_income - monthly_expenses - monthly_mortgage
        
        # Annual metrics
        annual_cash_flow = monthly_cash_flow * 12
        annual_noi = (monthly_rental_income - monthly_expenses) * 12  # Net Operating Income
        
        # Return metrics
        cash_on_cash_return = (annual_cash_flow / total_cash_needed * 100) if total_cash_needed > 0 else 0
        cap_rate = (annual_noi / purchase_price * 100) if purchase_price > 0 else 0
        annual_roi = (annual_cash_flow / total_cash_needed * 100) if total_cash_needed > 0 else 0
        
        # Long-term projections
        holding_years = assumptions.holding_period_years
        appreciation_rate = assumptions.appreciation_rate / 100
        
        # Future property value
        future_value = purchase_price * math.pow(1 + appreciation_rate, holding_years)
        
        # Equity calculation (simplified - assumes amortization)
        total_payments = monthly_mortgage * 12 * holding_years
        total_interest_paid = total_payments - loan_amount  # Simplified
        principal_paid = loan_amount - (loan_amount * math.pow(1 - (monthly_mortgage * 12 / loan_amount), holding_years))
        
        total_equity = down_payment + principal_paid + (future_value - purchase_price)
        total_profit = (annual_cash_flow * holding_years) + total_equity - total_cash_needed
        
        # Create analysis object
        analysis = PropertyAnalysis(
            property_id=property_data.property_id or '',
            analysis_date=datetime.now(),
            purchase_price=purchase_price,
            down_payment=down_payment,
            loan_amount=loan_amount,
            closing_costs=closing_costs,
            total_cash_needed=total_cash_needed,
            monthly_rental_income=monthly_rental_income,
            monthly_expenses=monthly_expenses,
            monthly_mortgage_payment=monthly_mortgage,
            monthly_cash_flow=monthly_cash_flow,
            annual_cash_flow=annual_cash_flow,
            annual_roi=annual_roi,
            cash_on_cash_return=cash_on_cash_return,
            cap_rate=cap_rate,
            total_profit=total_profit,
            total_equity=total_equity
        )
        
        return analysis
    
    @staticmethod
    def generate_analysis_report(analysis: PropertyAnalysis) -> Dict[str, Any]:
        """
        Generate a formatted analysis report.
        
        Args:
            analysis: PropertyAnalysis object
            
        Returns:
            Dictionary with formatted report data
        """
        return {
            'summary': {
                'purchase_price': f'${analysis.purchase_price:,.2f}',
                'total_cash_needed': f'${analysis.total_cash_needed:,.2f}',
                'monthly_cash_flow': f'${analysis.monthly_cash_flow:,.2f}',
                'annual_cash_flow': f'${analysis.annual_cash_flow:,.2f}',
            },
            'returns': {
                'cash_on_cash_return': f'{analysis.cash_on_cash_return:.2f}%',
                'cap_rate': f'{analysis.cap_rate:.2f}%',
                'annual_roi': f'{analysis.annual_roi:.2f}%',
            },
            'purchase_breakdown': {
                'purchase_price': f'${analysis.purchase_price:,.2f}',
                'down_payment': f'${analysis.down_payment:,.2f}',
                'loan_amount': f'${analysis.loan_amount:,.2f}',
                'closing_costs': f'${analysis.closing_costs:,.2f}',
            },
            'monthly_breakdown': {
                'rental_income': f'${analysis.monthly_rental_income:,.2f}',
                'expenses': f'${analysis.monthly_expenses:,.2f}',
                'mortgage_payment': f'${analysis.monthly_mortgage_payment:,.2f}',
                'net_cash_flow': f'${analysis.monthly_cash_flow:,.2f}',
            },
            'long_term': {
                'total_profit': f'${analysis.total_profit:,.2f}',
                'total_equity': f'${analysis.total_equity:,.2f}',
            }
        }
