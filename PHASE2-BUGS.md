# Phase 2 — Playwright Bug Discovery & Automated Test Summary

This document details the complete bug inventory for the BGV Package Pricing application, covering both the 12 known Phase 1 bugs and 10 newly discovered Phase 2 defects found during exploratory API and UI testing.

---

# Known Bugs

The 12 known bugs from Phase 1 are reproduced by the following Playwright automated tests:

1. **leaks-hidden-field**
   - **Layer**: API (`GET /api/checks-catalog`)
   - **Automated Test**: `tests/api/catalog.spec.js` -> `BUG-01 leaks-hidden-field: GET /api/checks-catalog does not expose vendorCost field`

2. **missing-boundary-check**
   - **Layer**: API (`POST /api/quote`)
   - **Automated Test**: `tests/api/quote-validation.spec.js` -> `BUG-02 missing-boundary-check: POST /api/quote rejects empty checkIds array with 400 Bad Request`

3. **missing-reference-or-state-check**
   - **Layer**: API (`POST /api/quote`)
   - **Automated Test**: `tests/api/quote-validation.spec.js` -> `BUG-03 missing-reference-or-state-check: POST /api/quote rejects non-existent check IDs with 400 Bad Request`

4. **wrong-arithmetic**
   - **Layer**: API (`POST /api/quote`)
   - **Automated Test**: `tests/api/quote-calculation.spec.js` -> `BUG-04 wrong-arithmetic: POST /api/quote calculates discount amount as subtotal * discountPercent / 100`

5. **state-not-persisted — UI subtotal**
   - **Layer**: UI (`/`)
   - **Automated Test**: `tests/ui/selection.spec.js` -> `BUG-05 state-not-persisted: UI live subtotal decreases when checkboxes are deselected`

6. **wrong-format-display**
   - **Layer**: UI (`/`)
   - **Automated Test**: `tests/ui/quote.spec.js` -> `BUG-06 wrong-format-display: UI quote section displays currency values with ₹ symbol and 2 decimal places`

7. **wrong-persisted-default**
   - **Layer**: API (`POST /api/quote`)
   - **Automated Test**: `tests/api/quote-validation.spec.js` -> `BUG-07 wrong-persisted-default: POST /api/quote rejects request missing checkIds with 400 Bad Request`

8. **missing-ui-feedback-guard**
   - **Layer**: UI (`/`)
   - **Automated Test**: `tests/ui/validation.spec.js` -> `BUG-08 missing-ui-feedback-guard: UI displays error message and suppresses success message on invalid negative discount`

9. **wrong-status-code**
   - **Layer**: API (`POST /api/quote`)
   - **Automated Test**: `tests/api/quote-validation.spec.js` -> `BUG-09 wrong-status-code: POST /api/quote returns 400 Bad Request for non-numeric discountPercent string`

10. **state-not-persisted — API checkIds element type**
    - **Layer**: API (`POST /api/quote`)
    - **Automated Test**: `tests/api/quote-validation.spec.js` -> `BUG-10 state-not-persisted: POST /api/quote returns 400 Bad Request for non-string elements in checkIds`

11. **missing-required-field**
    - **Layer**: API (`POST /api/quote`)
    - **Automated Test**: `tests/api/quote-validation.spec.js` -> `BUG-11 missing-required-field: POST /api/quote returns 400 Bad Request when checkIds is omitted entirely`

12. **wrong-ui-copy-or-label**
    - **Layer**: API (`POST /api/quote`)
    - **Automated Test**: `tests/api/quote-calculation.spec.js` -> `BUG-12 wrong-ui-copy-or-label: POST /api/quote correctly calculates discount for decimal discount percent (12.5%)`

---

# Newly Discovered Bugs

The following 10 additional genuine application defects were identified during Phase 2 exploratory testing and are backed by automated Playwright tests:

### 1. PHASE2-NEW-001
- **Title**: UI sends DOM element IDs with `check-` prefix instead of catalog IDs in POST /api/quote payload
- **Severity**: High
- **Layer**: UI
- **Endpoint/page**: `/` (Index page)
- **Expected**: Outgoing payload `checkIds` array contains catalog item IDs (e.g., `["IDENTITY"]`).
- **Actual**: Outgoing payload `checkIds` array contains element DOM IDs (e.g., `["check-IDENTITY"]`), causing the server to find no matching catalog items and return subtotal 0 for all UI quote requests.
- **Automated Test**: `tests/ui/selection.spec.js` -> `PHASE2-NEW-001: UI sends invalid element IDs with check- prefix in POST /api/quote payload`
- **Root Cause/Location**: [public/app.js:L33-36](file:///home/frosthowl/work/04-bgv-package-pricing/public/app.js#L33-L36) (`cb.id` is used instead of `cb.value`).

### 2. PHASE2-NEW-002
- **Title**: POST /api/quote returns HTTP 500 Internal Server Error instead of 400 Bad Request when `checkIds` is not an array
- **Severity**: Medium
- **Layer**: API
- **Endpoint/page**: `POST /api/quote`
- **Expected**: HTTP 400 Bad Request with client validation error message.
- **Actual**: HTTP 500 Internal Server Error (`{ "error": "checkIds must be an array" }`).
- **Automated Test**: `tests/api/quote-validation.spec.js` -> `PHASE2-NEW-002: POST /api/quote returns HTTP 400 Bad Request instead of 500 Internal Server Error when checkIds is a string`
- **Root Cause/Location**: [server.js:L67](file:///home/frosthowl/work/04-bgv-package-pricing/server.js#L67) (`res.status(500)` hardcoded for non-array checkIds).

### 3. PHASE2-NEW-003
- **Title**: POST /api/quote permanently mutates catalog check prices in shared memory
- **Severity**: Critical
- **Layer**: API / Memory State
- **Endpoint/page**: `POST /api/quote` & `GET /api/checks-catalog`
- **Expected**: Catalog item prices are read-only and unmutated across quote calculations.
- **Actual**: Requesting a quote with a discount permanently reduces check prices in `req.store.checksCatalog` in memory. Subsequent `GET /api/checks-catalog` and `POST /api/quote` requests return corrupted prices.
- **Automated Test**: `tests/api/catalog.spec.js` -> `PHASE2-NEW-003: POST /api/quote permanently mutates catalog check prices in memory across subsequent requests`
- **Root Cause/Location**: [server.js:L103-105](file:///home/frosthowl/work/04-bgv-package-pricing/server.js#L103-L105) (`check.price = check.price - check.price * (discountPercent / 100)` directly mutates in-memory catalog items).

### 4. PHASE2-NEW-004
- **Title**: POST /api/quote cache key ignores `discountPercent`, returning stale quotes on repeated check selections
- **Severity**: High
- **Layer**: API / Caching
- **Endpoint/page**: `POST /api/quote`
- **Expected**: Requesting a quote for the same check combination with a different `discountPercent` returns a quote reflecting the new discount percentage.
- **Actual**: The cache key only joins `checkIds`, ignoring `discountPercent`. Second request returns the cached quote from the first request with the original discount.
- **Automated Test**: `tests/api/quote-edge-cases.spec.js` -> `PHASE2-NEW-004: POST /api/quote cache key ignores discountPercent and returns stale quote on repeated check selections`
- **Root Cause/Location**: [server.js:L78](file:///home/frosthowl/work/04-bgv-package-pricing/server.js#L78) (`const cacheKey = checkIds.slice().sort().join(",")` omits `discountPercent`).

### 5. PHASE2-NEW-005
- **Title**: POST /api/quote adds discount amount to total instead of subtracting it
- **Severity**: High
- **Layer**: API / Arithmetic
- **Endpoint/page**: `POST /api/quote`
- **Expected**: Total equals `subtotal - discount + gst`.
- **Actual**: Total equals `subtotal + discount + gst` (discount amount is added to total).
- **Automated Test**: `tests/api/quote-calculation.spec.js` -> `PHASE2-NEW-005: POST /api/quote adds discount amount to total instead of subtracting it`
- **Root Cause/Location**: [server.js:L97](file:///home/frosthowl/work/04-bgv-package-pricing/server.js#L97) (`const total = subtotal + discount + gst;`).

### 6. PHASE2-NEW-006
- **Title**: POST /api/quote reuses `lastDiscountPercent` across session requests when `discountPercent` is omitted
- **Severity**: Medium
- **Layer**: API / Session State Leak
- **Endpoint/page**: `POST /api/quote`
- **Expected**: Omitted `discountPercent` defaults to 0 (or is rejected with 400 Bad Request).
- **Actual**: Server reuses `discountPercent` from previous request stored in session state (`req.store.lastDiscountPercent`).
- **Automated Test**: `tests/api/quote-edge-cases.spec.js` -> `PHASE2-NEW-006: POST /api/quote reuses last discountPercent across session requests when discountPercent is omitted`
- **Root Cause/Location**: [server.js:L70-76](file:///home/frosthowl/work/04-bgv-package-pricing/server.js#L70-L76) (`discountPercent = req.store.lastDiscountPercent`).

### 7. PHASE2-NEW-007
- **Title**: UI quote panel total displays client `liveSubtotal` instead of API response total
- **Severity**: Medium
- **Layer**: UI
- **Endpoint/page**: `/` (Index page)
- **Expected**: `#result-total` displays calculated total from API response (`data.total`).
- **Actual**: `#result-total` displays client-side `liveSubtotal`.
- **Automated Test**: `tests/ui/quote.spec.js` -> `PHASE2-NEW-007: UI quote panel total displays liveSubtotal instead of calculated total from API response`
- **Root Cause/Location**: [public/app.js:L68](file:///home/frosthowl/work/04-bgv-package-pricing/public/app.js#L68) (`document.getElementById("result-total").textContent = liveSubtotal;`).

### 8. PHASE2-NEW-008
- **Title**: UI discount input validation locks after first change and ignores subsequent invalid inputs
- **Severity**: Medium
- **Layer**: UI / Input Validation
- **Endpoint/page**: `/` (Index page)
- **Expected**: Validation runs on every input change, updating error message dynamically.
- **Actual**: `discountValidated` flag latches `true` on first change event and suppresses all future validation checks.
- **Automated Test**: `tests/ui/validation.spec.js` -> `PHASE2-NEW-008: UI discount input validation locks after first change and ignores subsequent invalid inputs`
- **Root Cause/Location**: [public/app.js:L42-49](file:///home/frosthowl/work/04-bgv-package-pricing/public/app.js#L42-L49) (`if (discountValidated) return; ... discountValidated = true;`).

### 9. PHASE2-NEW-009
- **Title**: POST /api/quote accepts duplicate checkIds and double-counts check prices
- **Severity**: Medium
- **Layer**: API / Validation & Arithmetic
- **Endpoint/page**: `POST /api/quote`
- **Expected**: API rejects duplicate check IDs with 400 Bad Request or deduplicates them.
- **Actual**: API iterates over duplicate check IDs, summing price twice and mutating catalog price twice.
- **Automated Test**: `tests/api/quote-calculation.spec.js` -> `PHASE2-NEW-009: POST /api/quote accepts duplicate checkIds and double-counts check prices`
- **Root Cause/Location**: [server.js:L87-93](file:///home/frosthowl/work/04-bgv-package-pricing/server.js#L87-L93) (no deduplication or validation of check IDs).

### 10. PHASE2-NEW-010
- **Title**: POST /api/quote accepts `discountPercent` > 100 without validation
- **Severity**: Medium
- **Layer**: API / Input Validation
- **Endpoint/page**: `POST /api/quote`
- **Expected**: API returns 400 Bad Request when `discountPercent` exceeds 100 (as specified in OpenAPI spec).
- **Actual**: API returns 201 Created and processes out-of-range discount.
- **Automated Test**: `tests/api/quote-validation.spec.js` -> `PHASE2-NEW-010: POST /api/quote accepts discountPercent > 100 without validation`
- **Root Cause/Location**: [server.js:L62-84](file:///home/frosthowl/work/04-bgv-package-pricing/server.js#L62-L84) (missing range validation on `discountPercent`).

---

# Test Summary

- **Total automated tests**: 22
- **Known bugs covered**: 12
- **New bugs discovered**: 10
- **Confirmed application failures**: 22
- **Test/setup failures**: 0
