const { test, expect } = require('@playwright/test');

test.describe('UI - Quote Table Display & Formatting', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('#reset-btn');
    await page.waitForSelector('#check-IDENTITY');
  });

  test('BUG-06 wrong-format-display: UI quote section displays currency values with ₹ symbol and 2 decimal places', async ({ page }) => {
    await page.check('#check-IDENTITY');
    await page.click('#quote-btn');
    await page.waitForTimeout(300);

    const subtotalText = await page.textContent('#result-subtotal');
    const discountText = await page.textContent('#result-discount');
    const gstText = await page.textContent('#result-gst');
    const totalText = await page.textContent('#result-total');

    expect(subtotalText.trim()).toBe('₹299.00');
    expect(discountText.trim()).toBe('₹0.00');
    expect(gstText.trim()).toBe('₹53.82');
    expect(totalText.trim()).toBe('₹352.82');
  });

  test('PHASE2-NEW-007: UI quote panel total displays liveSubtotal instead of calculated total from API response', async ({ page }) => {
    await page.check('#check-IDENTITY');
    await page.click('#quote-btn');
    await page.waitForTimeout(300);

    const totalText = (await page.textContent('#result-total')).trim();
    // Subtotal is 299, but with GST (18%) total should be 352.82 (formatted ₹352.82).
    // Buggy UI sets result-total to liveSubtotal (299).
    expect(totalText).toBe('₹352.82');
  });
});
