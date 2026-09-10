const { test, expect } = require('@playwright/test');

test.describe('API - Quote Edge Cases & Session State', () => {
  test.beforeEach(async ({ request }) => {
    await request.post('/api/reset');
  });

  test('PHASE2-NEW-004: POST /api/quote cache key ignores discountPercent and returns stale quote on repeated check selections', async ({ request }) => {
    const res1 = await request.post('/api/quote', {
      data: { checkIds: ['IDENTITY'], discountPercent: 10 }
    });
    const quote1 = await res1.json();

    const res2 = await request.post('/api/quote', {
      data: { checkIds: ['IDENTITY'], discountPercent: 50 }
    });
    const quote2 = await res2.json();

    // Expected behavior: quote2 must reflect 50% discount (299 * 0.50 = 149.5), not cached 10% quote
    const expectedDiscount2 = 299 * (50 / 100);
    expect(quote2.discount).toBeCloseTo(expectedDiscount2, 2);
  });

  test('PHASE2-NEW-006: POST /api/quote reuses last discountPercent across session requests when discountPercent is omitted', async ({ request }) => {
    // Request 1 with 50% discount
    await request.post('/api/quote', {
      data: { checkIds: ['IDENTITY'], discountPercent: 50 }
    });

    // Request 2 omitting discountPercent
    const res2 = await request.post('/api/quote', {
      data: { checkIds: ['EDUCATION'] }
    });

    // If request 2 is processed, discountPercent should default to 0, not 50 from previous request
    if (res2.status() === 201) {
      const quote2 = await res2.json();
      expect(quote2.discount).toBe(0);
    } else {
      expect(res2.status()).toBe(400);
    }
  });
});
