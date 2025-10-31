import { test, expect } from '@playwright/test';

test.describe('File Upload', () => {
  test('should show drag and drop zone', async ({ page }) => {
    await page.goto('/');
    
    const dropZone = page.locator('#drop-zone');
    await expect(dropZone).toBeVisible();
    await expect(dropZone).toContainText('Drop your IFC file here');
  });

  test('should validate file extension', async ({ page }) => {
    await page.goto('/');
    
    // This would need to be implemented with actual file upload
    // For now, we verify the file input accepts .ifc files
    const fileInput = page.locator('input[type="file"]');
    const acceptAttr = await fileInput.getAttribute('accept');
    expect(acceptAttr).toBe('.ifc');
  });

  test('should handle file picker click', async ({ page }) => {
    await page.goto('/');
    
    const filePickerBtn = page.locator('#file-picker-btn');
    await filePickerBtn.click();
    
    // File picker dialog should open (can't test directly in Playwright)
    // But we can verify the button is clickable
    await expect(filePickerBtn).toBeEnabled();
  });
});

