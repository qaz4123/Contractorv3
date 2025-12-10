# Comprehensive Backend-Frontend Audit Report

## Executive Summary

After a thorough line-by-line analysis of the Contractorv3 codebase, I've identified several issues that could cause backend-frontend communication problems, API mismatches, and deployment issues. This document provides a complete breakdown of all findings with specific file paths and line numbers.

---

## 1. FULL BACKEND ARCHITECTURE ANALYSIS

### 1.1 Folder Structure ✅
The backend follows a clean modular architecture:
- `/server/src/routes/` - API route definitions
- `/server/src/services/` - Business logic services
- `/server/src/middleware/` - Express middleware
- `/server/src/config/` - Configuration management
- `/server/src/lib/` - Shared utilities (Prisma client)
- `/server/src/utils/` - Helper functions

### 1.2 Route Definitions
All routes are properly mounted under `/api` prefix in `server/src/routes/index.ts`.

### 1.3 Issues Identified

---

## 2. CRITICAL ISSUES - Backend-Frontend Mismatches

### Issue #1: Frontend Leads Service Uses PATCH Instead of PUT
**File:** `client/src/services/index.ts` (Line 25)
**Severity:** CRITICAL

```typescript
// CURRENT (incorrect)
update: async (id: string, data: any) => {
    const response = await api.patch(`/leads/${id}`, data);
    return response.data;
},
```

```typescript
// BACKEND expects PUT (server/src/routes/leads.ts line 395)
router.put('/:id', validateBody(updateLeadSchema), asyncHandler(...))
```

**FIX:** Change `api.patch` to `api.put` in `client/src/services/index.ts`.

---

### Issue #2: Frontend Tasks Service Uses PATCH Instead of PUT
**File:** `client/src/services/index.ts` (Line 61)
**Severity:** CRITICAL

```typescript
// CURRENT (incorrect)
update: async (id: string, data: any) => {
    const response = await api.patch(`/tasks/${id}`, data);
    return response.data;
},
```

```typescript
// BACKEND expects PUT (server/src/routes/tasks.ts line 304)
router.put('/:id', validateBody(updateTaskSchema), asyncHandler(...))
```

**FIX:** Change `api.patch` to `api.put`.

---

### Issue #3: Frontend Leads Service Calls Non-Existent Analyze Endpoint
**File:** `client/src/services/index.ts` (Line 35)
**Severity:** HIGH

```typescript
analyze: async (id: string) => {
    const response = await api.post(`/leads/${id}/analyze`);
    return response.data;
},
```

**Problem:** Backend has `/api/leads/:id/refresh-intelligence`, NOT `/api/leads/:id/analyze`.

**FIX:** Change endpoint to `/leads/${id}/refresh-intelligence`.

---

### Issue #4: Dashboard Leads Query Uses Wrong Parameter Name
**File:** `client/src/pages/Dashboard.tsx` (Line 20-21)
**Severity:** MEDIUM

```typescript
// CURRENT (incorrect)
queryFn: () => leadsService.getAll({ limit: 5 }),
```

```typescript
// BACKEND expects 'pageSize', not 'limit' (server/src/routes/leads.ts line 68)
const leadsQuerySchema = paginationSchema.extend({...
// paginationSchema uses 'pageSize'
```

**FIX:** Change `limit` to `pageSize` in Dashboard and Leads page.

---

### Issue #5: Tasks Service getUpcoming Uses Non-Existent Endpoint
**File:** `client/src/services/index.ts` (Line 82-85)
**Severity:** MEDIUM

```typescript
getUpcoming: async (days: number = 7) => {
    const response = await api.get('/tasks/upcoming', { params: { days } });
    return response.data;
},
```

**Problem:** Backend doesn't have `/api/tasks/upcoming`. Available endpoints: `/today`, `/overdue`, `/stats`.

**FIX:** Remove or implement the backend endpoint.

---

### Issue #6: Analytics Service getDashboardStats Returns Wrong Structure
**File:** `client/src/pages/Dashboard.tsx` (Line 45-66)
**Severity:** MEDIUM

Frontend expects:
```typescript
stats?.totalLeads
stats?.leadGrowth
stats?.activeProjects
stats?.pendingQuotes
stats?.monthlyRevenue
stats?.revenueGrowth
```

Backend returns (server/src/routes/analytics.ts line 79-102):
```typescript
{
  success: true,
  data: {
    leads: { byStatus: {...}, total: number },
    projects: { byStatus: {...}, total: number },
    tasks: { total: number },
    invoices: { count, totalInvoiced, totalCollected },
    recentLeads: [...],
    upcomingTasks: [...],
  }
}
```

**FIX:** Update Dashboard to extract correct fields from `stats.data`.

---

### Issue #7: Leads Query Uses 'address' Field That Doesn't Exist
**File:** `client/src/services/leads.ts` (Line 93-95)
**File:** `server/src/routes/leads.ts` (Line 92-97)

Backend search looks for:
```typescript
where.OR = [
  { address: { contains: search, mode: 'insensitive' } }, // 'address' doesn't exist!
  { clientName: { contains: search, mode: 'insensitive' } }, // 'clientName' doesn't exist!
  { clientEmail: { contains: search, mode: 'insensitive' } }, // 'clientEmail' doesn't exist!
  { clientPhone: { contains: search, mode: 'insensitive' } }, // 'clientPhone' doesn't exist!
];
```

Prisma schema has: `street`, `city`, `fullAddress`, `name`, `email`, `phone` (NOT `address`, `clientName`, etc.)

**FIX:** Update search fields to match schema in `server/src/routes/leads.ts`.

---

### Issue #8: Auth Profile Update Endpoint Doesn't Exist
**File:** `client/src/services/index.ts` (Line 269)
**Severity:** LOW

```typescript
updateProfile: async (data: any) => {
    const response = await api.patch('/auth/profile', data);
    return response.data;
},
```

**Problem:** Backend doesn't have `PATCH /api/auth/profile` route.

---

### Issue #9: Subcontractors Service getHires Uses Wrong Endpoint
**File:** `client/src/services/index.ts` (Line 364)
**Severity:** MEDIUM

```typescript
getHires: async (params?: any) => {
    const response = await api.get('/subcontractors/hires', { params });
    return response.data;
},
```

Backend has:
- `GET /subcontractors/hires/my` - hires made by contractor
- `GET /subcontractors/hires/received` - hires received by subcontractor

Not a generic `/hires` endpoint.

---

## 3. ENVIRONMENT & CONFIGURATION ISSUES

### Issue #10: CORS Configuration May Be Too Permissive
**File:** `server/src/config/index.ts` (Line 68)
**Severity:** HIGH (Production)

```typescript
corsOrigin: process.env.CORS_ORIGIN || '*',
```

In production, CORS is validated but warning is shown, not error. This could allow unauthorized API access.

---

### Issue #11: JWT Secret Validation Only Warns in Development
**File:** `server/src/services/auth/AuthService.ts` (Line 47-52)
**Severity:** HIGH (Security)

```typescript
if (!this.jwtSecret || this.jwtSecret === 'your-secret-key-change-in-production') {
    if (config.isProduction()) {
        throw new Error('JWT_SECRET must be properly configured in production');
    }
    console.warn('⚠️ Using default JWT_SECRET - this is insecure!');
}
```

Good practice, but default secret is still used in development, which could leak into staging environments.

---

## 4. CLOUD RUN DEPLOYMENT ISSUES

### Issue #12: DATABASE_URL Not Using Secret Manager
**File:** `cloudbuild.yaml` (Line 34)
**Severity:** CRITICAL (Security)

```yaml
--set-env-vars=NODE_ENV=production,PORT=8080,DATABASE_URL=${_DATABASE_URL},JWT_SECRET=${_JWT_SECRET}
```

`DATABASE_URL` and `JWT_SECRET` are passed as substitutions, not secrets. This exposes them in Cloud Build logs.

**FIX:** Use `--set-secrets` instead:
```yaml
--set-secrets=DATABASE_URL=DATABASE_URL:latest,JWT_SECRET=JWT_SECRET:latest
```

---

### Issue #13: Missing CORS_ORIGIN in Cloud Run Configuration
**File:** `cloudbuild.yaml` (Line 34)
**Severity:** HIGH

No `CORS_ORIGIN` is set, so it defaults to `*` in production.

**FIX:** Add proper CORS origin:
```yaml
--set-env-vars=CORS_ORIGIN=https://your-frontend-domain.com
```

---

## 5. DATABASE & PRISMA ISSUES

### Issue #14: Missing Indexes for Common Queries
**File:** `server/prisma/schema.prisma`
**Severity:** PERFORMANCE

The Lead model has good indexes, but some query patterns may not be optimal:
- `email` field on User is unique but also needs to be queried case-insensitively

---

## 6. ERROR HANDLING ISSUES

### Issue #15: Inconsistent Error Response Structure
Some routes return `{success: false, error: string}` while others throw errors.

**Good Pattern (used in most routes):**
```typescript
res.status(404).json({ success: false, error: 'Lead not found' });
```

**Inconsistent Pattern (some material routes):**
```typescript
res.status(500).json({ error: 'Failed to search suppliers' });
// Missing 'success: false'
```

**Files Affected:**
- `server/src/routes/materials.ts` - Lines 68, 93, 112, 143, etc.

---

## 7. FRONTEND API CLIENT ISSUES

### Issue #16: API Base URL Not Including /api for Production
**File:** `client/src/services/api.ts` (Line 26)
**Severity:** CRITICAL

```typescript
baseURL: import.meta.env.VITE_API_URL || '/api',
```

If `VITE_API_URL` is set to `https://backend.run.app`, requests go to `https://backend.run.app/leads` instead of `https://backend.run.app/api/leads`.

**FIX:** Ensure VITE_API_URL includes `/api` suffix OR append it in the code:
```typescript
const baseURL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';
```

---

## 8. COMPLETE FIX LIST

### Fix 1: Client Services - HTTP Methods
**File:** `client/src/services/index.ts`

Change Line 25:
```typescript
// FROM
const response = await api.patch(`/leads/${id}`, data);
// TO
const response = await api.put(`/leads/${id}`, data);
```

Change Line 35:
```typescript
// FROM
const response = await api.post(`/leads/${id}/analyze`);
// TO
const response = await api.post(`/leads/${id}/refresh-intelligence`);
```

Change Line 61:
```typescript
// FROM
const response = await api.patch(`/tasks/${id}`, data);
// TO
const response = await api.put(`/tasks/${id}`, data);
```

### Fix 2: Backend Leads Route - Search Fields
**File:** `server/src/routes/leads.ts` (Lines 92-97)

```typescript
// FROM
if (search) {
  where.OR = [
    { address: { contains: search, mode: 'insensitive' } },
    { clientName: { contains: search, mode: 'insensitive' } },
    { clientEmail: { contains: search, mode: 'insensitive' } },
    { clientPhone: { contains: search, mode: 'insensitive' } },
  ];
}

// TO
if (search) {
  where.OR = [
    { fullAddress: { contains: search, mode: 'insensitive' } },
    { street: { contains: search, mode: 'insensitive' } },
    { city: { contains: search, mode: 'insensitive' } },
    { name: { contains: search, mode: 'insensitive' } },
    { email: { contains: search, mode: 'insensitive' } },
  ];
}
```

### Fix 3: Dashboard Stats - Correct Data Path
**File:** `client/src/pages/Dashboard.tsx`

Update stats access to use `stats?.data?.leads?.total` etc.

### Fix 4: API Base URL
**File:** `client/src/services/api.ts`

Ensure the base URL properly handles the `/api` prefix.

### Fix 5: Materials Routes - Consistent Error Format
**File:** `server/src/routes/materials.ts`

Add `success: false` to all error responses.

---

## 9. RECOMMENDATIONS

### High Priority
1. Fix HTTP method mismatches (PATCH vs PUT)
2. Fix search field names in leads route
3. Secure Cloud Run deployment with proper secrets
4. Set specific CORS origin for production

### Medium Priority
1. Add missing API endpoints or remove unused frontend calls
2. Standardize error response format
3. Fix Dashboard stats data extraction

### Low Priority
1. Add auth/profile endpoint if needed
2. Consider adding more database indexes

---

## 10. VERIFICATION STEPS

After applying fixes:
1. Run `npm run build` in both client and server
2. Test login flow
3. Test lead creation and update
4. Test search functionality
5. Verify analytics dashboard loads correctly
6. Test task creation and completion

