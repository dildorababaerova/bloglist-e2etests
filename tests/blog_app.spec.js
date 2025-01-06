const { test, expect, describe, beforeEach } = require('@playwright/test');
const { loginWith, createBlog } = require('./helper');

describe('Blog app', () => {
    beforeEach(async ({ page, request }) => {
        // Reset the database and create a test user
        await request.post('http://localhost:3003/api/testing/reset');
        await request.post('http://localhost:3003/api/users', {
            data: {
                name: 'smart',
                username: 'sabi',
                password: 'Rahim'
            }
        });
        // Navigate to the app
        await page.goto('http://localhost:5173');
    });

    test('Login form is shown', async ({ page }) => {
        const locator = await page.getByText('Tervetuloa Blog:lle');
        await expect(locator).toBeVisible();
        await expect(page.getByText('Note app, Department of Computer Science, University of Helsinki 2024')).toBeVisible();
    });

    test('login form can be opened', async ({ page }) => {
        await loginWith(page, 'sabi', 'Rahim');
        await expect(page.getByText('smart logged in')).toBeVisible();
        const successDiv = page.locator('.success');
        await expect(successDiv).toContainText('Login successful');
    });

    test('login form with wrong password', async ({ page }) => {
        await loginWith(page, 'sabi', 'wrong');
        const errorDiv = page.locator('.error');
        await expect(errorDiv).toContainText('wrong username or password');
    });

    describe('when logged in', () => {
        beforeEach(async ({ page }) => {
            await loginWith(page, 'sabi', 'Rahim');
            const successDiv = page.locator('.success');
            await expect(successDiv).toContainText('Login successful');
        });

        test('a new blog can be created', async ({ page }) => {
            // Create a blog
            await createBlog(page, 'Test blog created', 'babisha', 'www.test.com', 50);

            // Validate success message
            const successDiv = page.locator('.success');
            await expect(successDiv).toContainText("Blog 'Test blog created' successfully saved");

            // Validate blog details
            const titleBlogText = await page.getByText('Test blog created').first().locator('..');
            await expect(titleBlogText).toBeVisible();
            await page.getByRole('button', { name: 'show' }).first().click();

            await expect(page.getByText('babisha').first()).toBeVisible();
            await expect(page.getByText('www.test.com').first()).toBeVisible();
            const likesValue = await page.getByText('50').first();
            await expect(likesValue).toBeVisible();
        });

        test('a blog can be deleted by its creator', async ({ page }) => {
            await createBlog(page, 'Test must be deleted', 'gugusha', 'www.delete.com', 10);

            const successDiv = page.locator('.success');
            await expect(successDiv).toContainText("Blog 'Test must be deleted' successfully saved");

            await page.getByRole('button', { name: 'show' }).click();

            
            await page.getByTestId('delete-button').click();
            page.on('dialog', async (dialog) => {
              await dialog.accept(); // Принимаем диалог подтверждения
            });
          
            // Ожидаем завершения всех запросов
            // await page.waitForLoadState('networkidle'); // Можно использовать 'networkidle' или другой метод
          
            const successMessage = page.locator('.success');
            await expect(successMessage).toContainText("Blog 'Test must be deleted' successfully deleted");
          });
          

        test('blogs are ordered by likes', async ({ page }) => {
            // Create multiple blogs
            await createBlog(page, 'Blog C', 'Author C', 'https://blog-c.com', 10);
            await createBlog(page, 'Blog B', 'Author B', 'https://blog-b.com', 50);
            await createBlog(page, 'Blog A', 'Author A', 'https://blog-a.com', 30);

            // Validate the order of blogs by likes
            const blogs = await page.locator('.blog-item'); // Adjust selector to match blog container
            const blogsText = await blogs.allTextContents();

            // Expect order: Blog B, Blog A, Blog C
            expect(blogsText).toEqual([
                'Blog B - 50 likes',
                'Blog A - 30 likes',
                'Blog C - 10 likes'
            ]);
        });
    });
});
