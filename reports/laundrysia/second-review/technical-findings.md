# Technical Findings — LaundrySIA Second QA Audit

**Application:** LaundrySIA  
**Audit Type:** Technical Investigation  
**Date:** 2026-11-23  
**Auditor:** Senior QA Engineer  
**Test Environment:** Production build (Next.js 16.4.3)

---

## Summary

This document details technical findings from the second QA audit, including React hydration verification, authentication system analysis, and infrastructure observations.

---

## 1. React Hydration Verification

### Status: ✅ WORKING PROPERLY

**Production Build:**
- React fiber keys present on interactive elements: `__reactFiber$*`
- React props keys present: `__reactProps$*`
- No hydration errors observed
- Components render correctly with proper event handlers

**Development Build (Turbopack):**
- Hydration working but HMR WebSocket errors flood console
- This is expected behavior in development mode
- No impact on functionality

---

## 2. Authentication System Analysis

### Session Management

| Component | Status |
|-----------|--------|
| JWT Token Generation | ✅ Working |
| Token Verification | ✅ Working |
| Session TTL (7 days) | ✅ Configured |
| Secure Cookie Flags | ✅ HttpOnly, Secure |

### Login Flow

1. **LoginPage** (`/auth/login/page.tsx`)
   - Uses `useActionState` for React Server Actions
   - Shows notice banner for logged_out/inactive states
   - Checks session before rendering

2. **LoginForm** (`/auth/login/login-form.tsx`)
   - Form action dynamically generated via `useActionState`
   - Password toggle button works correctly
   - Validation errors display inline

3. **Auth Action** (`/server/actions/auth.ts`)
   - bcrypt password comparison
   - Audit logging for login attempts
   - Session cookie creation via `setSessionCookie`

### Session Handling

```typescript
// Session cookie flow
createSessionToken(user: TokenUser) → JWT → setSessionCookie()
verifySessionToken(token: string) → validate JWT → return session
```

---

## 3. Dialog System Analysis

### Dialog Component (`/components/ui/dialog.tsx`)

**Key Fix Applied (D-03, D-04):**
```typescript
// Added useLayoutEffect to track open state
const openRef = useRef(open);
useLayoutEffect(() => {
  openRef.current = open;
}, [open]);

// Changed onClose handler
if (openRef.current) onClose();
```

**Why This Fix Works:**
- `useLayoutEffect` runs before paint when `open` state changes
- Ensures `openRef.current` has the correct value before `useEffect` fires
- Prevents race condition where dialog children don't render

**Verification:**
- Customer dialog: ✅ Form fields render correctly
- Service dialog: ✅ Form fields render correctly
- Other dialogs: ✅ Verified to work (receive payment, quick-add customer)

---

## 4. Form Validation System

### Client-Side Validation

**Order Form (`/components/orders/new-order-form.tsx`):**
- Customer selection required
- Service selection required
- Real-time price calculation on service/weight change
- Weight step buttons update quantity correctly

**Server Action Validation:**
```typescript
function handleSubmit(event: FormEvent<HTMLFormElement>) {
  if (!customer || !services.length || items.some(...)) {
    event.preventDefault();  // FIX: Added to prevent form submission
    return;
  }
  // ... proceed if valid
}
```

### Quantity Formatting Fix

**Problem:** `<input type="number">` cannot accept comma decimals (Indonesian format).

**Solution:**
```typescript
// Before: "1,5" (Indonesian format) → breaks type="number"
// After: "1.5" (standard format) → works with type="number"
quantity: (Math.max(step, currentValue + step * direction) / 100)
    .toFixed(2).replace(/\.?0+$/, "")
```

---

## 5. Database Seed Analysis

**Users Created:**
| Username | Password | Role |
|----------|----------|------|
| `cashier` | `ChangeMe-Cashier1` | CASHIER |
| `manager` | `ChangeMe-Manager1` | MANAGER |

**Default Services:**
| Service | Unit | Price | Turnaround |
|---------|------|-------|------------|
| Cuci + setrika | KG | Rp 8.000 | 2 days |
| Express | KG | Rp 12.000 | 1 day |
| Kiloan | KG | Rp 7.000 | 3 days |

---

## 6. Infrastructure Observations

### Next.js Configuration

**`next.config.js`:**
```javascript
{
  reactStrictMode: true,
  experimental: {
    devTools: process.env.NODE_ENV === 'production' ? false : undefined
  }
}
```

**Note:** The `devTools` option is at an invalid path. In Next.js 16, this should be at the top level, not nested under `experimental`.

### Middleware

No custom middleware found. Application relies on:
- `requireUser()` in auth.ts for session validation
- Role-based redirects in auth.ts

### CSS Modules

Dialog styling uses CSS modules:
- `dialog.module.css` - Base dialog styles
- `login.module.css` - Login form styles
- `counter.module.css` - Counter page styles

---

## 7. API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/customers/search` | GET | Customer autocomplete |
| `/api/reports/export` | POST | Report export |

Both endpoints require authentication (session-based).

---

## 8. Security Observations

| Issue | Status | Recommendation |
|-------|--------|----------------|
| Session timeout | Not configured | Sessions last 7 days; consider shorter timeout |
| CSRF protection | Implicit | App Router provides some protection |
| Rate limiting | Not implemented | Add to login endpoint |
| Password policy | Not enforced | Consider minimum complexity requirements |

---

## 9. Performance Observations

| Metric | Finding |
|--------|---------|
| Initial load | Fast (server-rendered) |
| Navigation | Client-side (App Router) |
| Form interactions | Responsive |
| Database queries | Optimized with Prisma |

---

## 10. Known Issues

### HMR WebSocket Errors (Dev Mode Only)
- **Impact:** Console noise only, no functional impact
- **Cause:** Cross-origin HMR requests in development
- **Solution:** This is expected in current setup; production builds work correctly

### next.config.js devTools Location
- The `devTools` setting is placed under `experimental` which is deprecated
- Should be moved to top-level config for Next.js 16 compatibility

---

## Recommendations

1. **Fix next.config.js** - Move `devTools` to top level
2. **Add rate limiting** to login endpoint
3. **Add unit tests** for the quantity formatting fix
4. **Consider shorter session timeout** for security
5. **Add CSRF protection** documentation

---

## Appendix: File Locations

| File | Path |
|------|------|
| Dialog Component | `src/components/ui/dialog.tsx` |
| Order Form | `src/components/orders/new-order-form.tsx` |
| Login Form | `src/app/(auth)/login/login-form.tsx` |
| Auth Actions | `src/server/actions/auth.ts` |
| Session Utils | `src/server/session.ts` |
| Database Seed | `prisma/seed.ts` |
| Next Config | `next.config.js` |