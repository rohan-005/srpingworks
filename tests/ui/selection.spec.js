const { test, expect } = require('@playwright/test');

test.describe('UI - Check Selection & Live Subtotal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('#reset-btn');
  });

  test('BUG-05 state-not-persisted: UI live subtotal decreases when checkboxes are deselected', async ({ page }) => {
    // Select all 6 checks
    await page.check('#check-IDENTITY');
    await page.check('#check-EDUCATION');
    await page.check('#check-EMPLOYMENT');
    await page.check('#check-ADDRESS');
    await page.check('#check-CRIMINAL');
    await page.check('#check-CREDIT');

    // Deselect Criminal (599) and Credit (249)
    await page.uncheck('#check-CRIMINAL');
    await page.uncheck('#check-CREDIT');

    // Expected live subtotal: 2994 - 599 - 249 = 2146
    const liveSubtotalText = await page.textContent('#live-subtotal');
    expect(liveSubtotalText).toMatch(/₹?\s*2,?146(\.00)?/);
  });

  test('PHASE2-NEW-001: UI sends invalid element IDs with check- prefix in POST /api/quote payload', async ({ page }) => {
    await page.check('#check-IDENTITY');

    let capturedPayload = null;
    page.on('request', (req) => {
      if (req.url().includes('/api/quote') && req.method() === 'POST') {
        capturedPayload = req.postDataJSON();
      }
    });

    await page.click('#quote-btn');

    expect(capturedPayload).not.toBeNull();
    // Expected: UI should send ["IDENTITY"], not DOM element id ["check-IDENTITY"]
    expect(capturedPayload.checkIds).toEqual(['IDENTITY']);
  });
});
