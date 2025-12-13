# Stability Guardrails Report

**Date:** December 2024  
**Purpose:** Verify codebase is protected against regressions that could break core assumptions

---

## ✅ Verification Results

### 1. Module-Level API Calls
**Status:** ✅ **SAFE**

**Findings:**
- No module-level API calls found
- All API calls are inside:
  - React components (useEffect, event handlers)
  - Service functions (async functions)
  - React Query mutations/queries

**Exception (Intentional):**
- `api.ts` line 145: `axios.post` for refresh token
  - **Reason:** Bypasses interceptor to avoid infinite refresh loop
  - **Documentation:** Already commented in code
  - **Risk:** ✅ **ACCEPTABLE** - Intentional design

---

### 2. Direct localStorage Token Access
**Status:** ✅ **SAFE**

**Findings:**
- ✅ No `localStorage.getItem('token')` found
- ✅ No `localStorage.getItem('refreshToken')` found
- ✅ No `localStorage.setItem('token'|'refreshToken')` found
- ✅ All token access goes through `useAuthStore.getState()`

**Token Access Pattern:**
```typescript
// ✅ CORRECT (used everywhere)
const token = useAuthStore.getState().token;
const refreshToken = useAuthStore.getState().refreshToken;

// ❌ NOT FOUND (good - no direct localStorage access)
localStorage.getItem('token') // ❌
```

**Files Verified:**
- `client/src/services/api.ts` - Uses `useAuthStore.getState()`
- `client/src/pages/Settings.tsx` - Uses `useAuthStore.getState()`
- All other files - No direct localStorage token access

---

### 3. Maps API Loading
**Status:** ✅ **SAFE**

**Findings:**
- ✅ Maps API loaded exactly once in `client/src/main.tsx`
- ✅ Singleton pattern with `window.__mapsApiLoader`
- ✅ Script ID guard (`google-maps-api-script`) prevents duplicates
- ✅ No other Maps loading code found

**Loading Pattern:**
```typescript
// ✅ CORRECT (only in main.tsx)
const loadGoogleMapsAPI = (): Promise<void> => { ... }
loadGoogleMapsAPI().catch(() => {});

// ❌ NOT FOUND (good - no duplicate loaders)
document.createElement('script') // Only in main.tsx singleton
```

**Protection:**
- Global singleton: `window.__mapsApiLoader`
- Script ID: `google-maps-api-script`
- DOM check: `document.querySelector('script#google-maps-api-script')`
- Promise coordination: Returns existing promise if loading

---

### 4. API Instance Usage
**Status:** ✅ **SAFE**

**Findings:**
- ✅ All API calls use shared `api` instance from `client/src/services/api.ts`
- ✅ No direct `axios.create()` calls found (except in `api.ts` itself)
- ✅ No `fetch()` calls found (except in test files, if any)

**Import Pattern:**
```typescript
// ✅ CORRECT (used everywhere)
import api from '../services/api';
api.get('/endpoint');
api.post('/endpoint', data);

// ❌ NOT FOUND (good - no direct axios/fetch)
axios.get() // ❌
fetch() // ❌
```

**Files Using Shared Instance:**
- `client/src/services/index.ts` - All services use `api`
- `client/src/components/QuickLeadInput.tsx` - Uses `api`
- `client/src/pages/LeadDetail.tsx` - Uses `api`
- `client/src/components/Layout.tsx` - Uses `api`
- All other components - Use `api` or service functions that use `api`

**Exception (Intentional):**
- `api.ts` line 145: `axios.post` for refresh token
  - **Reason:** Must bypass interceptor to avoid infinite loop
  - **Documentation:** Commented in code
  - **Risk:** ✅ **ACCEPTABLE** - Intentional design

---

## 🛡️ Guardrails Added

### 1. Documentation Comments

**File:** `client/src/services/api.ts`
- Added comment explaining store hydration guarantee (line 77-81)
- Added comment explaining refresh token bypass (line 145)

**File:** `client/src/main.tsx`
- Added comment explaining Maps loader timing (line 139-141)

**Rationale:**
- Prevents future developers from accidentally breaking assumptions
- Documents intentional design decisions
- No code changes, only comments

---

## 📋 Recommendations for Future Contributors

### ✅ DO:
1. **Always use shared `api` instance:**
   ```typescript
   import api from '../services/api';
   const response = await api.get('/endpoint');
   ```

2. **Always use Zustand store for tokens:**
   ```typescript
   import { useAuthStore } from '../store/authStore';
   const token = useAuthStore.getState().token;
   ```

3. **Always use service functions when available:**
   ```typescript
   import { leadsService } from '../services';
   const leads = await leadsService.getAll();
   ```

4. **Never load Maps API directly:**
   - Maps API is loaded automatically in `main.tsx`
   - Components should check `window.google?.maps?.places` in `useEffect`
   - Use retry logic if Maps isn't ready

### ❌ DON'T:
1. **Never use direct localStorage for tokens:**
   ```typescript
   // ❌ WRONG
   localStorage.getItem('token');
   localStorage.setItem('token', token);
   ```

2. **Never create new axios instances:**
   ```typescript
   // ❌ WRONG
   const myApi = axios.create({ baseURL: '/api' });
   ```

3. **Never load Maps API in components:**
   ```typescript
   // ❌ WRONG
   const script = document.createElement('script');
   script.src = 'https://maps.googleapis.com/...';
   ```

4. **Never make API calls at module level:**
   ```typescript
   // ❌ WRONG
   const data = await api.get('/endpoint'); // At top level
   ```

---

## 🔍 ESLint Rules (Future Enhancement)

**Note:** No ESLint config found. If adding ESLint in the future, consider:

```json
{
  "rules": {
    "no-restricted-imports": [
      "error",
      {
        "paths": [
          {
            "name": "axios",
            "message": "Use shared 'api' instance from '../services/api' instead"
          }
        ]
      }
    ],
    "no-restricted-syntax": [
      "error",
      {
        "selector": "CallExpression[callee.property.name='getItem'][callee.object.name='localStorage']",
        "message": "Use Zustand store (useAuthStore.getState()) instead of direct localStorage access"
      }
    ]
  }
}
```

**Status:** Not implemented (no ESLint config exists)
**Rationale:** Adding ESLint would require dependency and config setup, which is beyond scope of stability pass

---

## ✅ Final Assessment

### Codebase Status: **PROTECTED**

**All Critical Assumptions Verified:**
- ✅ No module-level API calls
- ✅ No direct localStorage token access
- ✅ Maps API loaded exactly once
- ✅ All API calls use shared instance

**Guardrails Added:**
- ✅ Documentation comments explaining assumptions
- ✅ Clear patterns for future contributors

**Remaining Risks:**
- ⚠️ **LOW:** No ESLint rules to enforce patterns (acceptable - code review can catch)
- ⚠️ **LOW:** No automated tests for assumptions (acceptable - manual verification done)

**Recommendation:**
- ✅ **NO CODE CHANGES NEEDED**
- ✅ Codebase is stable and protected against common regressions
- ✅ Documentation added to prevent future mistakes

---

**Report Generated:** December 2024  
**Status:** ✅ **STABLE - NO ACTION NEEDED**

