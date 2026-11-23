# Remediation Tasks — LaundrySIA Second QA Audit

**Application:** LaundrySIA  
**Audit Type:** Regression Testing  
**Date:** 2026-11-23  
**Status:** Follow-up from Second QA Audit

---

## Summary

This document identifies remediation tasks remaining after the second QA audit. All previously reported defects have been addressed except for one requiring investigation.

---

## 1. High Priority Items (Must Fix)

### RT-01: Investigate Hidden Required Fields (D-05)

**Description:** Need to identify which form fields are marked as required but appear visually hidden or inaccessible.

**Priority:** MEDIUM
**Estimated Effort:** 2-4 hours
**Owner:** Development Team

**Acceptance Criteria:**
- [ ] Identify all hidden/inaccessible required fields
- [ ] Either make fields visible or remove required attribute
- [ ] Verify screen reader accessibility

---

## 2. Medium Priority Items (Should Fix)

### RT-02: Update next.config.js devTools Location

**Description:** The `devTools` option is nested under `experimental` which is deprecated in Next.js 16.

**Priority:** MEDIUM
**Estimated Effort:** 5 minutes
**Owner:** Development Team

**Current Code:**
```javascript
{
  reactStrictMode: true,
  experimental: {
    devTools: process.env.NODE_ENV === 'production' ? false : undefined
  }
}
```

**Expected Code:**
```javascript
{
  reactStrictMode: true,
  devTools: false,  // Always disabled in production
}
```

**Acceptance Criteria:**
- [ ] Update `next.config.js` structure
- [ ] Verify build still works
- [ ] Verify dev tools still disabled in production

---

### RT-03: Add Unit Tests for Quantity Formatting

**Description:** The quantity formatting fix in `new-order-form.tsx` needs unit test coverage.

**Priority:** MEDIUM
**Estimated Effort:** 2-3 hours
**Owner:** Development Team

**Acceptance Criteria:**
- [ ] Unit tests for `stepQuantity()` function
- [ ] Tests cover KG unit (0.5 kg steps)
- [ ] Tests cover PIECE unit (1 step)
- [] Tests verify dot decimal format output

---

### RT-04: Add Rate Limiting to Login Endpoint

**Description:** No rate limiting is implemented on the login endpoint, potentially allowing brute force attacks.

**Priority:** MEDIUM
**Estimated Effort:** 4-6 hours
**Owner:** Development Team

**Acceptance Criteria:**
- [ ] Implement rate limiting middleware
- [ ] Configure reasonable limits (e.g., 5 attempts/minute/IP)
- [ ] Return appropriate error message
- [ ] Log suspicious activity

---

## 3. Low Priority Items (Nice to Have)

### RT-05: Update Test Suite for React Server Actions

**Description:** The `tests/second-qa-audit.spec.ts` file uses traditional form submission methods but the app uses React Server Actions.

**Priority:** LOW
**Estimated Effort:** 3-4 hours
**Owner:** QA Team / Development Team

**Acceptance Criteria:**
- [ ] Update form submission to use `page.evaluate()` with native fetch
- [ ] Or configure Playwright for proper React Server Action testing
- [ ] All tests pass
- [ ] Test coverage maintained

---

### RT-06: Implement Session Timeout

**Description:** Sessions last 7 days. Consider shorter timeout for security.

**Priority:** LOW
**Estimated Effort:** 2 hours
**Owner:** Development Team

**Acceptance Criteria:**
- [ ] Configure session timeout (e.g., 1 hour)
- [ ] Implement refresh mechanism
- [ ] Test idle timeout behavior

---

## 4. Informational Items (Consider for Future)

### RT-07: Add CSRF Protection Documentation

**Description:** While App Router provides some CSRF protection, documentation should clarify this.

**Priority:** LOW
**Estimated Effort:** 1 hour
**Owner:** Documentation Team

**Acceptance Criteria:**
- [ ] Document CSRF protection approach
- [ ] Add security section to documentation

---

## 5. Already Completed

These items were verified as complete during this audit:

| Task ID | Description | Status |
|---------|-------------|--------|
| COM-01 | Order creation form validation | ✅ DONE |
| COM-02 | Price calculation fix | ✅ DONE |
| COM-03 | Customer dialog rendering | ✅ DONE |
| COM-04 | Service dialog rendering | ✅ DONE |
| COM-05 | Favicon added | ✅ DONE |
| COM-06 | Dev tools disabled in production | ✅ DONE |
| COM-07 | Cashier role functionality verified | ✅ DONE |
| COM-08 | Manager role functionality verified | ✅ DONE |
| COM-09 | Cross-role data consistency verified | ✅ DONE |

---

## 6. Testing Recommendations

### Automated Tests
- [ ] Add unit tests for `dialog.tsx` open/close behavior
- [ ] Add integration tests for form validation flows
- [ ] Add security tests for rate limiting

### Manual Tests
- [ ] Accessibility audit for hidden fields (RT-01)
- [ ] Session timeout user experience test
- [ ] Multi-browser compatibility check

---

## 7. Prioritization Matrix

| Task | Impact | Effort | Priority |
|------|--------|--------|----------|
| RT-01: Hidden fields | Medium | Low | High |
| RT-02: next.config.js | Low | Very Low | Medium |
| RT-03: Unit tests | Medium | Medium | Medium |
| RT-04: Rate limiting | High | Medium | Medium |
| RT-05: Test suite | Medium | Medium | Low |
| RT-06: Session timeout | Medium | Low | Low |
| RT-07: CSRF docs | Low | Very Low | Low |

---

## 8. Sign-off

| Role | Name | Sign-off | Date |
|------|------|----------|------|
| QA Engineer | | | |
| Development Lead | | | |
| Product Owner | | | |