import { test, expect } from '@playwright/test';

test.describe('Cart Button Interaction', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8000/');
  });

  test('cart button should open cart after navigating from checkout', async ({ page }) => {
    // Navigate to catalog
    await page.goto('http://localhost:8000/catalog');
    await page.waitForLoadState('networkidle');

    // Find and click first add-to-cart button (if products exist)
    const addToCartBtn = page.locator('button:has-text("Add to Cart")').first();
    if (await addToCartBtn.isVisible()) {
      await addToCartBtn.click();
      
      // Verify cart opens
      await expect(page.locator('#cart-dialog')).toBeVisible({ timeout: 2000 });

      // Proceed to checkout
      const checkoutBtn = page.locator('button:has-text("Proceed to Checkout")');
      await checkoutBtn.click();
      await page.waitForURL(/.*checkout/);

      // Verify body doesn't have overflow:hidden after navigation
      const bodyOverflow = await page.evaluate(() => document.body.style.overflow);
      expect(bodyOverflow).not.toBe('hidden');

      // Navigate back
      await page.goBack();
      await page.waitForLoadState('networkidle');

      // Click cart button in navigation
      const cartBtn = page.locator('.arc-nav-cart-btn');
      await cartBtn.click();

      // Cart should open without issues
      await expect(page.locator('#cart-dialog')).toBeVisible({ timeout: 2000 });
    }
  });

  test('should handle multiple cart open/close cycles', async ({ page }) => {
    await page.goto('http://localhost:8000/catalog');
    await page.waitForLoadState('networkidle');

    // Test 3 consecutive open/close cycles
    for (let i = 0; i < 3; i++) {
      // Open cart
      const cartBtn = page.locator('.arc-nav-cart-btn');
      await cartBtn.click();
      await expect(page.locator('#cart-dialog')).toBeVisible();

      // Close cart with close button
      const closeBtn = page.locator('[aria-label="Close cart"]');
      await closeBtn.click();
      await expect(page.locator('#cart-dialog')).not.toBeVisible();

      // Verify body overflow is cleared
      const bodyOverflow = await page.evaluate(() => document.body.style.overflow);
      expect(bodyOverflow).toBe('');
    }
  });

  test('should close cart with escape key', async ({ page }) => {
    await page.goto('http://localhost:8000/catalog');
    
    // Open cart
    await page.click('.arc-nav-cart-btn');
    await expect(page.locator('#cart-dialog')).toBeVisible();

    // Press escape
    await page.keyboard.press('Escape');
    await expect(page.locator('#cart-dialog')).not.toBeVisible();

    // Verify scroll is unlocked
    const bodyOverflow = await page.evaluate(() => document.body.style.overflow);
    expect(bodyOverflow).toBe('');
  });

  test('should close cart when clicking backdrop', async ({ page }) => {
    await page.goto('http://localhost:8000/catalog');
    
    // Open cart
    await page.click('.arc-nav-cart-btn');
    await expect(page.locator('#cart-dialog')).toBeVisible();

    // Click backdrop (the overlay behind the cart)
    await page.locator('.arc-glass-backdrop').click({ force: true });
    await expect(page.locator('#cart-dialog')).not.toBeVisible();

    // Verify scroll is unlocked
    const bodyOverflow = await page.evaluate(() => document.body.style.overflow);
    expect(bodyOverflow).toBe('');
  });
});
