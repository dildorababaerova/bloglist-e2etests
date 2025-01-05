const { test, expect, describe, beforeEach } = require('@playwright/test');

describe('Blog app', () => {
    beforeEach(async ({ page }) => {
        await page.goto('http://localhost:5173');
    });

    test('Login form is shown', async ({ page }) => {
        const locator = await page.getByText('Tervetuloa Blog:lle');
        await expect(locator).toBeVisible();
        await expect(page.getByText('Note app, Department of Computer Science, University of Helsinki 2024')).toBeVisible();
    });

    test('login form can be opened', async ({ page }) => {
        await page.getByRole('button', { name: 'login' }).click();
        await page.getByTestId('username').fill('sabi');
        await page.getByTestId('password').fill('Rahim');
        await page.getByRole('button', { name: 'login' }).click();

        const successDiv = page.locator('.success');
        await expect(successDiv).toContainText('Login successful');
    });

    describe('when logged in', () => {
        beforeEach(async ({ page }) => {
            await page.getByRole('button', { name: 'login' }).click();
            await page.getByTestId('username').fill('sabi');
            await page.getByTestId('password').fill('Rahim');
            await page.getByRole('button', { name: 'login' }).click();

            const successDiv = page.locator('.success');
            await expect(successDiv).toContainText('Login successful');
        });

        test('a new blog can be created', async ({ page }) => {
            await page.getByRole('button', { name: 'create new blog' }).click();
            await page.getByTestId('title').fill('Test blog created');
            await page.getByTestId('author').fill('babisha');
            await page.getByTestId('url').fill('www.test.com');
            await page.getByTestId('likes').fill('50');

            await page.getByRole('button', { name: 'create' }).click();

            // Validate success message
            const successDiv = page.locator('.success');
            await expect(successDiv).toContainText("Blog 'Test blog created' successfully saved");

            // Validate blog details
            await expect(page.getByText('Test blog created')).toBeVisible();
            await expect(page.getByText('babisha')).toBeVisible();
            await expect(page.getByText('www.test.com')).toBeVisible();

            // Validate likes (if displayed as a number, use its container instead of the input field)
            const likesValue = await page.getByTestId('likes').evaluate((input) => Number(input.value));
            expect(likesValue).toBe(50);
        });
    });
});
