# Property Analyzer API Documentation

## Base URL

- **Local**: `http://localhost:8080`
- **Cloud Run**: `https://property-analyzer-[hash]-[region].run.app`
- **App Engine**: `https://[project-id].[region].r.appspot.com`

## Authentication

Currently, the API is open. For production, implement authentication using:
- Firebase Auth
- Cloud Identity Platform
- API Keys
- OAuth 2.0

## Endpoints

### Health Check

**GET /**

Returns the API status and version.

**Response:**
```json
{
  "status": "ok",
  "service": "Property Analyzer API",
  "version": "1.0.0",
  "environment": "production"
}
```

---

### Create Property

**POST /api/properties**

Create a new property record.

**Request Body:**
```json
{
  "address": "123 Main St",
  "city": "San Francisco",
  "state": "CA",
  "zip_code": "94102",
  "purchase_price": 500000,
  "property_type": "single_family",
  "bedrooms": 3,
  "bathrooms": 2,
  "square_feet": 1500,
  "year_built": 2000,
  "lot_size": 5000,
  "listing_url": "https://example.com/listing",
  "mls_number": "ML12345"
}
```

**Response:**
```json
{
  "success": true,
  "property": {
    "property_id": "abc123",
    "address": "123 Main St",
    "city": "San Francisco",
    "state": "CA",
    "zip_code": "94102",
    "purchase_price": 500000,
    "property_type": "single_family",
    "bedrooms": 3,
    "bathrooms": 2,
    "square_feet": 1500,
    "year_built": 2000,
    "created_at": "2025-12-05T20:00:00Z"
  }
}
```

**Property Types:**
- `single_family`
- `multi_family`
- `condo`
- `townhouse`

---

### Get Property

**GET /api/properties/{property_id}**

Retrieve a specific property by ID.

**Response:**
```json
{
  "success": true,
  "property": {
    "property_id": "abc123",
    "address": "123 Main St",
    "city": "San Francisco",
    "state": "CA",
    "zip_code": "94102",
    "purchase_price": 500000,
    "property_type": "single_family",
    "bedrooms": 3,
    "bathrooms": 2,
    "square_feet": 1500,
    "year_built": 2000
  }
}
```

---

### List Properties

**GET /api/properties**

List all properties.

**Query Parameters:**
- `limit` (optional): Maximum number of properties to return (default: 100)

**Response:**
```json
{
  "success": true,
  "properties": [
    {
      "property_id": "abc123",
      "address": "123 Main St",
      "city": "San Francisco",
      "state": "CA",
      "purchase_price": 500000
    }
  ],
  "count": 1
}
```

---

### Analyze Property

**POST /api/analyze**

Perform investment analysis on a property.

**Request Body:**
```json
{
  "property": {
    "address": "123 Main St",
    "city": "San Francisco",
    "state": "CA",
    "zip_code": "94102",
    "purchase_price": 500000,
    "property_type": "single_family",
    "bedrooms": 3,
    "bathrooms": 2,
    "square_feet": 1500,
    "year_built": 2000,
    "property_id": "abc123"
  },
  "assumptions": {
    "down_payment_percentage": 20,
    "interest_rate": 7.0,
    "loan_term_years": 30,
    "closing_costs_percentage": 3.0,
    "monthly_rent": 3000,
    "vacancy_rate": 5.0,
    "other_monthly_income": 0,
    "property_tax_annual": 5000,
    "insurance_annual": 1200,
    "hoa_monthly": 0,
    "maintenance_percentage": 10,
    "property_management_percentage": 10,
    "utilities_monthly": 0,
    "appreciation_rate": 3.0,
    "holding_period_years": 5
  }
}
```

**Response:**
```json
{
  "success": true,
  "analysis": {
    "property_id": "abc123",
    "analysis_id": "xyz789",
    "analysis_date": "2025-12-05T20:00:00Z",
    "purchase_price": 500000,
    "down_payment": 100000,
    "loan_amount": 400000,
    "closing_costs": 15000,
    "total_cash_needed": 115000,
    "monthly_rental_income": 2850,
    "monthly_expenses": 716.67,
    "monthly_mortgage_payment": 2661.21,
    "monthly_cash_flow": -527.88,
    "annual_cash_flow": -6334.56,
    "annual_roi": -5.51,
    "cash_on_cash_return": -5.51,
    "cap_rate": 5.12,
    "total_profit": 150000,
    "total_equity": 200000
  },
  "report": {
    "summary": {
      "purchase_price": "$500,000.00",
      "total_cash_needed": "$115,000.00",
      "monthly_cash_flow": "$-527.88",
      "annual_cash_flow": "$-6,334.56"
    },
    "returns": {
      "cash_on_cash_return": "-5.51%",
      "cap_rate": "5.12%",
      "annual_roi": "-5.51%"
    },
    "purchase_breakdown": {
      "purchase_price": "$500,000.00",
      "down_payment": "$100,000.00",
      "loan_amount": "$400,000.00",
      "closing_costs": "$15,000.00"
    },
    "monthly_breakdown": {
      "rental_income": "$2,850.00",
      "expenses": "$716.67",
      "mortgage_payment": "$2,661.21",
      "net_cash_flow": "$-527.88"
    },
    "long_term": {
      "total_profit": "$150,000.00",
      "total_equity": "$200,000.00"
    }
  }
}
```

---

### Get Property Analyses

**GET /api/properties/{property_id}/analyses**

Get all analyses for a specific property.

**Response:**
```json
{
  "success": true,
  "analyses": [
    {
      "analysis_id": "xyz789",
      "property_id": "abc123",
      "analysis_date": "2025-12-05T20:00:00Z",
      "monthly_cash_flow": -527.88,
      "annual_roi": -5.51,
      "cap_rate": 5.12
    }
  ],
  "count": 1
}
```

---

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "error": "Error message description"
}
```

**HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error
- `503` - Service Unavailable

---

## Rate Limiting

For production deployments, implement rate limiting using:
- Cloud Endpoints
- API Gateway
- Cloud Armor

Recommended limits:
- 100 requests per minute per IP
- 10,000 requests per day per API key

---

## Examples

### cURL Examples

**Health Check:**
```bash
curl https://your-api-url.run.app/
```

**Create Property:**
```bash
curl -X POST https://your-api-url.run.app/api/properties \
  -H "Content-Type: application/json" \
  -d '{
    "address": "123 Main St",
    "city": "San Francisco",
    "state": "CA",
    "zip_code": "94102",
    "purchase_price": 500000,
    "property_type": "single_family",
    "bedrooms": 3,
    "bathrooms": 2,
    "square_feet": 1500,
    "year_built": 2000
  }'
```

**Analyze Property:**
```bash
curl -X POST https://your-api-url.run.app/api/analyze \
  -H "Content-Type: application/json" \
  -d @analysis-request.json
```

### Python Example

```python
import requests

# Analyze a property
response = requests.post(
    'https://your-api-url.run.app/api/analyze',
    json={
        'property': {
            'address': '123 Main St',
            'city': 'San Francisco',
            'state': 'CA',
            'zip_code': '94102',
            'purchase_price': 500000,
            'property_type': 'single_family',
            'bedrooms': 3,
            'bathrooms': 2,
            'square_feet': 1500,
            'year_built': 2000
        },
        'assumptions': {
            'monthly_rent': 3000,
            'property_tax_annual': 5000,
            'insurance_annual': 1200
        }
    }
)

data = response.json()
if data['success']:
    print(f"Monthly cash flow: {data['report']['summary']['monthly_cash_flow']}")
    print(f"Cap rate: {data['report']['returns']['cap_rate']}")
```

### JavaScript Example

```javascript
// Analyze a property
fetch('https://your-api-url.run.app/api/analyze', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    property: {
      address: '123 Main St',
      city: 'San Francisco',
      state: 'CA',
      zip_code: '94102',
      purchase_price: 500000,
      property_type: 'single_family',
      bedrooms: 3,
      bathrooms: 2,
      square_feet: 1500,
      year_built: 2000
    },
    assumptions: {
      monthly_rent: 3000,
      property_tax_annual: 5000,
      insurance_annual: 1200
    }
  })
})
.then(response => response.json())
.then(data => {
  if (data.success) {
    console.log('Monthly cash flow:', data.report.summary.monthly_cash_flow);
    console.log('Cap rate:', data.report.returns.cap_rate);
  }
});
```

---

## Support

For issues or questions, please refer to the main README or open an issue in the repository.
