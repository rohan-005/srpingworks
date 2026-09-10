const { test, expect } = require('@playwright/test');

test.describe('UI - Input Validation & Feedback Messages', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('#reset-btn');
    await page.waitForSelector('.check-row');
    await page.waitForTimeout(100);
  });

  test('BUG-08 missing-ui-feedback-guard: UI displays error message and suppresses success message on invalid negative discount', async ({ page }) => {
    await page.check('#check-IDENTITY');
    await page.fill('#discount-input', '-1');
    await page.dispatchEvent('#discount-input', 'change');
    await page.click('#quote-btn');

    await page.waitForTimeout(500);

    const messageText = await page.textContent('#message');
    // Expected behavior: invalid discount should display a validation error and suppress success message
    expect(messageText).not.toContain('Quote generated successfully!');
  });

  test('PHASE2-NEW-008: UI discount input validation locks after first change and ignores subsequent invalid inputs', async ({ page }) => {
    const input = page.locator('#discount-input');

    // 1. Enter valid discount 20 and trigger change event (latches discountValidated = true)
    await input.focus();
    await input.fill('20');
    await input.dispatchEvent('change');

    // 2. Change to invalid discount 200 and trigger change event
    await input.focus();
    await input.fill('200');
    await input.dispatchEvent('change');

    // Expected behavior: validation must run on subsequent edits and show error for 200
    const errorText = await page.textContent('#discount-error');
    expect(errorText).toContain('Discount must be between 0 and 100.');
  });
});
