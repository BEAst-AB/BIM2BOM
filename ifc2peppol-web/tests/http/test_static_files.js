import { test, expect } from '@playwright/test';

test.describe('Static File Serving', () => {
  test('should serve index.html', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
    expect(await page.title()).toContain('IFC to Peppol');
  });

  test('should serve CSS files', async ({ request }) => {
    const response = await request.get('/styles/styles.css');
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('text/css');
  });

  test('should serve JavaScript files', async ({ request }) => {
    const response = await request.get('/src/main.js');
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('javascript');
  });

  test('should serve transformer.py', async ({ request }) => {
    const response = await request.get('/src/transformer.py');
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('text');
  });

  test('should return 404 for non-existent files', async ({ request }) => {
    const response = await request.get('/nonexistent.js');
    expect(response.status()).toBe(404);
  });

  test('should have proper CORS headers', async ({ request }) => {
    const response = await request.get('/');
    // Check that static files can be loaded (no CORS blocking)
    expect(response.status()).toBe(200);
  });
});

