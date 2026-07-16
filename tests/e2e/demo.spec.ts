import { test, expect } from '@playwright/test';

test('runs the credential-free demo to a report', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /run the broken-repo demo/i }).click();
  await expect(page.getByText(/Readiness/i).first()).toBeVisible();
  await expect(
    page.getByText(/Production build script is missing/i),
  ).toBeVisible();
  await page.getByText(/Production build script is missing/i).click();
  await expect(page.getByText(/reviewable patch/i)).toBeVisible();
  await page.getByRole('button', { name: /mark reviewed/i }).click();
  await expect(
    page.getByRole('button', { name: /mark reviewed/i }),
  ).toHaveClass(/signal-blue/);
});
