import { test, expect } from '@playwright/test';

/**
 * Authentication Tests
 * 
 * Tests login flow and protected routes
 */

test.describe('Authentication', () => {
    test('should redirect to /auth when not authenticated', async ({ page }) => {
        await page.goto('/');
        await page.waitForURL(/\/auth/, { timeout: 10000 });
        
        // Should be on auth page
        expect(page.url()).toContain('/auth');
    });

    test('should redirect to auth for protected routes', async ({ page }) => {
        await page.goto('/central');
        await page.waitForURL(/\/auth/, { timeout: 10000 });
        
        // Should redirect to auth with returnUrl
        expect(page.url()).toContain('/auth');
        expect(page.url()).toContain('returnUrl');
    });

    test('auth page loads correctly', async ({ page }) => {
        await page.goto('/auth');
        
        // Should see auth interface (Telegram or form)
        const hasAuthContent = await page.locator('text=/telegram|entrar|login|acesso/i').first().isVisible({ timeout: 5000 });
        expect(hasAuthContent).toBeTruthy();
    });
});
