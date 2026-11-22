# Change Analysis — LaundrySIA Second QA Audit

**Application:** LaundrySIA
**URL:** http://127.0.0.1:3000
**Date:** 2026-11-22
**Previous Audit:** 2026-11-22 (same day, post-fix re-verification)

---

## Git Status Summary

```
 M src/components/orders/new-order-form.tsx
 M src/components/ui/dialog.tsx
?? next.config.js
?? public/favicon.svg
?? reports/
```

---

## Modified Files

### 1. `src/components/orders/new-order-form.tsx`

**Changes:**
- **`stepQuantity()` function (lines 190-205):** Changed quantity value formatting from `formatQuantity()` (which returns Indonesian comma decimal format like `"1,5"`) to dot decimal format using `(value / 100).toFixed(2).replace(/\.?0+$/, "")` (returns `"1.5"`). This fixes `<input type="number">` compatibility.
- **`handleSubmit()` function (lines 215-223):** Added `event.preventDefault()` when validation fails (missing customer, no services, or service not selected per line item). Previously returned early without preventing default form submission.

**Previous Defects Addressed:**
- **D-01** (HIGH): Order creation form silently fails
- **D-02** (HIGH): Price calculation shows Rp 0

**Related Features:**
- New Order creation (/orders/new)
- Price calculation (Subtotal/Total)
- Form validation and submission
- Weight/quantity input controls (+/- buttons)

---

### 2. `src/components/ui/dialog.tsx`

**Changes:**
- Added `useLayoutEffect` import
- Added `openRef` ref to track current `open` state
- Added `useLayoutEffect` to update `openRef.current` before `useEffect` runs
- Changed `onClose` handler on `<dialog>` element from `if (open) onClose()` to `if (openRef.current) onClose()`

**Previous Defects Addressed:**
- **D-03** (HIGH): Customer creation dialog has empty body
- **D-04** (HIGH): Service creation dialog has empty body

**Related Features:**
- ALL dialogs in the application:
  - Customer creation dialog (/customers)
  - Customer edit dialog (/customers)
  - Quick-add customer in order form (/orders/new)
  - Service creation dialog (/settings/services)
  - Service edit dialog (/settings/services)
  - Receive payment dialog (/orders/[id])
  - Any other dialog components

---

## New Files

### 3. `next.config.js` (NEW)

**Content:**
```javascript
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    devTools: process.env.NODE_ENV === 'production' ? false : undefined,
  },
};
```

**Previous Defects Addressed:**
- **D-07** (MEDIUM): Next.js Dev Tools exposed on public pages

**Related Features:**
- Production build configuration
- Development tooling exposure

---

### 4. `public/favicon.svg` (NEW)

**Content:** SVG favicon with LaundrySIA branding (brown #8B5E3C background, white lines, laundry basket icon)

**Previous Defects Addressed:**
- **D-06** (LOW): Missing favicon returns 404

**Related Features:**
- Site assets
- Browser tab icon

---

## Summary of Changes vs. Previous Defects

| Defect | Severity | Files Changed | Status Per Reports |
|--------|----------|---------------|-------------------|
| D-01: Order creation silent fail | HIGH | new-order-form.tsx | FIXED ✅ |
| D-02: Price calculation = Rp 0 | HIGH | new-order-form.tsx | FIXED ✅ |
| D-03: Customer dialog empty | HIGH | dialog.tsx | FIXED ✅ |
| D-04: Service dialog empty | HIGH | dialog.tsx | FIXED ✅ |
| D-05: Hidden required fields | MEDIUM | (investigation only) | N/A ✅ |
| D-06: Missing favicon | LOW | favicon.svg (new) | FIXED ✅ |
| D-07: Dev tools exposed | MEDIUM | next.config.js (new) | FIXED ✅ |

---

## Changes That Cannot Yet Be Verified

1. **`next.config.js` devTools setting** — Requires production build (`next build` + `next start`) to verify dev tools are disabled. Development mode (`next dev`) will still show dev tools.

2. **Dialog fix scope** — The fix applies to ALL dialogs in the application. While customer and service dialogs were the reported failures, other dialogs (receive payment, quick-add customer, etc.) should be verified.

3. **Price calculation edge cases** — The fix changes quantity formatting. Need to verify:
   - KG unit (0.5 kg steps)
   - PIECE unit (1 step)
   - Manual entry
   - Multiple service lines
   - Discount application

4. **Form validation edge cases** — Need to verify:
   - Server-side validation errors display correctly
   - Client-side blocking works
   - Multiple invalid fields handled

---

## Related Code Files to Inspect During Testing

| File | Purpose | Relevance |
|------|---------|-----------|
| `src/components/orders/new-order-form.tsx` | Main order form | D-01, D-02 fixes |
| `src/components/ui/dialog.tsx` | Base Dialog component | D-03, D-04 fixes |
| `src/components/customers/customers-manager.tsx` | Customer list + dialogs | Verify customer dialog |
| `src/components/services/services-manager.tsx` | Service list + dialogs | Verify service dialog |
| `src/components/orders/receive-payment-dialog.tsx` | Payment dialog | Regression check |
| `src/server/actions/orders.ts` | Order server actions | Verify persistence |
| `src/server/actions/customers.ts` | Customer server actions | Verify persistence |
| `src/server/actions/services.ts` | Service server actions | Verify persistence |
| `src/lib/schemas/order.ts` | Order validation schemas | Verify validation |

---

## Test Accounts (From Previous Audit)

- **Cashier:** `cashier` / [password supplied at runtime]
- **Manager:** `manager` / [password supplied at runtime]

---

## Testing Environment

- **URL:** http://127.0.0.1:3000
- **Mode:** Development (Turbopack, HMR)
- **Browser:** Microsoft Edge via Playwright MCP
- **Database:** Dedicated disposable test database