const { test, expect } = require('@playwright/test');
const { calculateExpectedQuote } = require('../helpers/test-data');

test.describe('API - Quote Calculations', () => {
  test.beforeEach(async ({ request }) => {
    await request.post('/api/reset');
  });

  test('BUG-04 wrong-arithmetic: POST /api/quote calculates discount amount as subtotal * discountPercent / 100', async ({ request }) => {
    // All 6 checks: 299 + 499 + 999 + 349 + 599 + 249 = 2994
    const checkIds = ['IDENTITY', 'EDUCATION', 'EMPLOYMENT', 'ADDRESS', 'CRIMINAL', 'CREDIT'];
    const response = await request.post('/api/quote', {
      data: { checkIds, discountPercent: 20 }
    });

    expect(response.status()).toBe(201);
    const quote = await response.json();

    const expectedDiscount = 2994 * (20 / 100); // 598.80
    expect(quote.discount).toBeCloseTo(expectedDiscount, 2);
  });

  test('BUG-12 wrong-ui-copy-or-label: POST /api/quote correctly calculates discount for decimal discount percent (12.5%)', async ({ request }) => {
    const response = await request.post('/api/quote', {
      data: { checkIds: ['IDENTITY'], discountPercent: 12.5 }
    });

    expect(response.status()).toBe(201);
    const quote = await response.json();

    const expectedDiscount = 299 * (12.5 / 100); // 37.375
    expect(quote.discount).toBeCloseTo(expectedDiscount, 2);
  });

  test('PHASE2-NEW-005: POST /api/quote adds discount amount to total instead of subtracting it', async ({ request }) => {
    const response = await request.post('/api/quote', {
      data: { checkIds: ['IDENTITY'], discountPercent: 10 }
    });

    expect(response.status()).toBe(201);
    const quote = await response.json();

    // Expected standard formula: total = subtotal - discount + gst
    const subtotal = 299;
    const expectedDiscount = 299 * (10 / 100); // 29.9
    const expectedGst = subtotal * 0.18; // 53.82
    const expectedTotal = subtotal - expectedDiscount + expectedGst; // 322.92

    expect(quote.total).toBeCloseTo(expectedTotal, 2);
  });

  test('PHASE2-NEW-009: POST /api/quote accepts duplicate checkIds and double-counts check prices', async ({ request }) => {
    const response = await request.post('/api/quote', {
      data: { checkIds: ['IDENTITY', 'IDENTITY'], discountPercent: 0 }
    });

    // Should either reject duplicate IDs with 400 or deduplicate them so subtotal is 299
    if (response.status() === 201) {
      const quote = await response.json();
      expect(quote.subtotal).toBe(299);
    } else {
      expect(response.status()).toBe(400);
    }
  });
});
