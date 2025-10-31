import { test, expect } from '@playwright/test';

test.describe('IFC2Peppol Basic Flow', () => {
  test('should load application and show ready state', async ({ page }) => {
    await page.goto('/');
    
    // Check that main elements are present
    await expect(page.locator('h1')).toContainText('IFC to Peppol');
    await expect(page.locator('#drop-zone')).toBeVisible();
    await expect(page.locator('#status-indicator')).toBeVisible();
  });

  test('should show file picker button', async ({ page }) => {
    await page.goto('/');
    
    const filePickerBtn = page.locator('#file-picker-btn');
    await expect(filePickerBtn).toBeVisible();
    await expect(filePickerBtn).toContainText('Choose File');
  });

  test('should accept file input', async ({ page }) => {
    await page.goto('/');
    
    // Create a dummy IFC file
    const fileInput = page.locator('input[type="file"]');
    
    // Note: This test would need an actual IFC file for full E2E testing
    // For now, we just verify the input exists
    await expect(fileInput).toBeVisible();
  });
});

