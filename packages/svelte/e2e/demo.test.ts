import { expect, test } from '@playwright/test';

test('Home page shows the micro-frontend.', async ({ page }) => {
	await page.goto('/');
	await expect(page.locator('pre')).toBeVisible();
});
test('Button in home page toggles the micro-frontend.', async ({ page }) => {
	await page.goto('/');
	const toggleButton = page.locator('button');
	const piecePre = page.locator('pre');

	await expect(piecePre).toBeVisible();

	await toggleButton.click();
	await expect(piecePre).toBeHidden();

	await toggleButton.click();
	await expect(piecePre).toBeVisible();
});
