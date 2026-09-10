const { test, expect } = require('@playwright/test');

test.describe('API - Quote Request Validation', () => {
  test.beforeEach(async ({ request }) => {
    await request.post('/api/reset');
  });

  test('BUG-02 missing-boundary-check: POST /api/quote rejects empty checkIds array with 400 Bad Request', async ({ request }) => {
    const response = await request.post('/api/quote', {
      data: { checkIds: [] }
    });
    expect(response.status()).toBe(400);
  });

  test('BUG-03 missing-reference-or-state-check: POST /api/quote rejects non-existent check IDs with 400 Bad Request', async ({ request }) => {
    const response = await request.post('/api/quote', {
      data: { checkIds: ['INVALID_ID_XYZ'] }
    });
    expect(response.status()).toBe(400);
  });

  test('BUG-07 wrong-persisted-default: POST /api/quote rejects request missing checkIds with 400 Bad Request', async ({ request }) => {
    const response = await request.post('/api/quote', {
      data: { discountPercent: 10 }
    });
    expect(response.status()).toBe(400);
  });

  test('BUG-09 wrong-status-code: POST /api/quote returns 400 Bad Request for non-numeric discountPercent string', async ({ request }) => {
    const response = await request.post('/api/quote', {
      data: { checkIds: ['IDENTITY'], discountPercent: 'invalid_string' }
    });
    expect(response.status()).toBe(400);
  });

  test('BUG-10 state-not-persisted: POST /api/quote returns 400 Bad Request for non-string elements in checkIds', async ({ request }) => {
    const response = await request.post('/api/quote', {
      data: { checkIds: [123, true] }
    });
    expect(response.status()).toBe(400);
  });

  test('BUG-11 missing-required-field: POST /api/quote returns 400 Bad Request when checkIds is omitted entirely', async ({ request }) => {
    const response = await request.post('/api/quote', {
      data: {}
    });
    expect(response.status()).toBe(400);
  });

  test('PHASE2-NEW-002: POST /api/quote returns HTTP 400 Bad Request instead of 500 Internal Server Error when checkIds is a string', async ({ request }) => {
    const response = await request.post('/api/quote', {
      data: { checkIds: 'IDENTITY' }
    });
    expect(response.status()).toBe(400);
  });

  test('PHASE2-NEW-010: POST /api/quote accepts discountPercent > 100 without validation', async ({ request }) => {
    const response = await request.post('/api/quote', {
      data: { checkIds: ['IDENTITY'], discountPercent: 150 }
    });
    expect(response.status()).toBe(400);
  });
});
