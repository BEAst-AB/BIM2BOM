import { test, expect } from '@playwright/test';

test.describe('UI Components', () => {
  test('should have all required UI elements', async ({ page }) => {
    await page.goto('/');
    
    // Check main UI components
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('#drop-zone')).toBeVisible();
    await expect(page.locator('#status-indicator')).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();
  });

  test('should be responsive', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    const dropZone = page.locator('#drop-zone');
    await expect(dropZone).toBeVisible();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(dropZone).toBeVisible();
  });

  test('should have proper accessibility attributes', async ({ page }) => {
    await page.goto('/');
    
    // Check that buttons are accessible
    const filePickerBtn = page.locator('#file-picker-btn');
    await expect(filePickerBtn).toBeVisible();
    
    // Check that file input is accessible
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeVisible();
  });
});

