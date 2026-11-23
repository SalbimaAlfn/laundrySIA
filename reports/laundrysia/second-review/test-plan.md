# Test Plan — LaundrySIA Second QA Audit

**Application:** LaundrySIA  
**Audit Type:** Regression Testing Plan  
**Date:** 2026-11-23  
**Prepared by:** Senior QA Engineer

---

## 1. Introduction

This document outlines the test plan for the second QA audit of LaundrySIA. The audit aims to verify that all previously reported defects have been properly addressed and that no regressions have been introduced.

---

## 2. Objectives

1. Verify all 7 previously reported defects are fixed
2. Confirm no regressions in Cashier role functionality
3. Confirm no regressions in Manager role functionality
4. Verify cross-role data visibility consistency
5. Document any new issues discovered

---

## 3. Test Environment

| Component | Configuration |
|-----------|---------------|
| Application URL | http://127.0.0.1:3001 |
| Build Type | Production (`next build` + `next start`) |
| Node.js | Bundled v18 (via Next.js) |
| Database | MySQL (local/test instance) |
| Browser | Microsoft Edge (Playwright) |
| Test Framework | Playwright Test v1.x |

---

## 4. Test Data

### User Accounts

| Username | Password | Role |
|----------|----------|------|
| `cashier` | `ChangeMe-Cashier1` | CASHIER |
| `manager` | `ChangeMe-Manager1` | MANAGER |

### Default Services (Seed Data)

| Service | Unit | Price | Turnaround |
|---------|------|-------|------------|
| Cuci + setrika | KG | Rp 8.000 | 2 days |
| Express | KG | Rp 12.000 | 1 day |
| Kiloan | KG | Rp 7.000 | 3 days |

---

## 5. Test Cases

### 5.1 Defect Verification Tests

| Test ID | Description | Priority |
|---------|-------------|----------|
| TC-01 | Verify order creation silent fail fix | HIGH |
| TC-02 | Verify price calculation fix | HIGH |
| TC-03 | Verify customer dialog rendering | HIGH |
| TC-04 | Verify service dialog rendering | HIGH |
| TC-05 | Investigate hidden required fields | MEDIUM |
| TC-06 | Verify favicon loads | LOW |
| TC-07 | Verify dev tools disabled in production | MEDIUM |

### 5.2 Cashier Regression Tests

| Test ID | Description | Priority |
|---------|-------------|----------|
| TC-08 | Cashier login flow | HIGH |
| TC-09 | Counter page access | HIGH |
| TC-10 | Create new customer | HIGH |
| TC-11 | Create new order | HIGH |
| TC-12 | Order price calculation | HIGH |
| TC-13 | Form validation (customer) | HIGH |
| TC-14 | Form validation (service) | HIGH |
| TC-15 | Logout functionality | HIGH |
| TC-16 | Manager page access blocked | HIGH |

### 5.3 Manager Regression Tests

| Test ID | Description | Priority |
|---------|-------------|----------|
| TC-17 | Manager login flow | HIGH |
| TC-18 | Dashboard access | MEDIUM |
| TC-19 | Orders page access | MEDIUM |
| TC-20 | Customers page access | MEDIUM |
| TC-21 | Receivables page access | MEDIUM |
| TC-22 | Reports page access | MEDIUM |
| TC-23 | Expenses page access | MEDIUM |
| TC-24 | Stock page access | MEDIUM |
| TC-25 | Settings page access | MEDIUM |
| TC-26 | Audit page access | MEDIUM |
| TC-27 | Create new service | HIGH |
| TC-28 | Edit service | MEDIUM |
| TC-29 | Deactivate service | MEDIUM |

### 5.4 Cross-Role Consistency Tests

| Test ID | Description | Priority |
|---------|-------------|----------|
| TC-30 | Manager sees cashier orders | MEDIUM |
| TC-31 | Manager sees cashier customers | MEDIUM |
| TC-32 | Cashier sees manager services | MEDIUM |

### 5.5 Technical Tests

| Test ID | Description | Priority |
|---------|-------------|----------|
| TC-33 | Favicon loads without 404 | LOW |
| TC-34 | No console errors on main pages | MEDIUM |
| TC-35 | Mobile responsiveness | MEDIUM |
| TC-36 | React hydration verification | MEDIUM |

---

## 6. Test Execution Matrix

| Role | Pages Tested | Expected Result |
|------|--------------|-----------------|
| Cashier | /counter, /customers, /orders/new | Full access to cashier features |
| Manager | /dashboard, /reports, /settings, etc. | Full admin access |
| Unauthorized | Any manager page with cashier session | Redirect to /counter with notice |

---

## 7. Entry Criteria

- [x] Production build completed successfully
- [x] Database seeded with test data
- [x] Server running on port 3001
- [x] Test credentials verified
- [x] Playwright installed with browser

---

## 8. Exit Criteria

- [x] All critical tests passed
- [x] All high priority tests passed (or documented as issues)
- [x] Defect verification completed
- [x] Regression test results documented

---

## 9. Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Database state not reset | Use seed data, verify IDs before testing |
| Session conflicts | Use fresh login for each test |
| Test data pollution | Use unique test values (e.g., "QA Test Customer") |

---

## 10. Schedule

| Activity | Estimated Time |
|----------|----------------|
| Environment setup | 5 min |
| Defect verification | 15 min |
| Cashier regression | 15 min |
| Manager regression | 20 min |
| Cross-role testing | 10 min |
| Technical verification | 10 min |
| Report writing | 15 min |
| **Total** | **~1.5 hours** |

---

## 11. Approvals

| Role | Name | Sign-off | Date |
|------|------|----------|------|
| QA Lead | | | |
| Dev Lead | | | |
| Product Owner | | | |

---

## 12. References

- Previous QA Report: `reports/laundrysia/QA-FINAL-REPORT.md`
- Defect Register: `reports/laundrysia/defect-register.md`
- Fix Summary: `reports/laundrysia/FIX-SUMMARY-DETAIL.md`
- Git Commit: `1e33877` - "fixing bugs v2"