# Untested Features — LaundrySIA Second QA Audit

**Application:** LaundrySIA  
**Audit Type:** Regression Testing  
**Date:** 2026-11-23  
**Auditor:** Senior QA Engineer

---

## Introduction

This document identifies features that were not explicitly covered during the second QA audit regression testing. These features may require additional testing to ensure stability.

---

## 1. Features Requiring Additional Testing

### 1.1 Receive Payment Dialog

**Location:** `/orders/[id]` (individual order page)

**Reason Not Tested:** Not part of initial defect verification or regression scope

**Test Scenarios:**
- [ ] Access receive payment dialog
- [ ] Enter partial payment
- [ ] Select payment method (Cash/Bank/Digital Wallet)
- [ ] Verify remaining balance calculation
- [ ] Submit payment

**Priority:** MEDIUM

---

### 1.2 Expense Management

**Location:** `/expenses`

**Reason Not Tested:** Manager can access but specific workflows not verified

**Test Scenarios:**
- [ ] Create new expense
- [ ] Edit expense
- [ ] Filter by date/category
- [ ] Verify journal entries created

**Priority:** LOW

---

### 1.3 Stock Management

**Location:** `/stock`

**Reason Not Tested:** Manager can access but specific workflows not verified

**Test Scenarios:**
- [ ] View stock levels
- [ ] Record stock movement (IN/OUT)
- [ ] Verify account balances updated

**Priority:** LOW

---

### 1.4 Report Generation

**Location:** `/reports`

**Reason Not Tested:** Page accessibility verified, export functionality not tested

**Test Scenarios:**
- [ ] Generate income statement
- [ ] Generate balance sheet
- [ ] Export to CSV/Excel
- [ ] Verify data accuracy

**Priority:** MEDIUM

---

### 1.5 Audit Log

**Location:** `/audit`

**Reason Not Tested:** Page accessible, functionality not verified

**Test Scenarios:**
- [ ] View login audit logs
- [ ] Filter by date/user
- [ ] Verify audit entries created for all actions

**Priority:** LOW

---

## 2. Edge Cases Not Tested

### 2.1 Quantity/Input Edge Cases

| Scenario | Tested | Notes |
|----------|--------|-------|
| Weight = 0.01kg (minimum) | ❌ | |
| Weight = 999.99kg (maximum) | ❌ | |
| Negative weight entry | ❌ | |
| Non-numeric input | ❌ | |

**Priority:** LOW

---

### 2.2 Form Validation Edge Cases

| Scenario | Tested | Notes |
|----------|--------|-------|
| Submit with all fields empty | ⚠️ Partial | Basic validation tested |
| Submit with partial data | ⚠️ Partial | |
| Multiple validation errors | ❌ | |

**Priority:** LOW

---

### 2.3 Authentication Edge Cases

| Scenario | Tested | Notes |
|----------|--------|-------|
| Session timeout | ❌ | |
| Token expiration | ❌ | |
| Invalid token | ❌ | |

**Priority:** MEDIUM

---

### 2.4 Browser Compatibility

| Browser | Tested | Notes |
|---------|--------|-------|
| Microsoft Edge | ✅ | Primary test browser |
| Chrome | ❌ | |
| Firefox | ❌ | |
| Safari | ❌ | |

**Priority:** LOW

---

## 3. Integration Points Not Tested

### 3.1 API Endpoints

| Endpoint | Tested | Notes |
|----------|--------|-------|
| `/api/customers/search` | ❌ | Autocomplete not tested |
| `/api/reports/export` | ❌ | CSV/Excel export not tested |

**Priority:** MEDIUM

---

### 3.2 Email/Invoice Generation

**Note:** No email functionality found in application. Invoices appear to be displayed on-screen only.

---

## 4. Performance Scenarios Not Tested

| Scenario | Tested | Notes |
|----------|--------|-------|
| High volume orders | ❌ | |
| Large customer database | ❌ | |
| Concurrent users | ❌ | |

**Priority:** LOW

---

## 5. Accessibility Not Tested

| Aspect | Tested | Notes |
|--------|--------|-------|
| Screen reader compatibility | ❌ | |
| Keyboard navigation | ❌ | |
| Color contrast | ❌ | |
| ARIA attributes | ❌ | |

**Priority:** LOW (but recommended for accessibility compliance)

---

## 6. Security Scenarios Not Tested

| Scenario | Tested | Notes |
|----------|--------|-------|
| SQL injection attempts | ❌ | |
| XSS attempts | ❌ | |
| File upload (if any) | ❌ | |
| Session hijacking | ❌ | |

**Priority:** MEDIUM

---

## 7. Test Coverage Summary

| Category | Tests Run | Coverage |
|----------|-----------|----------|
| Core Functionality | 18 | 100% |
| Defect Verification | 7 | 100% |
| Regression | 18 | 100% |
| Security | - | 0% |
| Performance | - | 0% |
| Accessibility | - | 0% |
| Edge Cases | 3-4 | ~20% |

---

## 8. Recommendations for Future Testing

1. **Add automated security tests** - Include injection, XSS, CSRF tests
2. **Add performance tests** - Test with realistic data volumes
3. **Add accessibility tests** - Use axe or similar tools
4. **Cross-browser testing** - Test on Chrome, Firefox, Safari
5. **Mobile device testing** - Test on actual devices, not just responsive viewport

---

## 9. Next Steps

| Action Item | Owner | Priority |
|-------------|-------|----------|
| Test receive payment flow | Development/QA | MEDIUM |
| Test expense management | Development/QA | LOW |
| Test report generation | Development/QA | MEDIUM |
| Add edge case tests | QA | LOW |
| Add security tests | QA/Security | MEDIUM |
| Add accessibility tests | QA | LOW |

---

## 10. Appendix: Test Scope

**Included in this audit:**
- Login/Logout flow
- Customer CRUD operations
- Order creation and management
- Service management
- Role-based access control
- Basic form validation
- Price calculation
- Authentication flow

**Not included in this audit:**
- API endpoint functional testing
- Performance/load testing
- Security penetration testing
- Accessibility compliance testing
- Cross-browser testing
- Mobile device testing
- Data import/export (beyond favicon)