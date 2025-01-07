const { test, expect, describe, beforeEach } = require('@playwright/test');
const { loginWith, createBlog } = require('./helper');

describe('Blog app', () => {
    beforeEach(async ({ page, request }) => {
        // Reset the database and create a test user
        await request.post('http:/api/testing/reset');
        await request.post('http:/api/users', {
            data: {
                name: 'smart',
                username: 'sabi',
                password: 'Rahim'
            }
        });
        // Navigate to the app
        await page.goto('');
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
            
            page.on('dialog', dialog => dialog.accept());
            await page.getByTestId('delete-button').click();

            // page.once('dialog', async (dialog) => {
            //     expect(dialog.message()).toContain("Delete 'Test must be deleted'?");
            //     await dialog.accept();
            //   });
            await expect(page.locator('.blog-item')).not.toContainText('Test must be deleted');

            // Ожидаем завершения всех запросов
            // await page.waitForLoadState('networkidle'); // Можно использовать 'networkidle' или другой метод
            await page.waitForSelector('.success', { timeout: 20000 });
            const successMessage = page.locator('.success');
            await expect(successMessage).toContainText("Blog 'Test must be deleted' successfully deleted");
          });
          

         test('blogs are ordered by likes', async ({ page }) => {
         // Create multiple blogs
            await createBlog(page, 'Blog C', 'Author C', 'https://blog-c.com', 10);
            const successBlogC = page.locator('.success');
            await expect(successBlogC).toContainText("Blog 'Blog C' successfully saved");

            await createBlog(page, 'Blog B', 'Author B', 'https://blog-b.com', 50);
            const successBlogB = page.locator('.success');
            await expect(successBlogB).toContainText("Blog 'Blog B' successfully saved");

            await createBlog(page, 'Blog A', 'Author A', 'https://blog-a.com', 30);
            const successBlogA = page.locator('.success');
            await expect(successBlogA).toContainText("Blog 'Blog A' successfully saved");

            // Click all "show" buttons for each blog
            const buttons = page.locator('[data-testid="show-button"]');
            for (let i = 0; i < await buttons.count(); i++) {
                await buttons.nth(i).click();
            }

            // Extract blogs and their likes
            const blogs = await page.locator('.blog-item');
            const blogsData = [];
            for (let i = 0; i < await blogs.count(); i++) {
                const title = await blogs.nth(i).locator('[data-testid="blog-title"]').textContent();
                const likesText = await blogs.nth(i).locator('[data-testid="likes"]').textContent();
                const likes = parseInt(likesText.replace('likes: ', '').trim(), 10);
                blogsData.push({ title, likes });
            }

            // Sort blogs by likes in descending order
            const sortedBlogs = blogsData.slice().sort((a, b) => b.likes - a.likes);

            // Validate the order of blogs
            expect(blogsData).toEqual(sortedBlogs);
        });

    });
});
