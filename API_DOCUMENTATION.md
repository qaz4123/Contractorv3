# ContractorCRM - API Documentation

## Base URL

- **Development**: `http://localhost:8080/api`
- **Production**: `https://your-backend-url.run.app/api`

## Authentication

All authenticated endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

---

## Authentication Endpoints

### Register New User

**POST** `/auth/register`

Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "Password123!",
  "name": "John Doe",
  "company": "ABC Construction" // optional
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "CONTRACTOR"
  },
  "tokens": {
    "accessToken": "jwt-token",
    "refreshToken": "refresh-token",
    "expiresIn": 86400
  }
}
```

**Error Responses:**
- `400 Bad Request` - Validation error or duplicate email
- `429 Too Many Requests` - Rate limit exceeded (10 per hour)

---

### Login

**POST** `/auth/login`

Authenticate an existing user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "CONTRACTOR"
  },
  "tokens": {
    "accessToken": "jwt-token",
    "refreshToken": "refresh-token",
    "expiresIn": 86400
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid credentials
- `429 Too Many Requests` - Rate limit exceeded (10 per 15 minutes)

---

### Get Current User

**GET** `/auth/me`

Get the currently authenticated user's profile.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "CONTRACTOR",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "lastLoginAt": "2024-01-01T12:00:00.000Z"
  }
}
```

---

### Refresh Access Token

**POST** `/auth/refresh`

Get a new access token using a refresh token.

**Request Body:**
```json
{
  "refreshToken": "your-refresh-token"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "CONTRACTOR"
  },
  "tokens": {
    "accessToken": "new-jwt-token",
    "refreshToken": "new-refresh-token",
    "expiresIn": 86400
  }
}
```

---

### Logout

**POST** `/auth/logout`

Invalidate a refresh token.

**Request Body:**
```json
{
  "refreshToken": "your-refresh-token"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## Lead Management Endpoints

### List Leads

**GET** `/leads`

Get a paginated list of leads.

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `pageSize` (number, default: 20, max: 100) - Items per page
- `status` (string, optional) - Filter by status: NEW, CONTACTED, QUALIFIED, PROPOSAL_SENT, NEGOTIATION, WON, LOST
- `search` (string, optional) - Search by name or address
- `orderBy` (string, optional) - Sort field: createdAt, leadScore, name
- `order` (string, optional) - Sort direction: asc, desc

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "John Smith",
      "email": "john@example.com",
      "phone": "(555) 123-4567",
      "fullAddress": "123 Main St, Los Angeles, CA 90001",
      "status": "NEW",
      "leadScore": 85,
      "renovationPotential": 90,
      "ownerMotivation": 80,
      "profitPotential": 85,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "totalPages": 5,
    "hasMore": true
  }
}
```

---

### Get Lead Details

**GET** `/leads/:id`

Get detailed information about a specific lead.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "John Smith",
    "email": "john@example.com",
    "phone": "(555) 123-4567",
    "street": "123 Main St",
    "city": "Los Angeles",
    "state": "CA",
    "zipCode": "90001",
    "fullAddress": "123 Main St, Los Angeles, CA 90001",
    "status": "NEW",
    "source": "Website",
    "leadScore": 85,
    "renovationPotential": 90,
    "ownerMotivation": 80,
    "profitPotential": 85,
    "notes": "Interested in kitchen remodel",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### Create Lead

**POST** `/leads`

Create a new lead.

**Request Body:**
```json
{
  "name": "John Smith",
  "email": "john@example.com",
  "phone": "(555) 123-4567",
  "street": "123 Main St",
  "city": "Los Angeles",
  "state": "CA",
  "zipCode": "90001",
  "source": "Website",
  "notes": "Interested in kitchen remodel"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "John Smith",
    // ... full lead object
  }
}
```

---

### Update Lead

**PATCH** `/leads/:id`

Update an existing lead.

**Request Body:**
```json
{
  "status": "CONTACTED",
  "notes": "Called client, scheduled site visit"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    // ... updated lead object
  }
}
```

---

### Refresh Lead Intelligence

**POST** `/leads/:id/refresh-intelligence`

Trigger AI analysis to refresh lead intelligence scores.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "leadScore": 88,
    "renovationPotential": 92,
    "ownerMotivation": 85,
    "profitPotential": 87,
    "aiSummary": "High-value opportunity...",
    "analyzedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

---

### Convert Lead to Project

**POST** `/leads/:id/convert-to-project`

Convert a lead into a project.

**Request Body:**
```json
{
  "name": "Smith Kitchen Remodel",
  "description": "Complete kitchen renovation",
  "estimatedBudget": 65000,
  "estimatedDays": 45,
  "startDate": "2024-02-01T00:00:00.000Z"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Smith Kitchen Remodel",
    "leadId": "lead-uuid",
    // ... full project object
  }
}
```

---

## Project Management Endpoints

### List Projects

**GET** `/projects`

Get a paginated list of projects.

**Query Parameters:**
- `page` (number, default: 1)
- `pageSize` (number, default: 20)
- `status` (string, optional) - PLANNING, APPROVED, IN_PROGRESS, ON_HOLD, COMPLETED, CANCELLED

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Smith Kitchen Remodel",
      "status": "IN_PROGRESS",
      "estimatedBudget": 65000,
      "actualCost": 45000,
      "startDate": "2024-02-01",
      "createdAt": "2024-01-15T00:00:00.000Z"
    }
  ],
  "pagination": { /* ... */ }
}
```

---

### Create Project

**POST** `/projects`

Create a new project.

**Request Body:**
```json
{
  "name": "Johnson Bathroom Remodel",
  "description": "Complete bathroom renovation",
  "street": "456 Oak Ave",
  "city": "San Diego",
  "state": "CA",
  "zipCode": "92101",
  "estimatedBudget": 45000,
  "estimatedDays": 30,
  "startDate": "2024-02-15T00:00:00.000Z",
  "leadId": "lead-uuid" // optional
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Johnson Bathroom Remodel",
    // ... full project object
  }
}
```

---

## Subcontractor Marketplace Endpoints

### Search Subcontractors

**GET** `/subcontractors`

Search for subcontractors based on location and criteria.

**Query Parameters:**
- `page` (number, default: 1)
- `pageSize` (number, default: 20)
- `latitude` (number, optional) - User's latitude for distance calculation
- `longitude` (number, optional) - User's longitude
- `maxDistance` (number, optional) - Maximum distance in miles
- `trades` (string, optional) - Comma-separated list of trades
- `minRating` (number, optional) - Minimum rating (0-5)
- `available` (boolean, optional) - Filter by availability
- `verified` (boolean, optional) - Filter verified subcontractors
- `sortBy` (string, optional) - distance, rating, price, responseTime

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Mike Wilson",
      "company": "Wilson Plumbing Services",
      "trades": ["Plumbing"],
      "city": "Los Angeles",
      "state": "CA",
      "rating": 4.8,
      "reviewCount": 127,
      "completedJobs": 234,
      "hourlyRate": 85,
      "available": true,
      "verified": true,
      "insurance": true,
      "distance": 12.5 // if lat/long provided
    }
  ],
  "pagination": { /* ... */ }
}
```

---

### Hire Subcontractor

**POST** `/subcontractors/hire`

Directly hire a subcontractor for a project.

**Request Body:**
```json
{
  "subcontractorId": "uuid",
  "projectId": "uuid",
  "description": "Plumbing work for bathroom remodel",
  "agreedRate": 85,
  "rateType": "hourly",
  "startDate": "2024-02-15T00:00:00.000Z",
  "endDate": "2024-02-20T00:00:00.000Z"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "subcontractorId": "uuid",
    "projectId": "uuid",
    "status": "PENDING",
    "agreedRate": 85,
    "rateType": "hourly",
    // ... full hire object
  }
}
```

---

## Task Management Endpoints

### List Tasks

**GET** `/tasks`

Get a paginated list of tasks.

**Query Parameters:**
- `page` (number, default: 1)
- `pageSize` (number, default: 20)
- `status` (string, optional) - PENDING, IN_PROGRESS, COMPLETED, CANCELLED
- `priority` (string, optional) - LOW, MEDIUM, HIGH, URGENT
- `leadId` (string, optional) - Filter by lead
- `projectId` (string, optional) - Filter by project

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Follow up with client",
      "description": "Discuss timeline and budget",
      "priority": "HIGH",
      "status": "PENDING",
      "dueDate": "2024-01-15T00:00:00.000Z",
      "createdAt": "2024-01-10T00:00:00.000Z"
    }
  ],
  "pagination": { /* ... */ }
}
```

---

### Create Task

**POST** `/tasks`

Create a new task.

**Request Body:**
```json
{
  "title": "Schedule site visit",
  "description": "Visit property to assess scope",
  "priority": "HIGH",
  "dueDate": "2024-01-20T00:00:00.000Z",
  "leadId": "uuid", // optional
  "projectId": "uuid" // optional
}
```

---

### Complete Task

**PATCH** `/tasks/:id/complete`

Mark a task as completed.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "COMPLETED",
    "completedAt": "2024-01-15T12:30:00.000Z"
  }
}
```

---

## Quote Management Endpoints

### List Quotes

**GET** `/quotes`

Get a paginated list of quotes.

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Kitchen Remodel Quote",
      "status": "SENT",
      "subtotal": 50000,
      "tax": 4250,
      "total": 54250,
      "createdAt": "2024-01-10T00:00:00.000Z"
    }
  ]
}
```

---

### Create Quote

**POST** `/quotes`

Create a new quote.

**Request Body:**
```json
{
  "title": "Kitchen Remodel Quote",
  "leadId": "uuid",
  "projectId": "uuid", // optional
  "lineItems": [
    {
      "description": "Custom Cabinets",
      "quantity": 1,
      "unitPrice": 15000,
      "total": 15000
    },
    {
      "description": "Granite Countertops",
      "quantity": 1,
      "unitPrice": 8000,
      "total": 8000
    }
  ],
  "subtotal": 23000,
  "tax": 1955,
  "total": 24955,
  "validUntil": "2024-02-10T00:00:00.000Z"
}
```

---

## Invoice Management Endpoints

### List Invoices

**GET** `/invoices`

Get a paginated list of invoices.

**Query Parameters:**
- `status` (string, optional) - DRAFT, SENT, VIEWED, PAID, PARTIAL, OVERDUE, CANCELLED

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "invoiceNumber": "INV-2024-001",
      "clientName": "John Smith",
      "total": 24955,
      "amountPaid": 10000,
      "status": "PARTIAL",
      "dueDate": "2024-02-15T00:00:00.000Z"
    }
  ]
}
```

---

### Create Invoice

**POST** `/invoices`

Create a new invoice.

**Request Body:**
```json
{
  "projectId": "uuid",
  "clientName": "John Smith",
  "clientEmail": "john@example.com",
  "lineItems": [ /* ... */ ],
  "subtotal": 23000,
  "tax": 1955,
  "total": 24955,
  "dueDate": "2024-02-15T00:00:00.000Z"
}
```

---

### Record Payment

**POST** `/invoices/:id/payments`

Record a payment for an invoice.

**Request Body:**
```json
{
  "amount": 10000,
  "method": "CREDIT_CARD",
  "reference": "TXN-12345",
  "notes": "Deposit payment"
}
```

---

## Analytics Endpoints

### Get Dashboard Stats

**GET** `/analytics/dashboard`

Get overview statistics for the dashboard.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "totalLeads": 45,
    "activeProjects": 12,
    "completedProjects": 34,
    "totalRevenue": 1250000,
    "outstandingInvoices": 75000,
    "conversionRate": 0.68,
    "avgProjectValue": 85000
  }
}
```

---

## Error Response Format

All error responses follow this format:

```json
{
  "success": false,
  "error": "Human-readable error message",
  "details": { /* optional additional details */ }
}
```

### Common HTTP Status Codes

- `200 OK` - Request succeeded
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required or invalid token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

---

## Rate Limiting

Authentication endpoints are rate-limited:

- **Register**: 10 requests per hour per IP
- **Login**: 10 requests per 15 minutes per IP
- **Password operations**: 5 requests per hour per user

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1640995200
```

---

## Pagination

List endpoints support pagination with these query parameters:

- `page` (number, default: 1) - Page number (1-indexed)
- `pageSize` (number, default: 20, max: 100) - Items per page

Paginated responses include:
```json
{
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "totalPages": 5,
    "hasMore": true
  }
}
```

---

## Request ID Tracking

All requests include a correlation ID for debugging:

**Request Header:**
```
X-Correlation-ID: client-1640995200-abc123
```

**Response Header:**
```
X-Correlation-ID: client-1640995200-abc123
```

Use this ID when reporting issues or debugging problems.

---

## Best Practices

1. **Always include correlation IDs** in requests for easier debugging
2. **Handle rate limiting** gracefully with exponential backoff
3. **Validate data** on the client side before sending to API
4. **Store refresh tokens** securely (not in localStorage)
5. **Implement token refresh** logic to handle expired access tokens
6. **Use HTTPS** in production (enforced by Cloud Run)
7. **Handle errors** appropriately and show user-friendly messages

---

## Examples

### Complete Authentication Flow

```javascript
// 1. Register
const response = await fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'Password123!',
    name: 'John Doe'
  })
});

const { tokens, user } = await response.json();

// 2. Store tokens
localStorage.setItem('accessToken', tokens.accessToken);
localStorage.setItem('refreshToken', tokens.refreshToken);

// 3. Make authenticated request
const leadsResponse = await fetch('/api/leads', {
  headers: {
    'Authorization': `Bearer ${tokens.accessToken}`
  }
});

// 4. Handle token expiration
if (leadsResponse.status === 401) {
  // Refresh token
  const refreshResponse = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      refreshToken: localStorage.getItem('refreshToken')
    })
  });
  
  const { tokens: newTokens } = await refreshResponse.json();
  localStorage.setItem('accessToken', newTokens.accessToken);
  localStorage.setItem('refreshToken', newTokens.refreshToken);
  
  // Retry original request
  const retryResponse = await fetch('/api/leads', {
    headers: {
      'Authorization': `Bearer ${newTokens.accessToken}`
    }
  });
}
```

---

## Support

For API issues or questions:
- Check the troubleshooting guide: `TROUBLESHOOTING.md`
- Review Cloud Logging for request traces
- Include correlation IDs in support requests
