/**
 * Test utilities and helpers
 */

/**
 * Wait for Pyodide to be ready
 */
export async function waitForPyodideReady(page, timeout = 300000) {
  await page.waitForFunction(
    () => {
      return window.pyodideReady === true || 
             document.querySelector('[data-status="ready"]') !== null;
    },
    { timeout }
  );
}

/**
 * Upload IFC file
 */
export async function uploadIFCFile(page, filePath) {
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(filePath);
}

/**
 * Wait for transformation to complete
 */
export async function waitForTransformation(page, timeout = 300000) {
  await page.waitForSelector('[data-status="completed"]', { timeout });
}

/**
 * Get transformation statistics
 */
export async function getStats(page) {
  return {
    processed: await page.locator('#stat-processed').textContent(),
    filtered: await page.locator('#stat-filtered').textContent(),
    lines: await page.locator('#stat-lines').textContent(),
    time: await page.locator('#stat-time').textContent(),
  };
}

