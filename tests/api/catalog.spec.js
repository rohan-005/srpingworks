const { test, expect } = require('@playwright/test');

test.describe('API - Catalog Endpoint', () => {
  test.beforeEach(async ({ request }) => {
    await request.post('/api/reset');
  });

  test('BUG-01 leaks-hidden-field: GET /api/checks-catalog does not expose vendorCost field', async ({ request }) => {
    const response = await request.get('/api/checks-catalog');
    expect(response.status()).toBe(200);

    const catalog = await response.json();
    expect(Array.isArray(catalog)).toBe(true);
    expect(catalog.length).toBeGreaterThan(0);

    for (const item of catalog) {
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('name');
      expect(item).toHaveProperty('price');
      expect(item.vendorCost).toBeUndefined();
    }
  });

  test('PHASE2-NEW-003: POST /api/quote permanently mutates catalog check prices in memory across subsequent requests', async ({ request }) => {
    const initialRes = await request.get('/api/checks-catalog');
    const initialCatalog = await initialRes.json();
    const identityInitial = initialCatalog.find((c) => c.id === 'IDENTITY');
    expect(identityInitial.price).toBe(299);

    await request.post('/api/quote', {
      data: { checkIds: ['IDENTITY'], discountPercent: 20 }
    });

    const secondRes = await request.get('/api/checks-catalog');
    const secondCatalog = await secondRes.json();
    const identitySecond = secondCatalog.find((c) => c.id === 'IDENTITY');

    // Expected behavior: catalog prices must be immutable across quote calculations
    expect(identitySecond.price).toBe(299);
  });
});
